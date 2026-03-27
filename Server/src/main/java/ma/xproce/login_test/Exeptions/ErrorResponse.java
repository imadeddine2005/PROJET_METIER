package ma.xproce.login_test.Exeptions;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

@Data
public class ErrorResponse {
    private LocalDateTime timestamp;
    private int status;
    private String error;
    private String message;
    private String errorCode;
    private String path;
    private String traceId;
    private Map<String, String> fieldErrors;

    public ErrorResponse(
            LocalDateTime timestamp,
            int status,
            String error,
            String message,
            String errorCode,
            String path,
            String traceId,
            Map<String, String> fieldErrors
    ) {
        this.timestamp = timestamp;
        this.status = status;
        this.error = error;
        this.message = message;
        this.errorCode = errorCode;
        this.path = path;
        this.traceId = traceId;
        this.fieldErrors = fieldErrors;
    }
}
