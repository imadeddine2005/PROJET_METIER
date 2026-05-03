package ma.xproce.login_test.dto.EmailDtos;

import lombok.Data;

@Data
public class GenerateEmailRequest {
    private String language; // "fr", "en", "ar"
}
