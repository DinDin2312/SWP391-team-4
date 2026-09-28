package com.team4.sportscenter.config;

import org.springframework.context.annotation.Configuration;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Configuration
public class MoMoConfig {
    public static final String PARTNER_CODE = "MOMOBKUN20180529";
    public static final String ACCESS_KEY = "klm05TvNBzhg7h7j";
    public static final String SECRET_KEY = "at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa";
    public static final String ENDPOINT = "https://test-payment.momo.vn/v2/gateway/api/create";
    public static final String RETURN_URL = "http://localhost:5173/member/payment-result";
    public static final String IPN_URL = "http://localhost:5173/member/payment-result"; // Can be same for simple flow

    public static String signHmacSHA256(String data, String secretKey) throws Exception {
        Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
        SecretKeySpec secret_key = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        sha256_HMAC.init(secret_key);
        byte[] hash = sha256_HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
