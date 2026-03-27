package ma.xproce.login_test.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import ma.xproce.login_test.Exeptions.ErrorResponse;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Retourne une réponse JSON 403 (comme ErrorResponse) quand un user connecté n'a pas le rôle requis.
 * Spring Security traite AccessDeniedException avant le controller, donc GlobalExceptionHandler ne le reçoit pas.
 */
@Component
public class CustomAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException {
        ErrorResponse errorResponse = new ErrorResponse(
                LocalDateTime.now(),
                403,
                "Forbidden",
                "Access denied",
                "ACCESS_DENIED",
                request.getRequestURI(),
                UUID.randomUUID().toString(),
                null
        );

        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getOutputStream(), errorResponse);
    }
}
