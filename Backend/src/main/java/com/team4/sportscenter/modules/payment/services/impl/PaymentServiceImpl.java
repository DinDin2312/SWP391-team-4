package com.team4.sportscenter.modules.payment.services.impl;

import com.team4.sportscenter.config.VNPayConfig;
import com.team4.sportscenter.config.MoMoConfig;
import com.team4.sportscenter.config.PayOSConfig;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.HttpEntity;
import com.team4.sportscenter.modules.auth.entities.User;
import com.team4.sportscenter.modules.auth.repositories.UserRepository;
import com.team4.sportscenter.modules.member.entities.Booking;
import com.team4.sportscenter.modules.member.entities.GymClass;
import com.team4.sportscenter.modules.member.repositories.BookingRepository;
import com.team4.sportscenter.modules.member.repositories.UserMembershipRepository;
import com.team4.sportscenter.modules.member.entities.UserMembership;
import com.team4.sportscenter.modules.payment.dtos.CartItemDto;
import com.team4.sportscenter.modules.payment.dtos.CartResponse;
import com.team4.sportscenter.modules.payment.entities.Invoice;
import com.team4.sportscenter.modules.payment.entities.InvoiceDetail;
import com.team4.sportscenter.modules.payment.entities.PaymentEntity;
import com.team4.sportscenter.modules.payment.repositories.InvoiceDetailRepository;
import com.team4.sportscenter.modules.payment.repositories.InvoiceRepository;
import com.team4.sportscenter.modules.payment.repositories.PaymentRepository;
import com.team4.sportscenter.modules.payment.services.PaymentService;
import com.team4.sportscenter.modules.notification.services.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings({"SqlResolve", "SqlNoDataSourceInspection"})
public class PaymentServiceImpl implements PaymentService {

    private final BookingRepository bookingRepository;
    private final UserMembershipRepository userMembershipRepository;
    private final UserRepository userRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceDetailRepository invoiceDetailRepository;
    private final PaymentRepository paymentRepository;
    private final VNPayConfig vnPayConfig;
    private final PayOSConfig payOSConfig;
    private final org.springframework.jdbc.core.JdbcTemplate jdbc;
    private final com.team4.sportscenter.modules.member.services.PackageCommerceService commerce;
    private final NotificationService notificationService;
    private final com.team4.sportscenter.modules.manager.services.PackageTypeCatalog packageTypes;
    private final com.team4.sportscenter.modules.support.repositories.UserCreditRepository userCreditRepository;

