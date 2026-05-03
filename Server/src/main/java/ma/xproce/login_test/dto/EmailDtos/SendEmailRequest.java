package ma.xproce.login_test.dto.EmailDtos;

import lombok.Data;

@Data
public class SendEmailRequest {
    private String subject;
    private String body;
}
