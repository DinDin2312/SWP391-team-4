package com.team4.sportscenter.modules.payment.services.impl;

import com.team4.sportscenter.config.VNPayConfig;
import com.team4.sportscenter.config.MoMoConfig;
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
public class PaymentServiceImpl implements PaymentService {

    private final BookingRepository bookingRepository;
    private final UserMembershipRepository userMembershipRepository;
    private final UserRepository userRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceDetailRepository invoiceDetailRepository;
    private final PaymentRepository paymentRepository;
    private final VNPayConfig vnPayConfig;
    private final org.springframework.jdbc.core.JdbcTemplate jdbc;
    private final com.team4.sportscenter.modules.member.services.PackageCommerceService commerce;
    private final NotificationService notificationService;
    private final com.team4.sportscenter.modules.manager.services.PackageTypeCatalog packageTypes;

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

        return CartResponse.builder()
                .items(items)
                .totalPrice(totalPrice)
                .build();
    }

    @Override
    @Transactional
    public String checkout(String email, String ipAddress, String paymentMethod) {
        bookingRepository.lockOperations();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        List<Booking> pendingBookings = bookingRepository.findAllBookingsByEmail(email)
                .stream()
                .filter(b -> "PENDING".equals(b.getStatus()))
                .toList();

        List<UserMembership> pendingMemberships = userMembershipRepository.findAll().stream()
                .filter(m -> m.getUser().getEmail().equals(email) && "PENDING".equals(m.getStatus()))
                .toList();

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

        Invoice invoice = Invoice.builder()
                .user(user)
                .totalAmount(totalAmount)
                .status("PENDING") 
                .createdAt(LocalDateTime.now())
                .build();
        invoice = invoiceRepository.saveAndFlush(invoice);

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

        PaymentEntity payment = PaymentEntity.builder()
                .invoice(invoice)
                .amount(totalAmount)
                .paymentMethod("momo".equalsIgnoreCase(paymentMethod)?"MOMO":"VNPAY")
                .status("PENDING")
                .paymentDate(LocalDateTime.now())
                .build();
        paymentRepository.saveAndFlush(payment);
        if(totalAmount.signum()==0){finishPayment(invoice,true,"FREE-"+invoice.getInvoiceId());return "/member/memberships";}


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
        bookingRepository.lockOperations();assertCartMutable(email);
        List<Booking> pendingBookings = bookingRepository.findAllBookingsByEmail(email)
                .stream()
                .filter(b -> "PENDING".equals(b.getStatus()) && b.getSchedule().getGymClass().getClassId().equals(classId))
                .toList();
                
        if (!pendingBookings.isEmpty()) {
            for(var b:pendingBookings){if(jdbc.queryForObject("SELECT COUNT(*) FROM INVOICE_BOOKINGS WHERE booking_id=?",Integer.class,b.getBookingId())>0){b.setStatus("CANCELLED");bookingRepository.save(b);}else bookingRepository.delete(b);}
        }
    }

    @Override
    @Transactional
    public void removePackageFromCart(String email, Integer packageId) {
        bookingRepository.lockOperations();assertCartMutable(email);
        List<com.team4.sportscenter.modules.member.entities.UserMembership> memberships = userMembershipRepository.findAll().stream()
            .filter(m -> m.getUser().getEmail().equals(email) && "PENDING".equals(m.getStatus()) && m.getAPackage().getPackageId().equals(packageId))
            .toList();
        if (!memberships.isEmpty()) {
            for(var m:memberships){if(m.getCheckoutInvoiceId()!=null){m.setStatus("CANCELLED");userMembershipRepository.save(m);}else userMembershipRepository.delete(m);}
        }
    }

    @Override
    @Transactional
    public void clearCart(String email) {
        bookingRepository.lockOperations();assertCartMutable(email);
        List<Booking> pendingBookings = bookingRepository.findAllBookingsByEmail(email)
                .stream().filter(b -> "PENDING".equals(b.getStatus())).toList();
        if (!pendingBookings.isEmpty()) {
            bookingRepository.deleteAll(pendingBookings);
        }
        
        List<com.team4.sportscenter.modules.member.entities.UserMembership> pendingMemberships = userMembershipRepository.findAll().stream()
                .filter(m -> m.getUser().getEmail().equals(email) && "PENDING".equals(m.getStatus()))
                .toList();
        if (!pendingMemberships.isEmpty()) {
            for(var m:pendingMemberships){if(m.getCheckoutInvoiceId()!=null){m.setStatus("CANCELLED");userMembershipRepository.save(m);}else userMembershipRepository.delete(m);}
        }
    }
    @Override
    @Transactional
    public void handleMoMoCallback(Map<String,String> query){
        bookingRepository.lockOperations();
        String raw="accessKey="+MoMoConfig.ACCESS_KEY;
        for(String key:List.of("amount","extraData","message","orderId","orderInfo","orderType","partnerCode","payType","requestId","responseTime","resultCode","transId"))raw+="&"+key+"="+query.getOrDefault(key,"");
        try{if(query.get("signature")==null||!java.security.MessageDigest.isEqual(MoMoConfig.signHmacSHA256(raw,MoMoConfig.SECRET_KEY).getBytes(StandardCharsets.UTF_8),query.get("signature").getBytes(StandardCharsets.UTF_8)))throw new IllegalArgumentException("Invalid signature");}
        catch(IllegalArgumentException e){throw e;}catch(Exception e){throw new IllegalStateException(e);}
        var invoice=invoiceRepository.findById(Integer.parseInt(query.get("orderId").split("_")[0])).orElseThrow();
        if(!"MOMO".equals(paymentMethod(invoice)))throw new IllegalArgumentException("Payment method mismatch");
        if(new BigDecimal(query.get("amount")).compareTo(invoice.getTotalAmount())!=0)throw new IllegalArgumentException("Payment amount mismatch");
        finishPayment(invoice,"0".equals(query.get("resultCode")),query.get("transId"));
    }

    private String paymentMethod(Invoice invoice){return paymentRepository.findAll().stream().filter(p->p.getInvoice().getInvoiceId().equals(invoice.getInvoiceId())).findFirst().orElseThrow().getPaymentMethod();}

    private void assertCartMutable(String email){
        int held=jdbc.queryForObject("SELECT COUNT(*) FROM INVOICES i JOIN USERS u ON u.user_id=i.user_id WHERE u.email=? AND i.status='PENDING' AND i.created_at>DATE_SUB(NOW(),INTERVAL 15 MINUTE)",Integer.class,email);
        if(held>0)throw new com.team4.sportscenter.common.exception.PackageRuleException("PACKAGE_CHECKOUT_PENDING","A checkout is awaiting payment. Complete it or wait 15 minutes before changing the cart.");
    }

    private void finishPayment(Invoice invoice,boolean success,String transaction){
        if(Set.of("PAID","REVIEW").contains(invoice.getStatus()))return;
        var payment=paymentRepository.findAll().stream().filter(p->p.getInvoice().getInvoiceId().equals(invoice.getInvoiceId())).findFirst().orElseThrow();
        if(!success){invoice.setStatus("FAILED");payment.setStatus("FAILED");invoiceRepository.save(invoice);paymentRepository.save(payment);return;}
        payment.setStatus("COMPLETED");payment.setTransactionNo(transaction);paymentRepository.save(payment);
        String issue=null;
        var purchased=userMembershipRepository.findAll().stream().filter(m->invoice.getInvoiceId().equals(m.getCheckoutInvoiceId())).toList();
        var bookingIds=jdbc.queryForList("SELECT booking_id FROM INVOICE_BOOKINGS WHERE invoice_id=?",Integer.class,invoice.getInvoiceId());
        var booked=bookingRepository.findAllById(bookingIds);
        try{
            if(!"PENDING".equals(invoice.getStatus())||invoice.getCreatedAt().isBefore(LocalDateTime.now().minusMinutes(15)))throw new IllegalArgumentException("Checkout expired or previously failed");
            int expected=jdbc.queryForObject("SELECT COUNT(*) FROM INVOICE_DETAILS WHERE invoice_id=? AND package_id IS NOT NULL",Integer.class,invoice.getInvoiceId());
            if(expected!=purchased.size())throw new IllegalArgumentException("Invoice membership association missing");
            int expectedClasses=jdbc.queryForObject("SELECT COUNT(*) FROM INVOICE_DETAILS WHERE invoice_id=? AND class_id IS NOT NULL",Integer.class,invoice.getInvoiceId());
            if(expectedClasses>0&&booked.isEmpty())throw new IllegalArgumentException("Invoice booking association missing");
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
        notificationService.createNotification(invoice.getUser().getEmail(),"Payment Successful","Your invoice "+invoice.getInvoiceId()+" is complete.","PAYMENT");
    }
}
