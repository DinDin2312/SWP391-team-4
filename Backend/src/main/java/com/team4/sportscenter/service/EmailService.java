package com.team4.sportscenter.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otpCode, String fullName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("Xác thực tài khoản NEXUS Sports Center");

            // Tạo giao diện Email bằng HTML cho chuyên nghiệp
            String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0b1326; color: #ffffff; padding: 30px; border-radius: 10px;'>"
                    + "<h2 style='color: #3b82f6; text-align: center;'>NEXUS Performance Lab</h2>"
                    + "<p style='font-size: 16px;'>Xin chào <b>" + fullName + "</b>,</p>"
                    + "<p style='font-size: 16px;'>Cảm ơn bạn đã đăng ký tài khoản tại NEXUS. Dưới đây là mã OTP 6 số để xác thực địa chỉ email của bạn:</p>"
                    + "<div style='text-align: center; margin: 30px 0;'>"
                    + "  <span style='font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #ffffff; background-color: #131b2e; padding: 15px 30px; border-radius: 8px; border: 1px solid #3b82f6;'>" + otpCode + "</span>"
                    + "</div>"
                    + "<p style='font-size: 14px; color: #94a3b8;'>Mã này sẽ hết hạn trong vòng 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>"
                    + "<hr style='border: 1px solid #1e293b; margin: 30px 0;' />"
                    + "<p style='font-size: 12px; color: #64748b; text-align: center;'>© 2026 NEXUS Sports Technology Inc.</p>"
                    + "</div>";

            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Lỗi khi gửi email: " + e.getMessage());
        }
    }
}
