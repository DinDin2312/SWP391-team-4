package com.team4.sportscenter.modules.auth.services;

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

    public void sendOtpEmail(String to, String otp, String fullName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject("NEXUS Sports Center Account Verification");

            String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;'>"
                    + "<div style='text-align: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px;'>"
                    + "<h2 style='color: #0f172a; margin: 0;'>NEXUS SPORTS CENTER</h2>"
                    + "</div>"
                    + "<p style='font-size: 16px;'>Hello <b>" + fullName + "</b>,</p>"
                    + "<p style='font-size: 16px;'>Thank you for registering an account at NEXUS. Below is your 6-digit OTP code to verify your email address:</p>"
                    + "<div style='background-color: #f8fafc; border-radius: 6px; padding: 15px; text-align: center; margin: 25px 0;'>"
                    + "<h1 style='color: #2563eb; letter-spacing: 5px; margin: 0; font-size: 32px;'>" + otp + "</h1>"
                    + "</div>"
                    + "<p style='font-size: 14px; color: #94a3b8;'>This code will expire in 5 minutes. Please do not share this code with anyone.</p>"
                    + "</div>";

            helper.setText(htmlContent, true);
            mailSender.send(message);

        } catch (MessagingException e) {
            throw new RuntimeException("Error sending email: " + e.getMessage());
        }
    }

    public void sendForgotPasswordEmail(String to, String otp, String fullName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject("NEXUS Sports Center Password Recovery");

            String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;'>"
                    + "<div style='text-align: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px;'>"
                    + "<h2 style='color: #0f172a; margin: 0;'>NEXUS SPORTS CENTER</h2>"
                    + "</div>"
                    + "<p style='font-size: 16px;'>Hello <b>" + fullName + "</b>,</p>"
                    + "<p style='font-size: 16px;'>We received a request to recover the password for your account. Below is your 6-digit OTP code:</p>"
                    + "<div style='background-color: #f8fafc; border-radius: 6px; padding: 15px; text-align: center; margin: 25px 0;'>"
                    + "<h1 style='color: #ef4444; letter-spacing: 5px; margin: 0; font-size: 32px;'>" + otp + "</h1>"
                    + "</div>"
                    + "<p style='font-size: 14px; color: #94a3b8;'>This code will expire in 5 minutes. If you did not request a password reset, please ignore this email.</p>"
                    + "</div>";

            helper.setText(htmlContent, true);
            mailSender.send(message);

        } catch (MessagingException e) {
            throw new RuntimeException("Error sending email: " + e.getMessage());
        }
    }
}
