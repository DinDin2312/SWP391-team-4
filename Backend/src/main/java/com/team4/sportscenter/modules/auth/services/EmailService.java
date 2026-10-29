package com.team4.sportscenter.modules.auth.services;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

@Service
@RequiredArgsConstructor
public class EmailService {

    // Table layout + inline styles only: the one combination Gmail/Outlook/Apple Mail all render consistently.
    private static final String TEMPLATE = """
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#eff6ff" style="background:#eff6ff;padding:32px 12px;font-family:'Segoe UI',Arial,sans-serif;">
            <tr><td align="center">
              <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #dbeafe;border-radius:14px;overflow:hidden;">
                <tr><td bgcolor="#1d4ed8" style="background:#1d4ed8;padding:26px 32px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                    <td>
                      <div style="color:#ffffff;font-size:26px;font-weight:800;letter-spacing:3px;">NEXUS</div>
                      <div style="color:#bfdbfe;font-size:11px;font-weight:600;letter-spacing:1.5px;margin-top:4px;">SPORTS CENTER MANAGEMENT</div>
                    </td>
                    <td align="right" valign="top">
                      <span style="display:inline-block;background:#1e40af;color:#dbeafe;font-size:10px;font-weight:700;letter-spacing:1px;padding:6px 12px;border-radius:6px;">{{badge}}</span>
                    </td>
                  </tr></table>
                </td></tr>
                <tr><td style="padding:32px;color:#0f172a;font-size:15px;line-height:1.6;">
                  <p style="margin:0 0 14px;">Hello <b>{{name}}</b>,</p>
                  <p style="margin:0 0 24px;color:#475569;">{{intro}}</p>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#eff6ff" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;">
                    <tr><td align="center" style="padding:24px 12px;">
                      <div style="color:#2563eb;font-size:11px;font-weight:700;letter-spacing:2px;margin-bottom:12px;">YOUR VERIFICATION CODE</div>
                      <div style="color:#1d4ed8;font-family:Consolas,'Courier New',monospace;font-size:38px;font-weight:800;letter-spacing:10px;">{{otp}}</div>
                    </td></tr>
                  </table>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                    <tr><td bgcolor="#f8fafc" style="background:#f8fafc;border-left:3px solid #2563eb;padding:14px 16px;color:#475569;font-size:13px;line-height:1.7;">
                      &bull; This code is valid for <b style="color:#1d4ed8;">5 minutes</b> from the time it was sent.<br>
                      &bull; Never share this code with anyone, including NEXUS staff.<br>
                      &bull; {{note}}
                    </td></tr>
                  </table>
                </td></tr>
                <tr><td bgcolor="#f8fafc" align="center" style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 32px;color:#94a3b8;font-size:12px;">
                  This is an automated message, please do not reply.<br>&copy; NEXUS Sports Center
                </td></tr>
              </table>
            </td></tr>
            </table>
            """;

    private final JavaMailSender mailSender;

    public void sendOtpEmail(String to, String otp, String fullName) {
        send(to, "NEXUS Sports Center Account Verification", render("ACCOUNT VERIFICATION", fullName,
                "Thank you for registering an account at NEXUS. Use the 6-digit code below to verify your email address.",
                otp, "If you did not create this account, you can safely ignore this email."));
    }

    public void sendForgotPasswordEmail(String to, String otp, String fullName) {
        send(to, "NEXUS Sports Center Password Recovery", render("PASSWORD RECOVERY", fullName,
                "We received a request to recover the password for your account. Use the 6-digit code below to continue.",
                otp, "If you did not request a password reset, please ignore this email."));
    }

    // fullName is user-supplied (registration), so it is HTML-escaped before it reaches the template.
    private String render(String badge, String fullName, String intro, String otp, String note) {
        String safeName = (fullName != null && !fullName.isBlank()) ? HtmlUtils.htmlEscape(fullName) : "Member";
        String safeOtp = otp != null ? HtmlUtils.htmlEscape(otp) : "";
        return TEMPLATE.replace("{{badge}}", badge != null ? badge : "")
                .replace("{{name}}", safeName)
                .replace("{{intro}}", intro != null ? intro : "")
                .replace("{{otp}}", safeOtp)
                .replace("{{note}}", note != null ? note : "");
    }

    private void send(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Error sending email: " + e.getMessage());
        }
    }
}
