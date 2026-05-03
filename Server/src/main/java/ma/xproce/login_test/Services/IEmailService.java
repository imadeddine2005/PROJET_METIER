package ma.xproce.login_test.Services;

/**
 * Interface pour l'envoi d'e-mails.
 */
public interface IEmailService {
    
    /**
     * Envoie un e-mail au destinataire spécifié.
     * 
     * @param to Adresse e-mail du destinataire
     * @param subject Sujet de l'e-mail
     * @param text Corps de l'e-mail (texte brut)
     */
    void sendEmail(String to, String subject, String text);
}
