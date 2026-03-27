package ma.xproce.login_test.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import io.jsonwebtoken.security.Keys;

@Component
public class JwtGenerator {
    @Value("${jwt.secret}")
    private String secret;
    @Value("${jwt.expiration}")
    private long expiration;

    private SecretKey signingKey() {
        // Use raw UTF-8 bytes of the configured secret (must be >= 32 bytes for HS256).
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(Authentication authentication) {
        String Username = authentication.getName();
        Date cutentDate = new Date();
        Date expiryDate = new Date(cutentDate.getTime() + expiration);

        String Token = Jwts.builder()
                .setSubject(Username)
                .setIssuedAt(cutentDate)
                .setExpiration(expiryDate)
                .signWith(signingKey(), SignatureAlgorithm.HS256)
                .compact();
        return Token;

    }

    public String getUsernameFromJwt(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(signingKey())
                .build()
                .parseClaimsJws(token).getBody();
        return claims.getSubject();
    }

    public boolean ValidatToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(signingKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (JwtException e) {
            throw new AuthenticationCredentialsNotFoundException("Jwt was expired or not correct");
        }
    }
}