    @Override
        public CartResponse getCartItems(String email) {
        List<Booking> pendingBookings = bookingRepository.findAllBookingsByEmail(email)
                .stream()
                .filter(b -> "PENDING".equals(b.getStatus()))
                .toList();

        Map<GymClass, List<Booking>> groupedByClass = pendingBookings.stream()
                .collect(Collectors.groupingBy(b -> b.getSchedule().getGymClass()));

        List<CartItemDto> items = groupedByClass.entrySet().stream().map(entry -> {
            GymClass gymClass = entry.getKey();
            return CartItemDto.builder()
                    .type("CLASS")
                    .classId(gymClass.getClassId())
                    .className(gymClass.getClassName())
                    .coachName(gymClass.getCoach() != null ? gymClass.getCoach().getFullName() : "Unknown")
                    .price(gymClass.getPrice())
                    .sessionCount(entry.getValue().size())
                    .build();
        }).collect(java.util.stream.Collectors.toList());

        List<UserMembership> pendingMemberships = userMembershipRepository.findByEmailAndStatus(email, "PENDING");

        items.addAll(pendingMemberships.stream().map(m -> 
            CartItemDto.builder()
                .type("PACKAGE")
                .packageId(m.getAPackage().getPackageId())
                .packageName(m.purchasedName())
                .durationDays(m.purchasedDuration())
                .price(m.purchasedPrice())
                .build()
        ).toList());

        BigDecimal totalPrice = items.stream()
                .map(CartItemDto::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Integer pendingInvId = null;
        String pendingUrl = null;
        String pendingMethod = null;
        boolean hasPending = false;
        try {
            List<Map<String, Object>> pendingInvoices = jdbc.queryForList(
                "SELECT i.invoice_id, p.payment_method FROM INVOICES i " +
                "JOIN USERS u ON u.user_id = i.user_id " +
                "LEFT JOIN PAYMENTS p ON p.invoice_id = i.invoice_id " +
                "WHERE u.email = ? AND i.status = 'PENDING' AND i.created_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE) " +
                "ORDER BY i.invoice_id DESC LIMIT 1",
                email
            );
            if (!pendingInvoices.isEmpty()) {
                hasPending = true;
                Map<String, Object> row = pendingInvoices.get(0);
                pendingInvId = ((Number) row.get("invoice_id")).intValue();
                pendingMethod = row.get("payment_method") != null ? String.valueOf(row.get("payment_method")) : "PAYOS";
                if ("PAYOS".equalsIgnoreCase(pendingMethod) || "VIETQR".equalsIgnoreCase(pendingMethod)) {
                    pendingUrl = "/member/vietqr-pay?invoiceId=" + pendingInvId;
                }
            }
        } catch (Exception ignored) {}

        return CartResponse.builder()
                .hasPendingCheckout(hasPending)
                .pendingInvoiceId(pendingInvId)
                .pendingPaymentUrl(pendingUrl)
                .pendingPaymentMethod(pendingMethod)
                .items(items)
                .totalPrice(totalPrice)
                .build();
    }

    @Override
    @Transactional
    public String checkout(String email, String ipAddress, String paymentMethod) {
        return checkout(email, ipAddress, paymentMethod, null, false);
    }

    private void cancelPendingInvoicesForUser(Integer userId) {
        if (userId == null || userId == 0) return;
        List<Integer> pendingInvoiceIds = jdbc.queryForList(
            "SELECT invoice_id FROM INVOICES WHERE user_id=? AND status='PENDING'",
            Integer.class, userId
        );
        for (Integer invId : pendingInvoiceIds) {
            jdbc.update("UPDATE INVOICES SET status='CANCELLED' WHERE invoice_id=?", invId);
            jdbc.update("UPDATE PAYMENTS SET status='CANCELLED' WHERE invoice_id=? AND status='PENDING'", invId);
            userCreditRepository.findByUsedInvoiceId(invId).ifPresent(credit -> {
                credit.setUsedInvoiceId(null);
                userCreditRepository.save(credit);
            });
            List<UserMembership> memberships = userMembershipRepository.findByCheckoutInvoiceId(invId);
            for (UserMembership m : memberships) {
                m.setCheckoutInvoiceId(null);
                userMembershipRepository.save(m);
            }
        }
    }

    @Override
    @Transactional
    public void cancelPendingCheckout(String email) {
        bookingRepository.lockOperations();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        cancelPendingInvoicesForUser(user.getUserId());
    }

    @Override
    @Transactional
    public String checkout(String email, String ipAddress, String paymentMethod, String creditCode) {
        return checkout(email, ipAddress, paymentMethod, creditCode, false);
    }

    @Override
    @Transactional
    public String checkout(String email, String ipAddress, String paymentMethod, String creditCode, boolean cancelPending) {
        bookingRepository.lockOperations();
        if (cancelPending) userRepository.findByEmail(email).ifPresent(u -> cancelPendingInvoicesForUser(u.getUserId()));
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        List<Booking> pendingBookings = bookingRepository.findAllBookingsByEmail(email)
                .stream()
                .filter(b -> "PENDING".equals(b.getStatus()))
                .toList();

        List<UserMembership> pendingMemberships = userMembershipRepository.findByEmailAndStatus(email, "PENDING");

        assertCartMutable(email);
        for(var membership:pendingMemberships)commerce.checkPurchase(user.getUserId(),membership.getAPackage().getPackageId(),null,true);
        if (pendingBookings.isEmpty() && pendingMemberships.isEmpty()) {
            throw new RuntimeException("No pending items found in your cart.");
        }

        for (Booking booking : pendingBookings) {
            Integer scheduleId = booking.getSchedule().getScheduleId();
            Integer bookedSlots = bookingRepository.countBookedSlots(scheduleId);
            Integer maxSlots = booking.getSchedule().getGymClass().getMaxSlots();
            
            if (bookedSlots >= maxSlots) {
                throw new RuntimeException("Checkout failed! The class '" + 
booking.getSchedule().getGymClass().getClassName() + "' on " + booking.getSchedule().getStartTime() + " is now fully booked by others.");
            }
        }

        BigDecimal totalAmount = BigDecimal.ZERO;
        Map<GymClass, List<Booking>> groupedByClass = pendingBookings.stream()
                .collect(Collectors.groupingBy(b -> b.getSchedule().getGymClass()));
                
        for (GymClass gymClass : groupedByClass.keySet()) {
            if (gymClass.getPrice() != null) {
                totalAmount = totalAmount.add(gymClass.getPrice());
            }
        }

        for (UserMembership membership : pendingMemberships) {
            if (membership.purchasedPrice() != null) {
                totalAmount = totalAmount.add(membership.purchasedPrice());
            }
        }
        
        int points = user.getLoyaltyPoints() == null ? 0 : user.getLoyaltyPoints();
        BigDecimal discountFactor = BigDecimal.ONE;
        if (points >= 3000) discountFactor = new BigDecimal("0.85"); // PLATINUM 15% off
        else if (points >= 1500) discountFactor = new BigDecimal("0.90"); // GOLD 10% off
        else if (points >= 500) discountFactor = new BigDecimal("0.95"); // SILVER 5% off
        
        totalAmount = totalAmount.multiply(discountFactor).setScale(0, java.math.RoundingMode.HALF_UP);

        com.team4.sportscenter.modules.support.entities.UserCredit appliedCredit = null;
        BigDecimal creditDiscount = BigDecimal.ZERO;
        if (creditCode != null && !creditCode.trim().isEmpty()) {
            appliedCredit = userCreditRepository.findByCreditCode(creditCode.trim().toUpperCase())
                    .orElseThrow(() -> new IllegalArgumentException("MĂ£ tĂ­n dá»¥ng khĂ´ng há»£p lá»‡ / Invalid credit code: " + creditCode));
            if (!appliedCredit.getUser().getUserId().equals(user.getUserId())) {
                throw new IllegalArgumentException("MĂ£ tĂ­n dá»¥ng khĂ´ng thuá»™c vá» báº¡n / Credit code does not belong to your account");
            }
            if (appliedCredit.getStatus() != com.team4.sportscenter.modules.support.enums.CreditStatus.ACTIVE) {
                throw new IllegalArgumentException("MĂ£ tĂ­n dá»¥ng Ä‘Ă£ háº¿t háº¡n hoáº·c Ä‘Ă£ Ä‘Æ°á»£c sá»­ dá»¥ng / Credit is no longer active");
            }
            if (appliedCredit.getExpiryDate().isBefore(java.time.LocalDate.now())) {
                appliedCredit.setStatus(com.team4.sportscenter.modules.support.enums.CreditStatus.EXPIRED);
                userCreditRepository.save(appliedCredit);
                throw new IllegalArgumentException("MĂ£ tĂ­n dá»¥ng Ä‘Ă£ quĂ¡ háº¡n sá»­ dá»¥ng / Credit code has expired");
            }
            creditDiscount = appliedCredit.getRemainingAmount();
            if (creditDiscount.compareTo(totalAmount) >= 0) {
                creditDiscount = totalAmount;
                totalAmount = BigDecimal.ZERO;
            } else {
                totalAmount = totalAmount.subtract(creditDiscount);
            }
        }

        Invoice invoice = Invoice.builder()
                .user(user)
                .totalAmount(totalAmount)
                .status("PENDING") 
                .createdAt(LocalDateTime.now())
                .build();
        invoice = invoiceRepository.saveAndFlush(invoice);

        if (appliedCredit != null) {
            appliedCredit.setUsedInvoiceId(invoice.getInvoiceId());
            if (totalAmount.signum() == 0) {
                appliedCredit.setRemainingAmount(appliedCredit.getRemainingAmount().subtract(creditDiscount));
                if (appliedCredit.getRemainingAmount().signum() <= 0) {
                    appliedCredit.setStatus(com.team4.sportscenter.modules.support.enums.CreditStatus.USED);
                }
            }
            userCreditRepository.save(appliedCredit);
        }

        for(var booking:pendingBookings)jdbc.update("INSERT INTO INVOICE_BOOKINGS(invoice_id,booking_id) VALUES(?,?)",invoice.getInvoiceId(),booking.getBookingId());
        for (Map.Entry<GymClass, List<Booking>> entry : groupedByClass.entrySet()) {
            GymClass gymClass = entry.getKey();
            InvoiceDetail detail = InvoiceDetail.builder()
                    .invoice(invoice)
                    .gymClass(gymClass)
                    .unitPrice(gymClass.getPrice())
                    .build();
            invoiceDetailRepository.save(detail);
        }

        for (UserMembership membership : pendingMemberships) {
            membership.setCheckoutInvoiceId(invoice.getInvoiceId());userMembershipRepository.save(membership);
            InvoiceDetail detail = InvoiceDetail.builder()
                    .invoice(invoice)
                    .aPackage(membership.getAPackage()).membershipId(membership.getMembershipId())
                    .unitPrice(membership.purchasedPrice())
                    .build();
            invoiceDetailRepository.save(detail);
        }

        String resolvedMethod = "momo".equalsIgnoreCase(paymentMethod) ? "MOMO" :
                ("payos".equalsIgnoreCase(paymentMethod) || "vietqr".equalsIgnoreCase(paymentMethod)) ? "PAYOS" : "VNPAY";

        PaymentEntity payment = PaymentEntity.builder()
                .invoice(invoice)
                .amount(totalAmount)
                .paymentMethod(resolvedMethod)
                .status("PENDING")
                .paymentDate(LocalDateTime.now())
                .build();
        paymentRepository.saveAndFlush(payment);
        if(totalAmount.signum()==0){finishPayment(invoice,true,appliedCredit!=null?("CREDIT-"+appliedCredit.getCreditCode()):("FREE-"+invoice.getInvoiceId()));return "/member/memberships";}

        if ("payos".equalsIgnoreCase(paymentMethod) || "vietqr".equalsIgnoreCase(paymentMethod)) {
            return createPayOSUrl(invoice.getInvoiceId(), totalAmount, user);
        }

        if ("momo".equalsIgnoreCase(paymentMethod)) {
            try {
                String orderId = invoice.getInvoiceId().toString() + "_" + System.currentTimeMillis();
                String requestId = UUID.randomUUID().toString();
                String amountStr = String.valueOf(totalAmount.longValue());
                String orderInfo = "Thanh toan hoa don " + orderId;
                String requestType = "captureWallet";
                String extraData = "";
                
                String rawHash = "accessKey=" + MoMoConfig.ACCESS_KEY +
                        "&amount=" + amountStr +
                        "&extraData=" + extraData +
                        "&ipnUrl=" + MoMoConfig.IPN_URL +
                        "&orderId=" + orderId +
                        "&orderInfo=" + orderInfo +
                        "&partnerCode=" + MoMoConfig.PARTNER_CODE +
                        "&redirectUrl=" + MoMoConfig.RETURN_URL +
                        "&requestId=" + requestId +
                        "&requestType=" + requestType;
                        
                String signature = MoMoConfig.signHmacSHA256(rawHash, MoMoConfig.SECRET_KEY);
                
                Map<String, Object> requestBody = new HashMap<>();
                requestBody.put("partnerCode", MoMoConfig.PARTNER_CODE);
                requestBody.put("partnerName", "Test Merchant");
                requestBody.put("storeId", "TestStore");
                requestBody.put("requestId", requestId);
                requestBody.put("amount", totalAmount.longValue());
                requestBody.put("orderId", orderId);
                requestBody.put("orderInfo", orderInfo);
                requestBody.put("redirectUrl", MoMoConfig.RETURN_URL);
                requestBody.put("ipnUrl", MoMoConfig.IPN_URL);
                requestBody.put("lang", "vi");
                requestBody.put("extraData", extraData);
                requestBody.put("requestType", requestType);
                requestBody.put("signature", signature);
                
                RestTemplate restTemplate = new RestTemplate();
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
                
                @SuppressWarnings("unchecked")
                Map<String, Object> response = restTemplate.postForObject(MoMoConfig.ENDPOINT, entity, Map.class);
                if (response != null && response.containsKey("payUrl")) {
                    return (String) response.get("payUrl");
                } else {
                    throw new RuntimeException("Failed to generate MoMo payment URL: " + response);
                }
            } catch (Exception e) {
                throw new RuntimeException("Error processing MoMo payment: " + e.getMessage());
            }
        }
        
        return createVNPayUrl(invoice.getInvoiceId(), totalAmount, ipAddress);
    }

    private String createPayOSUrl(Integer invoiceId, BigDecimal amount, User user) {
        if (payOSConfig.isConfigured()) {
            try {
                long orderCode = invoiceId.longValue();
                long amountVal = amount.longValue();
                String description = "HD " + invoiceId;
                String returnUrl = payOSConfig.returnUrl;
                String cancelUrl = payOSConfig.cancelUrl;

                String rawSignature = "amount=" + amountVal +
                        "&cancelUrl=" + cancelUrl +
                        "&description=" + description +
                        "&orderCode=" + orderCode +
                        "&returnUrl=" + returnUrl;

                String signature = PayOSConfig.signHmacSHA256(rawSignature, payOSConfig.checksumKey);

                Map<String, Object> requestBody = new HashMap<>();
                requestBody.put("orderCode", orderCode);
                requestBody.put("amount", amountVal);
                requestBody.put("description", description);
                requestBody.put("returnUrl", returnUrl);
                requestBody.put("cancelUrl", cancelUrl);
                requestBody.put("signature", signature);
                if (user != null) {
                    if (user.getFullName() != null && !user.getFullName().isBlank()) {
                        requestBody.put("buyerName", user.getFullName());
                    }
                    if (user.getEmail() != null && !user.getEmail().isBlank()) {
                        requestBody.put("buyerEmail", user.getEmail());
                    }
                    if (user.getPhone() != null && !user.getPhone().isBlank()) {
                        requestBody.put("buyerPhone", user.getPhone());
                    }
                }

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.set("x-client-id", payOSConfig.clientId);
                headers.set("x-api-key", payOSConfig.apiKey);

                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
                RestTemplate restTemplate = new RestTemplate();
                String endpoint = payOSConfig.endpoint + "/v2/payment-requests";

                @SuppressWarnings("unchecked")
                Map<String, Object> response = restTemplate.postForObject(endpoint, entity, Map.class);
                if (response != null) {
                    String code = String.valueOf(response.get("code"));
                    if ("00".equals(code) || "0".equals(code)) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> data = (Map<String, Object>) response.get("data");
                        if (data != null && data.containsKey("checkoutUrl")) {
                            return (String) data.get("checkoutUrl");
                        }
                    }
                }
            } catch (Exception e) {
                // If PayOS credentials fail or offline, smoothly fallback to direct VietQR
            }
        }

        // Direct bank transfer mode: redirect to internal VietQR payment page
        return "/member/vietqr-pay?invoiceId=" + invoiceId;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getVietQRInfo(Integer invoiceId, String userEmail) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hóa đơn / Invoice not found: " + invoiceId));

        long amount = invoice.getTotalAmount() != null ? invoice.getTotalAmount().longValue() : 0L;
        String desc = "HD " + invoiceId;
        String qrUrl = payOSConfig.buildVietQRUrl(amount, desc);

        Map<String, Object> res = new HashMap<>();
        res.put("invoiceId", invoice.getInvoiceId());
        res.put("amount", amount);
        res.put("bankId", payOSConfig.getNormalizedBankId());
        res.put("bankName", payOSConfig.getBankDisplayName());
        res.put("accountNo", (payOSConfig.accountNo != null && !payOSConfig.accountNo.isBlank()) ? payOSConfig.accountNo : "0386789999");
        res.put("accountName", (payOSConfig.accountName != null && !payOSConfig.accountName.isBlank()) ? payOSConfig.accountName : "SPORTS CENTER");
        res.put("description", desc);
        res.put("qrUrl", qrUrl);
        res.put("status", invoice.getStatus());
        return res;
    }

