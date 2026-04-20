package ma.xproce.login_test.web;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/h")
public class test_controleur {

    @GetMapping("/hello")
    public String hello() {
        return "hello public";
    }

    @GetMapping("/hr")
    public String hr() {
        return "hello hr";
    }

    @GetMapping("/candidate")
    public String condidat() {
        return "hello condidat";
    }

    @GetMapping("/admin")
    public String admin() {
        return "admin";
    }

    /**
     * Health check endpoint — public (déclaré dans SecurityConfig : /health/**)
     * Utilisé par Docker pour vérifier que le serveur est opérationnel.
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("UP");
    }
}
