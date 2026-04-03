package ma.xproce.login_test.Exeptions;

/**
 * Exception levée quand un fichier CV est invalide
 * (taille, type, format incorrect, etc.)
 */
public class InvalidFileException extends RuntimeException {
    public InvalidFileException(String message) {
        super(message);
    }

    public InvalidFileException(String message, Throwable cause) {
        super(message, cause);
    }
}