    @Override
    @Transactional
    public Map<String, Object> confirmVietQRPayment(Integer invoiceId, String userEmail) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hóa đơn / Invoice not found: " + invoiceId));

        if ("PAID".equals(invoice.getStatus())) {
            return Map.of("success", true, "status", "PAID", "message", "Hóa đơn đã được thanh toán thành công.");
        }

        finishPayment(invoice, true, "VIETQR-HD" + invoiceId);

        return Map.of(
                "success", true,
                "status", "PAID",
                "message", "Thanh toán thành công! Khóa học/gói tập của bạn đã được kích hoạt."
        );
    }

    private String createVNPayUrl(Integer invoiceId, BigDecimal amount, String ipAddress) {
        long amountInVND = amount.longValue() * 100;
        
        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", "2.1.0");
        vnp_Params.put("vnp_Command", "pay");
        vnp_Params.put("vnp_TmnCode", vnPayConfig.vnp_TmnCode);
        vnp_Params.put("vnp_Amount", String.valueOf(amountInVND));
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", String.valueOf(invoiceId));
        vnp_Params.put("vnp_OrderInfo", "Thanh toan hoa don " + invoiceId);
        vnp_Params.put("vnp_OrderType", "other");
        vnp_Params.put("vnp_BankCode", "NCB"); // Payment provider configuration.
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", vnPayConfig.vnp_ReturnUrl);
        vnp_Params.put("vnp_IpAddr", ipAddress);

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String vnp_CreateDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);
        
        cld.add(Calendar.MINUTE, 15);
        String vnp_ExpireDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);
        
        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnp_Params.get(fieldName);
            if ((fieldValue != null) && (!fieldValue.isEmpty())) {
                //Build hash data
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                //Build query
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }
        String queryUrl = query.toString();
        String vnp_SecureHash = com.team4.sportscenter.config.VNPayConfig.hmacSHA512(vnPayConfig.vnp_HashSecret, hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;
        return vnPayConfig.vnp_Url + "?" + queryUrl;
    }

    @Override
    @Transactional
    public void handleVNPayCallback(Map<String,String> input){
        bookingRepository.lockOperations();var query=new HashMap<>(input);
        String hash=query.remove("vnp_SecureHash");query.remove("vnp_SecureHashType");
        if(hash==null||!java.security.MessageDigest.isEqual(vnPayConfig.hashAllFields(query).getBytes(StandardCharsets.UTF_8),hash.getBytes(StandardCharsets.UTF_8)))throw new IllegalArgumentException("Invalid signature");
        var invoice=invoiceRepository.findById(Integer.parseInt(query.get("vnp_TxnRef"))).orElseThrow();
        if(!"VNPAY".equals(paymentMethod(invoice)))throw new IllegalArgumentException("Payment method mismatch");
        if(new BigDecimal(query.get("vnp_Amount")).compareTo(invoice.getTotalAmount().multiply(new BigDecimal("100")))!=0)throw new IllegalArgumentException("Payment amount mismatch");
        finishPayment(invoice,"00".equals(query.get("vnp_ResponseCode")),query.get("vnp_TransactionNo"));
    }

    @Override
    @Transactional
    public void removeFromCart(String email, Integer classId) {
        bookingRepository.lockOperations();
        assertCartMutable(email);
        List<Booking> pendingBookings = bookingRepository.findAllBookingsByEmail(email)
                .stream()
                .filter(b -> "PENDING".equals(b.getStatus()) && b.getSchedule().getGymClass().getClassId().equals(classId))
                .toList();
                
        if (!pendingBookings.isEmpty()) {
            for(var b:pendingBookings){
                Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM INVOICE_BOOKINGS WHERE booking_id=?",Integer.class,b.getBookingId());
                if(count != null && count > 0){b.setStatus("CANCELLED");bookingRepository.save(b);}else bookingRepository.delete(b);
            }
        }
    }

    @Override
    @Transactional
    public void removePackageFromCart(String email, Integer packageId) {
        bookingRepository.lockOperations();
        assertCartMutable(email);
        List<com.team4.sportscenter.modules.member.entities.UserMembership> memberships = userMembershipRepository.findByEmailAndStatus(email, "PENDING").stream().filter(m -> m.getAPackage().getPackageId().equals(packageId)).toList();
        if (!memberships.isEmpty()) {
            for(var m:memberships){if(m.getCheckoutInvoiceId()!=null){m.setStatus("CANCELLED");userMembershipRepository.save(m);}else userMembershipRepository.delete(m);}
        }
    }

    @Override
    @Transactional
    public void clearCart(String email) {
        bookingRepository.lockOperations();
        assertCartMutable(email);
        List<Booking> pendingBookings = bookingRepository.findAllBookingsByEmail(email)
                .stream().filter(b -> "PENDING".equals(b.getStatus())).toList();
        if (!pendingBookings.isEmpty()) {
            bookingRepository.deleteAll(pendingBookings);
        }
        
        List<com.team4.sportscenter.modules.member.entities.UserMembership> pendingMemberships = userMembershipRepository.findByEmailAndStatus(email, "PENDING");
        if (!pendingMemberships.isEmpty()) {
            for(var m:pendingMemberships){if(m.getCheckoutInvoiceId()!=null){m.setStatus("CANCELLED");userMembershipRepository.save(m);}else userMembershipRepository.delete(m);}
        }
    }

    @Override
    @Transactional
    public void cancelPendingCheckout(String email, Integer invoiceId) {
        bookingRepository.lockOperations();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Invoice invoice;
        if (invoiceId != null) {
            invoice = invoiceRepository.findById(invoiceId)
                    .filter(i -> i.getUser().getUserId().equals(user.getUserId()))
                    .orElse(null);
        } else {
            List<Invoice> pendingList = invoiceRepository.findByUser_EmailOrderByCreatedAtDesc(email)
                    .stream()
                    .filter(i -> "PENDING".equals(i.getStatus()) && i.getCreatedAt() != null && i.getCreatedAt().isAfter(LocalDateTime.now().minusMinutes(15)))
                    .toList();
            invoice = pendingList.isEmpty() ? null : pendingList.get(0);
        }

        if (invoice == null || !"PENDING".equals(invoice.getStatus())) {
            return;
        }

        invoice.setStatus("CANCELLED");
        invoiceRepository.save(invoice);

        paymentRepository.findByInvoice_InvoiceId(invoice.getInvoiceId()).ifPresent(p -> {
            p.setStatus("CANCELLED");
            paymentRepository.save(p);
        });

        userCreditRepository.findByUsedInvoiceId(invoice.getInvoiceId()).ifPresent(c -> {
            c.setUsedInvoiceId(null);
            userCreditRepository.save(c);
        });

        var memberships = userMembershipRepository.findByCheckoutInvoiceId(invoice.getInvoiceId());
        for (var m : memberships) {
            m.setCheckoutInvoiceId(null);
            userMembershipRepository.save(m);
        }

        jdbc.update("DELETE FROM INVOICE_BOOKINGS WHERE invoice_id=?", invoice.getInvoiceId());

        jdbc.update("INSERT INTO AUDIT_LOGS(actor_email,action,entity_type,entity_id,details,created_at) VALUES(?,'CHECKOUT_CANCELLED','INVOICE',?,?,NOW())",
                email, String.valueOf(invoice.getInvoiceId()), "Checkout cancelled by member");
    }

    @Override
    @Transactional
    public void handleMoMoCallback(Map<String,String> query){
        bookingRepository.lockOperations();
        StringBuilder raw = new StringBuilder("accessKey=").append(MoMoConfig.ACCESS_KEY);
        for(String key:List.of("amount","extraData","message","orderId","orderInfo","orderType","partnerCode","payType","requestId","responseTime","resultCode","transId")) {
            raw.append("&").append(key).append("=").append(query.getOrDefault(key, ""));
        }
        try{if(query.get("signature")==null||!java.security.MessageDigest.isEqual(MoMoConfig.signHmacSHA256(raw.toString(),MoMoConfig.SECRET_KEY).getBytes(StandardCharsets.UTF_8),query.get("signature").getBytes(StandardCharsets.UTF_8)))throw new IllegalArgumentException("Invalid signature");}
        catch(IllegalArgumentException e){throw e;}catch(Exception e){throw new IllegalStateException(e);}
        var invoice=invoiceRepository.findById(Integer.parseInt(query.get("orderId").split("_")[0])).orElseThrow();
        if(!"MOMO".equals(paymentMethod(invoice)))throw new IllegalArgumentException("Payment method mismatch");
        if(new BigDecimal(query.get("amount")).compareTo(invoice.getTotalAmount())!=0)throw new IllegalArgumentException("Payment amount mismatch");
        finishPayment(invoice,"0".equals(query.get("resultCode")),query.get("transId"));
    }

    @Override
    @Transactional
    public void handlePayOSCallback(Map<String, String> query) {
        bookingRepository.lockOperations();
        String orderCodeStr = query.get("orderCode");
        if (orderCodeStr == null || orderCodeStr.isBlank()) {
            throw new IllegalArgumentException("Missing PayOS orderCode");
        }
        int invoiceId = Integer.parseInt(orderCodeStr);
        var invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found: " + invoiceId));
        if (!"PAYOS".equals(paymentMethod(invoice))) {
            throw new IllegalArgumentException("Payment method mismatch for invoice " + invoiceId);
        }

        if (Set.of("PAID", "REVIEW").contains(invoice.getStatus())) {
            return;
        }

        boolean isCancel = "true".equalsIgnoreCase(query.get("cancel")) || "CANCELLED".equalsIgnoreCase(query.get("status"));
        boolean isSuccess = "00".equals(query.get("code")) || "PAID".equalsIgnoreCase(query.get("status"));
        String transactionNo = query.getOrDefault("id", "PAYOS-" + invoiceId);

        if (payOSConfig.isConfigured() && !isCancel) {
            try {
                HttpHeaders headers = new HttpHeaders();
                headers.set("x-client-id", payOSConfig.clientId);
                headers.set("x-api-key", payOSConfig.apiKey);
                HttpEntity<?> entity = new HttpEntity<>(headers);
                RestTemplate restTemplate = new RestTemplate();
                String endpoint = payOSConfig.endpoint + "/v2/payment-requests/" + invoiceId;
                @SuppressWarnings("unchecked")
                Map<String, Object> resp = restTemplate.exchange(endpoint, org.springframework.http.HttpMethod.GET, entity, Map.class).getBody();
                if (resp != null) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> data = (Map<String, Object>) resp.get("data");
                    if (data != null) {
                        String realStatus = String.valueOf(data.get("status"));
                        isSuccess = "PAID".equalsIgnoreCase(realStatus);
                        if (data.containsKey("id")) {
                            transactionNo = String.valueOf(data.get("id"));
                        }
                    }
                }
            } catch (Exception ignored) {
            }
        }

        finishPayment(invoice, isSuccess && !isCancel, transactionNo);
    }

    @Override
    @Transactional
    public void handlePayOSWebhook(Map<String, Object> webhookBody) {
        if (webhookBody == null) return;
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) webhookBody.get("data");
        if (data == null) return;

        String signature = (String) webhookBody.get("signature");
        if (payOSConfig.isConfigured() && signature != null) {
            boolean valid = payOSConfig.verifyWebhookData(data, signature);
            if (!valid) {
                throw new IllegalArgumentException("Invalid PayOS webhook signature");
            }
        }

        Object orderCodeObj = data.get("orderCode");
        if (orderCodeObj == null) return;
        int invoiceId = Integer.parseInt(String.valueOf(orderCodeObj));

        bookingRepository.lockOperations();
        var maybeInvoice = invoiceRepository.findById(invoiceId);
        if (maybeInvoice.isEmpty()) {
            return;
        }
        var invoice = maybeInvoice.get();
        if (!"PAYOS".equals(paymentMethod(invoice))) {
            return;
        }

        if (Set.of("PAID", "REVIEW").contains(invoice.getStatus())) {
            return;
        }

        boolean isPaid = "00".equals(webhookBody.get("code")) || "00".equals(data.get("code")) || "PAID".equalsIgnoreCase(String.valueOf(data.get("desc")));
        String transactionNo = String.valueOf(data.getOrDefault("reference", data.getOrDefault("paymentLinkId", "PAYOS-" + invoiceId)));

        finishPayment(invoice, isPaid, transactionNo);
    }

    private String paymentMethod(Invoice invoice){return paymentRepository.findByInvoice_InvoiceId(invoice.getInvoiceId()).orElseThrow().getPaymentMethod();}

    private void assertCartMutable(String email){
        Integer held=jdbc.queryForObject("SELECT COUNT(*) FROM INVOICES i JOIN USERS u ON u.user_id=i.user_id WHERE u.email=? AND i.status='PENDING' AND i.created_at>DATE_SUB(NOW(),INTERVAL 15 MINUTE)",Integer.class,email);
        if(held != null && held > 0)throw new com.team4.sportscenter.common.exception.PackageRuleException("PACKAGE_CHECKOUT_PENDING","A checkout is awaiting payment. Complete it or wait 15 minutes before changing the cart.");
    }

    private void finishPayment(Invoice invoice,boolean success,String transaction){
        if(Set.of("PAID","REVIEW").contains(invoice.getStatus()))return;
        var payment=paymentRepository.findByInvoice_InvoiceId(invoice.getInvoiceId()).orElseThrow();
        var maybeCredit = userCreditRepository.findByUsedInvoiceId(invoice.getInvoiceId());
        if(!success){
            if (maybeCredit.isPresent()) {
                var c = maybeCredit.get();
                c.setUsedInvoiceId(null);
                userCreditRepository.save(c);
            }
            invoice.setStatus("FAILED");payment.setStatus("FAILED");invoiceRepository.save(invoice);paymentRepository.save(payment);return;
        }
        payment.setStatus("COMPLETED");payment.setTransactionNo(transaction);paymentRepository.save(payment);
        String issue=null;
        var purchased=userMembershipRepository.findByCheckoutInvoiceId(invoice.getInvoiceId());
        List<Integer> bookingIds=jdbc.queryForList("SELECT booking_id FROM INVOICE_BOOKINGS WHERE invoice_id=?",Integer.class,invoice.getInvoiceId());
        var booked=bookingRepository.findAllById(bookingIds);
        try{
            if(!"PENDING".equals(invoice.getStatus())||invoice.getCreatedAt().isBefore(LocalDateTime.now().minusMinutes(15)))throw new IllegalArgumentException("Checkout expired or previously failed");
            Integer expected=jdbc.queryForObject("SELECT COUNT(*) FROM INVOICE_DETAILS WHERE invoice_id=? AND package_id IS NOT NULL",Integer.class,invoice.getInvoiceId());
            if(expected != null && expected != purchased.size())throw new IllegalArgumentException("Invoice membership association missing");
            Integer expectedClasses=jdbc.queryForObject("SELECT COUNT(*) FROM INVOICE_DETAILS WHERE invoice_id=? AND class_id IS NOT NULL",Integer.class,invoice.getInvoiceId());
            if(expectedClasses != null && expectedClasses > 0 && booked.isEmpty())throw new IllegalArgumentException("Invoice booking association missing");
            for(var m:purchased){if(!"PENDING".equals(m.getStatus()))throw new IllegalArgumentException("Purchase is no longer pending");commerce.checkPurchase(m.getUser().getUserId(),m.getAPackage().getPackageId(),invoice.getInvoiceId(),false);}
            for(var b:booked){if(!"PENDING".equals(b.getStatus())||!"SCHEDULED".equals(b.getSchedule().getStatus())||b.getSchedule().getStartTime().isBefore(LocalDateTime.now())||bookingRepository.countBookedSlots(b.getSchedule().getScheduleId())>=b.getSchedule().getGymClass().getMaxSlots())throw new IllegalArgumentException("Session unavailable");}
        }catch(IllegalArgumentException e){issue=e.getMessage();}
        if(issue!=null){invoice.setStatus("REVIEW");invoiceRepository.save(invoice);jdbc.update("INSERT INTO AUDIT_LOGS(actor_email,action,entity_type,entity_id,details,created_at) VALUES(?,'PAYMENT_REVIEW','INVOICE',?,?,NOW())",invoice.getUser().getEmail(),String.valueOf(invoice.getInvoiceId()),"Captured payment needs reconciliation: "+issue);notificationService.createNotification(invoice.getUser().getEmail(),"Payment needs review","Payment received; contact reception to reconcile invoice "+invoice.getInvoiceId(),"PAYMENT");return;}
        for(var b:booked){b.setStatus("CONFIRMED");bookingRepository.save(b);}
        var active=new ArrayList<>(Optional.ofNullable(userMembershipRepository.findActiveMembershipByEmail(invoice.getUser().getEmail())).orElse(List.of()));
        for(var m:purchased){
            var latest=java.time.LocalDate.now().minusDays(1);
            for(var a:active)if((!Boolean.TRUE.equals(packageTypes.require(m.purchasedType()).get("requiresSubjects"))||a.getAPackage().getPackageId().equals(m.getAPackage().getPackageId()))&&a.purchasedType().equals(m.purchasedType())&&a.getEndDate()!=null&&a.getEndDate().isAfter(latest))latest=a.getEndDate();
            var start=latest.isBefore(java.time.LocalDate.now())?java.time.LocalDate.now():latest.plusDays(1);
            m.setStartDate(start);m.setEndDate(start.plusDays(m.purchasedDuration()-1));m.setStatus("ACTIVE");m.setPurchaseCompletedAt(LocalDateTime.now());m.setPurchaseSource("ONLINE");userMembershipRepository.save(m);active.add(m);
        }
        invoice.setStatus("PAID");invoiceRepository.save(invoice);
        if (maybeCredit.isPresent()) {
            var c = maybeCredit.get();
            if (c.getStatus() == com.team4.sportscenter.modules.support.enums.CreditStatus.ACTIVE) {
                c.setStatus(com.team4.sportscenter.modules.support.enums.CreditStatus.USED);
                c.setRemainingAmount(BigDecimal.ZERO);
                userCreditRepository.save(c);
            }
        }
        List<String> paidItems = new ArrayList<>();
        if (!purchased.isEmpty()) {
            for (var m : purchased) {
                String pkgName = m.getAPackage() != null ? m.getAPackage().getPackageName() : "Gói hội viên";
                int duration = m.purchasedDuration() > 0 ? m.purchasedDuration() : 30;
                paidItems.add("Gói tập: " + pkgName + " (" + duration + " ngày)");
            }
        }
        if (!booked.isEmpty()) {
            String className = (booked.get(0).getSchedule() != null && booked.get(0).getSchedule().getGymClass() != null)
                ? booked.get(0).getSchedule().getGymClass().getClassName() : "Khóa học";
            paidItems.add("Khóa học: " + className + " (" + booked.size() + " buổi)");
        }
        String itemsSummary = paidItems.isEmpty() ? "Dịch vụ phòng tập" : String.join(", ", paidItems);
        String formattedAmount = invoice.getTotalAmount() != null
                ? String.format("%,d đ", invoice.getTotalAmount().longValue())
                : "0 đ";
        String method = (payment != null && payment.getPaymentMethod() != null) ? payment.getPaymentMethod() : "ONLINE";

        String invoiceMsg = String.format(
            "Hóa đơn #%d đã thanh toán thành công.\n• Dịch vụ: %s\n• Số tiền: %s (%s)\nCảm ơn bạn đã lựa chọn Sports Center!",
            invoice.getInvoiceId(),
            itemsSummary,
            formattedAmount,
            method
        );

        notificationService.createNotification(
            invoice.getUser().getEmail(),
            "Thanh toán thành công / Payment Successful #" + invoice.getInvoiceId(),
            invoiceMsg,
            "PAYMENT"
        );
        if (!purchased.isEmpty()) {
            for (var m : purchased) {
                String pkgName = m.getAPackage() != null ? m.getAPackage().getPackageName() : "Gói hội viên";
                int duration = m.purchasedDuration() > 0 ? m.purchasedDuration() : 30;
                notificationService.createNotification(
                    invoice.getUser().getEmail(),
                    "Đăng ký gói hội viên thành công / Package Activated",
                    "Gói hội viên '" + pkgName + "' (" + duration + " ngày) của bạn đã được kích hoạt thành công. "
                        + "Thời hạn sử dụng từ " + m.getStartDate() + " đến " + m.getEndDate() + ". "
                        + "Vui lòng kiểm tra quyền lợi trong mục Package Benefits.",
                    "PAYMENT"
                );
            }
        }
        if (!booked.isEmpty()) {
            String className = booked.get(0).getSchedule() != null && booked.get(0).getSchedule().getGymClass() != null
                ? booked.get(0).getSchedule().getGymClass().getClassName() : "khóa học";
            notificationService.createNotification(
                invoice.getUser().getEmail(),
                "Đăng ký lớp học thành công / Class Enrolled",
                "Bạn đã thanh toán và đăng ký thành công khóa học: " + className + " (" + booked.size() + " buổi). Vui lòng kiểm tra lịch học trong My Schedule.",
                "BOOKING"
            );
        }
    }
}
