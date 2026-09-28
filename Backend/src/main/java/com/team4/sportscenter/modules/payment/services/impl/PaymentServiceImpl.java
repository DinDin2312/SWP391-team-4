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
import com.team4.sportscenter.modules.payment.dtos.CartItemDto;
import com.team4.sportscenter.modules.payment.dtos.CartResponse;
import com.team4.sportscenter.modules.payment.entities.Invoice;
import com.team4.sportscenter.modules.payment.entities.InvoiceDetail;
import com.team4.sportscenter.modules.payment.entities.PaymentEntity;
import com.team4.sportscenter.modules.payment.repositories.InvoiceDetailRepository;
import com.team4.sportscenter.modules.payment.repositories.InvoiceRepository;
import com.team4.sportscenter.modules.payment.repositories.PaymentRepository;
import com.team4.sportscenter.modules.payment.services.PaymentService;
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
    private final UserRepository userRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceDetailRepository invoiceDetailRepository;
    private final PaymentRepository paymentRepository;
    private final VNPayConfig vnPayConfig;

    @Override
    public CartResponse getCartItems(String email) {
        List<Booking> pendingBookings = bookingRepository.findAllBookingsByEmail(email)
                .stream()
                .filter(b -> "PENDING".equals(b.getStatus()))
                .collect(Collectors.toList());

        Map<GymClass, List<Booking>> groupedByClass = pendingBookings.stream()
                .collect(Collectors.groupingBy(b -> b.getSchedule().getGymClass()));

        List<CartItemDto> items = groupedByClass.entrySet().stream().map(entry -> {
            GymClass gymClass = entry.getKey();
            return CartItemDto.builder()
                    .classId(gymClass.getClassId())
                    .className(gymClass.getClassName())
                    .coachName(gymClass.getCoach() != null ? gymClass.getCoach().getFullName() : "Unknown")
                    .price(gymClass.getPrice())
                    .sessionCount(entry.getValue().size())
                    .build();
        }).collect(Collectors.toList());

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
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        List<Booking> pendingBookings = bookingRepository.findAllBookingsByEmail(email)
                .stream()
                .filter(b -> "PENDING".equals(b.getStatus()))
                .collect(Collectors.toList());

        if (pendingBookings.isEmpty()) {
            throw new RuntimeException("No pending bookings found in your cart.");
        }

        for (Booking booking : pendingBookings) {
            Integer scheduleId = booking.getSchedule().getScheduleId();
            Integer bookedSlots = bookingRepository.countBookedSlots(scheduleId);
            Integer maxSlots = booking.getSchedule().getGymClass().getMaxSlots();
            
            if (bookedSlots >= maxSlots) {
                throw new RuntimeException("Checkout failed! The class '" + booking.getSchedule().getGymClass().getClassName() + "' on " + booking.getSchedule().getStartTime() + " is now fully booked by others.");
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

        Invoice invoice = Invoice.builder()
                .user(user)
                .totalAmount(totalAmount)
                .status("PENDING") 
                .createdAt(LocalDateTime.now())
                .build();
        invoice = invoiceRepository.save(invoice);

        for (Map.Entry<GymClass, List<Booking>> entry : groupedByClass.entrySet()) {
            GymClass gymClass = entry.getKey();
            InvoiceDetail detail = InvoiceDetail.builder()
                    .invoice(invoice)
                    .gymClass(gymClass)
                    .unitPrice(gymClass.getPrice())
                    .build();
            invoiceDetailRepository.save(detail);
        }
        
        PaymentEntity payment = PaymentEntity.builder()
                .invoice(invoice)
                .amount(totalAmount)
                .paymentMethod("VNPAY")
                .status("PENDING")
                .paymentDate(LocalDateTime.now())
                .build();
        paymentRepository.save(payment);


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
        vnp_Params.put("vnp_BankCode", "NCB"); // Ép nhảy thẳng vào màn hình thẻ test NCB
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
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
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
        String vnp_SecureHash = vnPayConfig.hmacSHA512(vnPayConfig.vnp_HashSecret, hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;
        return vnPayConfig.vnp_Url + "?" + queryUrl;
    }

    @Override
    @Transactional
    public void handleVNPayCallback(Map<String, String> queryParams) {
        String vnp_SecureHash = queryParams.get("vnp_SecureHash");
        queryParams.remove("vnp_SecureHash");
        queryParams.remove("vnp_SecureHashType");

        String calculatedHash = vnPayConfig.hashAllFields(queryParams);
        
        if (!calculatedHash.equals(vnp_SecureHash)) {
            throw new RuntimeException("Invalid signature");
        }
        
        String responseCode = queryParams.get("vnp_ResponseCode");
        String invoiceIdStr = queryParams.get("vnp_TxnRef");
        String transactionNo = queryParams.get("vnp_TransactionNo");
        
        Invoice invoice = invoiceRepository.findById(Integer.parseInt(invoiceIdStr))
                .orElseThrow(() -> new RuntimeException("Invoice not found"));
                
        if ("00".equals(responseCode)) {
            invoice.setStatus("PAID");
            invoiceRepository.save(invoice);
            
            // Update Payment Entity
            PaymentEntity payment = paymentRepository.findAll().stream()
                .filter(p -> p.getInvoice().getInvoiceId().equals(invoice.getInvoiceId()))
                .findFirst().orElse(null);
            if (payment != null) {
                payment.setStatus("COMPLETED");
                payment.setTransactionNo(transactionNo);
                paymentRepository.save(payment);
            }
            
            // Confirm bookings
            List<Booking> pendingBookings = bookingRepository.findAllBookingsByEmail(invoice.getUser().getEmail())
                .stream().filter(b -> "PENDING".equals(b.getStatus())).collect(Collectors.toList());
            for (Booking b : pendingBookings) {
                b.setStatus("CONFIRMED");
                bookingRepository.save(b);
            }
        } else {
            invoice.setStatus("FAILED");
            invoiceRepository.save(invoice);
            throw new RuntimeException("Payment failed with code " + responseCode);
        }
    }

    @Override
    @Transactional
    public void removeFromCart(String email, Integer classId) {
        List<Booking> pendingBookings = bookingRepository.findAllBookingsByEmail(email)
                .stream()
                .filter(b -> "PENDING".equals(b.getStatus()) && b.getSchedule().getGymClass().getClassId().equals(classId))
                .collect(Collectors.toList());
                
        if (!pendingBookings.isEmpty()) {
            bookingRepository.deleteAll(pendingBookings);
        }
    }
    @Override
    @Transactional
    public void handleMoMoCallback(Map<String, String> queryParams) {
        String resultCode = queryParams.get("resultCode");
        String orderId = queryParams.get("orderId");
        
        if (orderId == null) {
            throw new RuntimeException("Invalid MoMo orderId");
        }
        
        String[] parts = orderId.split("_");
        Integer invoiceId = Integer.parseInt(parts[0]);
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));
                
        if (!"PENDING".equals(invoice.getStatus())) {
            return; // Already processed
        }
        
        if ("0".equals(resultCode)) {
            // Success
            invoice.setStatus("PAID");
            invoiceRepository.save(invoice);
            
            PaymentEntity payment = paymentRepository.findAll().stream()
                .filter(p -> p.getInvoice().getInvoiceId().equals(invoice.getInvoiceId()))
                .findFirst().orElse(null);
            if (payment != null) {
                payment.setStatus("COMPLETED");
                payment.setTransactionNo(queryParams.get("transId"));
                paymentRepository.save(payment);
            }
            
            List<Booking> pendingBookings = bookingRepository.findAllBookingsByEmail(invoice.getUser().getEmail())
                .stream().filter(b -> "PENDING".equals(b.getStatus())).collect(Collectors.toList());
            for (Booking b : pendingBookings) {
                b.setStatus("CONFIRMED");
                bookingRepository.save(b);
            }
        } else {
            // Failed
            invoice.setStatus("FAILED");
            invoiceRepository.save(invoice);
            
            PaymentEntity payment = paymentRepository.findAll().stream()
                .filter(p -> p.getInvoice().getInvoiceId().equals(invoice.getInvoiceId()))
                .findFirst().orElse(null);
            if (payment != null) {
                payment.setStatus("FAILED");
                paymentRepository.save(payment);
            }
            throw new RuntimeException("MoMo payment failed or was cancelled");
        }
    }
}
