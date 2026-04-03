package ma.xproce.login_test.Exeptions;

/**
 * Exception levée quand une transition d'état de candidature est invalide
 */
public class InvalidCandidatureStatusTransitionException extends RuntimeException {
    public InvalidCandidatureStatusTransitionException(String message) {
        super(message);
    }

    public InvalidCandidatureStatusTransitionException(String message, Throwable cause) {
        super(message, cause);
    }
}
