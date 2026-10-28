package com.team4.sportscenter;

import com.team4.sportscenter.config.PayOSConfig;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class PayOSIntegrationTests {

    @Test
    void testHmacSHA256SignatureGeneration() {
        String data = "amount=100000&cancelUrl=http://localhost:5173/member/cart&description=HD 1&orderCode=1&returnUrl=http://localhost:5173/member/payment-result";
        String key = "test-checksum-key-123456";
        String signature = PayOSConfig.signHmacSHA256(data, key);
        assertNotNull(signature);
        assertFalse(signature.isBlank());
        assertEquals(64, signature.length(), "HMAC-SHA256 hex string should be 64 characters long");
    }

    @Test
    void testVerifyWebhookSignature() {
        PayOSConfig config = new PayOSConfig();
        config.checksumKey = "secret-checksum-key";

        Map<String, Object> data = new HashMap<>();
        data.put("orderCode", 100);
        data.put("amount", 250000);
        data.put("description", "HD 100");
        data.put("code", "00");

        // Compute expected signature based on sorted keys: amount, code, description, orderCode
        String raw = "amount=250000&code=00&description=HD 100&orderCode=100";
        String expectedSignature = PayOSConfig.signHmacSHA256(raw, config.checksumKey);

        assertTrue(config.verifyWebhookData(data, expectedSignature));
        assertFalse(config.verifyWebhookData(data, "invalid_signature"));
    }

    @Test
    void testIsConfigured() {
        PayOSConfig config = new PayOSConfig();
        assertFalse(config.isConfigured());

        config.clientId = "client-id-123";
        config.apiKey = "api-key-456";
        config.checksumKey = "checksum-key-789";
        assertTrue(config.isConfigured());
    }

    @Test
    void testDirectBankAccountConfigAndVietQRUrl() {
        PayOSConfig config = new PayOSConfig();
        config.bankId = "MBBank";
        config.accountNo = "0386789999";
        config.accountName = "NGUYEN VAN A";

        assertTrue(config.hasDirectBankConfig());
        assertEquals("MB", config.getNormalizedBankId());
        assertTrue(config.getBankDisplayName().contains("MBBank"));

        String qrUrl = config.buildVietQRUrl(500000L, "HD 101");
        assertNotNull(qrUrl);
        assertTrue(qrUrl.contains("MB-0386789999-compact2.png"));
        assertTrue(qrUrl.contains("amount=500000"));
        assertTrue(qrUrl.contains("addInfo=HD+101"));
        assertTrue(qrUrl.contains("NGUYEN+VAN+A"));
    }
}
