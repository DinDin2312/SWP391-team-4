package com.team4.sportscenter.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Configuration
public class PayOSConfig {

    @Value("${payos.clientId:}")
    public String clientId;

    @Value("${payos.apiKey:}")
    public String apiKey;

    @Value("${payos.checksumKey:}")
    public String checksumKey;

    @Value("${payos.endpoint:https://api-merchant.payos.vn}")
    public String endpoint;

    @Value("${payos.returnUrl:http://localhost:5173/member/payment-result}")
    public String returnUrl;

    @Value("${payos.cancelUrl:http://localhost:5173/member/cart}")
    public String cancelUrl;

    // Cấu hình tài khoản ngân hàng nhận tiền trực tiếp (VietQR Napas 247)
    @Value("${vietqr.bank-id:${payos.bank-id:MB}}")
    public String bankId;

    @Value("${vietqr.account-no:${payos.account-no:}}")
    public String accountNo;

    @Value("${vietqr.account-name:${payos.account-name:}}")
    public String accountName;

    public boolean isConfigured() {
        return clientId != null && !clientId.isBlank() && !clientId.startsWith("your_")
                && apiKey != null && !apiKey.isBlank() && !apiKey.startsWith("your_")
                && checksumKey != null && !checksumKey.isBlank() && !checksumKey.startsWith("your_");
    }

    public boolean hasDirectBankConfig() {
        return accountNo != null && !accountNo.isBlank();
    }

    public String getNormalizedBankId() {
        if (bankId == null || bankId.isBlank()) return "MB";
        String b = bankId.trim().toUpperCase();
        return switch (b) {
            case "VIETCOMBANK" -> "VCB";
            case "MBBANK", "MB BANK" -> "MB";
            case "TECHCOMBANK" -> "TCB";
            case "VIETINBANK" -> "ICB";
            case "AGRIBANK" -> "VBA";
            case "SACOMBANK" -> "STB";
            case "TIENPHONGBANK", "TPBANK" -> "TPB";
            case "VPBANK" -> "VPB";
            default -> b;
        };
    }

    public String getBankDisplayName() {
        String norm = getNormalizedBankId();
        return switch (norm) {
            case "MB" -> "MBBank (Ngân hàng Quân Đội)";
            case "VCB" -> "Vietcombank (Ngoại Thương Việt Nam)";
            case "TCB" -> "Techcombank (Kỹ Thương Việt Nam)";
            case "ICB" -> "VietinBank (Công Thương Việt Nam)";
            case "BIDV" -> "BIDV (Đầu tư và Phát triển VN)";
            case "ACB" -> "ACB (Ngân hàng Á Châu)";
            case "VPB" -> "VPBank (Việt Nam Thịnh Vượng)";
            case "TPB" -> "TPBank (Tiên Phong Bank)";
            case "STB" -> "Sacombank (Sài Gòn Thương Tín)";
            case "VIB" -> "VIB (Ngân hàng Quốc Tế)";
            case "VBA" -> "Agribank (Nông nghiệp & PTNT)";
            default -> norm;
        };
    }

    public String buildVietQRUrl(long amount, String description) {
        String safeBank = getNormalizedBankId();
        String safeAcc = (accountNo != null && !accountNo.isBlank()) ? accountNo.trim() : "0386789999";
        String safeName = (accountName != null && !accountName.isBlank()) ? accountName.trim() : "ADMIN";
        String safeDesc = (description != null && !description.isBlank()) ? description.trim() : "HD";
        try {
            return "https://img.vietqr.io/image/" + safeBank + "-" + safeAcc + "-compact2.png"
                    + "?amount=" + amount
                    + "&addInfo=" + java.net.URLEncoder.encode(safeDesc, StandardCharsets.UTF_8)
                    + "&accountName=" + java.net.URLEncoder.encode(safeName, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return "https://img.vietqr.io/image/" + safeBank + "-" + safeAcc + "-compact2.png?amount=" + amount;
        }
    }

    public static String signHmacSHA256(String data, String key) {
        try {
            if (key == null || data == null) {
                throw new IllegalArgumentException("Key and data must not be null for HMAC-SHA256");
            }
            Mac sha256HMAC = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256HMAC.init(secretKey);
            byte[] hash = sha256HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error signing HMAC-SHA256: " + e.getMessage(), e);
        }
    }

    public boolean verifyWebhookData(Map<String, Object> data, String signature) {
        if (signature == null || checksumKey == null || checksumKey.isBlank()) {
            return false;
        }
        try {
            List<String> sortedKeys = new ArrayList<>(data.keySet());
            Collections.sort(sortedKeys);
            StringBuilder sb = new StringBuilder();
            for (String key : sortedKeys) {
                Object val = data.get(key);
                if (val != null) {
                    if (sb.length() > 0) sb.append("&");
                    sb.append(key).append("=").append(val.toString());
                }
            }
            String computed = signHmacSHA256(sb.toString(), checksumKey);
            return java.security.MessageDigest.isEqual(
                    computed.getBytes(StandardCharsets.UTF_8),
                    signature.getBytes(StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            return false;
        }
    }
}
