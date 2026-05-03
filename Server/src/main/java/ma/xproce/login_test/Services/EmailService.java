package ma.xproce.login_test.Services;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class EmailService implements IEmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("classpath:logo.png")
    private Resource logoResource;

    @Override
    public void sendEmail(String to, String subject, String text) {
        log.info("Tentative d'envoi d'e-mail HTML à {} - Sujet: {}", to, subject);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            // multipart=true pour supporter les pièces jointes inline
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(buildHtmlEmail(subject, text), true);

            // Attacher le logo comme image inline (CID)
            helper.addInline("smartrecruitLogo", logoResource);

            mailSender.send(message);
            log.info("E-mail HTML envoyé avec succès à {}", to);
        } catch (MessagingException | IOException e) {
            log.error("Échec de l'envoi de l'e-mail à {} : {}", to, e.getMessage());
            throw new RuntimeException("Erreur lors de l'envoi de l'e-mail: " + e.getMessage(), e);
        }
    }

    private String buildHtmlEmail(String subject, String bodyText) throws IOException {
        // Logo référencé par CID (Content-ID) — attaché séparément dans sendEmail()
        String logoSrc = "cid:smartrecruitLogo";

        // Échapper les caractères HTML spéciaux
        String escaped = bodyText
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");

        // 1. Parsing des raisons (Evaluation)
        String MARKER_REASONS_START = "##REASONS_START##";
        String MARKER_REASONS_END   = "##REASONS_END##";
        int rStart = escaped.indexOf(MARKER_REASONS_START);
        int rEnd   = escaped.indexOf(MARKER_REASONS_END);

        if (rStart != -1 && rEnd != -1 && rEnd > rStart) {
            String reasonsBlock = escaped.substring(rStart + MARKER_REASONS_START.length(), rEnd).trim();
            String reasonsCard =
                "<div style='margin:24px 0; padding:16px 20px; background-color:#f0f9ff; border-left:4px solid #0ea5e9; border-radius:8px;'>" +
                "<h4 style='margin:0 0 10px 0; color:#0369a1; font-size:14px; font-weight:700;'>&#128202; \u00c9valuation du profil</h4>" +
                "<div style='color:#334155; font-size:14px; line-height:1.6;'>" + reasonsBlock.replace("\n", "<br/>") + "</div>" +
                "</div>";
            escaped = escaped.substring(0, rStart) + reasonsCard + escaped.substring(rEnd + MARKER_REASONS_END.length());
        }

        // 2. Parsing de l'entretien
        String MARKER_START = "##INTERVIEW_START##";
        String MARKER_END   = "##INTERVIEW_END##";
        int startIdx = escaped.indexOf(MARKER_START);
        int endIdx   = escaped.indexOf(MARKER_END);

        if (startIdx != -1 && endIdx != -1 && endIdx > startIdx) {
            String interviewBlock = escaped.substring(startIdx + MARKER_START.length(), endIdx).trim();

            // Construire les lignes du tableau
            StringBuilder cardRows = new StringBuilder();
            for (String line : interviewBlock.split("\n")) {
                String clean = line.trim();
                if (clean.isEmpty()) continue;
                String[] parts = clean.split(":", 2);
                String label = parts.length > 0 ? parts[0].trim() : "";
                String value = parts.length > 1 ? parts[1].trim() : "";
                cardRows.append(
                    "<tr>" +
                    "<td style='padding:10px 20px;background:#f5f3ff;color:#6d28d9;font-weight:700;font-size:13px;white-space:nowrap;width:28%;border-bottom:1px solid #ede9fe;'>" + label + "</td>" +
                    "<td style='padding:10px 20px;color:#1e1b4b;font-size:14px;font-weight:600;border-bottom:1px solid #ede9fe;'>" + value + "</td>" +
                    "</tr>"
                );
            }

            String interviewCard =
                "<div style='margin:28px 0;'>" +
                "<table width='100%' cellpadding='0' cellspacing='0' style='border-radius:12px;overflow:hidden;border:1px solid #ddd6fe;'>" +
                "<tr><td colspan='2' style='background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:12px 20px;'>" +
                "<span style='color:#fff;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:1px;'>&#128197; D\u00e9tails de l&#39;entretien</span>" +
                "</td></tr>" +
                cardRows +
                "</table></div>";
            escaped = escaped.substring(0, startIdx) + interviewCard + escaped.substring(endIdx + MARKER_END.length());
        }

        // Convertir les sauts de ligne restants en <br/>
        String htmlBody = escaped.replace("\n", "<br/>");


        return "<!DOCTYPE html>" +
            "<html lang='fr'><head><meta charset='UTF-8'/></head>" +
            "<body style='margin:0;padding:0;background-color:#f4f6f9;font-family:Arial,Helvetica,sans-serif;'>" +

            "<table width='100%' cellpadding='0' cellspacing='0' style='background-color:#f4f6f9;padding:40px 0;'>" +
            "<tr><td align='center'>" +

            "<table width='600' cellpadding='0' cellspacing='0' style='background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);'>" +

            // Header: logo + titre du mail
            "<tr><td style='background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px 40px;text-align:center;'>" +
            "<img src='" + logoSrc + "' alt='Logo' style='height:56px;width:auto;margin-bottom:10px;display:block;margin-left:auto;margin-right:auto;border-radius:12px;'/>" +
            "<p style='margin:0;color:rgba(255,255,255,0.9);font-size:16px;font-weight:600;'>" + subject + "</p>" +
            "</td></tr>" +

            // Corps
            "<tr><td style='padding:36px 40px;'>" +
            "<div style='color:#374151;font-size:15px;line-height:1.8;'>" + htmlBody + "</div>" +
            "</td></tr>" +

            // Divider
            "<tr><td style='padding:0 40px;'><hr style='border:none;border-top:1px solid #e5e7eb;'/></td></tr>" +

            // Footer
            "<tr><td style='padding:20px 40px;text-align:center;'>" +
            "<p style='margin:0;color:#9ca3af;font-size:11px;'>Cet e-mail a été généré automatiquement. Merci de ne pas y répondre directement.</p>" +
            "</td></tr>" +

            "</table>" +
            "</td></tr></table>" +
            "</body></html>";
    }
}
