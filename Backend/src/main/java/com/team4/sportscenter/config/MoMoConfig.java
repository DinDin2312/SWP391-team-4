package com.team4.sportscenter.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Configuration
public class MoMoConfig {
    @Value("${momo.partnerCode:MOMOBKUN20180529}")
    private String partnerCodeVal;

    @Value("${momo.accessKey:klm05TvNBzhg7h7j}")
    private String accessKeyVal;

    @Value("${momo.secretKey:at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa}")
    private String secretKeyVal;

    @Value("${momo.endpoint:https://test-payment.momo.vn/v2/gateway/api/create}")
    private String endpointVal;

    @Value("${momo.returnUrl:http://localhost:5173/member/payment-result}")
    private String returnUrlVal;

    @Value("${momo.ipnUrl:http://localhost:5173/member/payment-result}")
    private String ipnUrlVal;

    public static String PARTNER_CODE = "MOMOBKUN20180529";
    public static String ACCESS_KEY = "klm05TvNBzhg7h7j";
    public static String SECRET_KEY = "at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa";
    public static String ENDPOINT = "https://test-payment.momo.vn/v2/gateway/api/create";
    public static String RETURN_URL = "http://localhost:5173/member/payment-result";
    public static String IPN_URL = "http://localhost:5173/member/payment-result";

    @PostConstruct
    public void init() {
        PARTNER_CODE = partnerCodeVal;
        ACCESS_KEY = accessKeyVal;
        SECRET_KEY = secretKeyVal;
        ENDPOINT = endpointVal;
        RETURN_URL = returnUrlVal;
        IPN_URL = ipnUrlVal;
    }

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
