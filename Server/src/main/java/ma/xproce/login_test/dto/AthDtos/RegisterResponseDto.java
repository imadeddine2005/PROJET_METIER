package ma.xproce.login_test.dto.AthDtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterResponseDto {
    private String username;
    private String message;

    public static RegisterResponseDto of(String username) {
        return new RegisterResponseDto(username, "Registration success");
    }
}
