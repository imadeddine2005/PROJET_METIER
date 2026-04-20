package ma.xproce.login_test.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;


/**

 * ajout de deux blocs importants :
 *   1. .headers(...) → 5 headers HTTP de sécurité
 *   2. .cors(...)    → configuration CORS explicite

 * Ces ajouts répondent à :
 *   - RGPD Art. 32 : mesures techniques de protection
 *   - OWASP Top 10 : A05 Security Misconfiguration
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    private final CustomUserDetailService customUserDetailService;
    private final JwtAuthEntryPoint jwtAuthEntryPoint;
    private final CustomAccessDeniedHandler customAccessDeniedHandler;

    public SecurityConfig(CustomUserDetailService customUserDetailService, JwtAuthEntryPoint jwtAuthEntryPoint,
                          CustomAccessDeniedHandler customAccessDeniedHandler) {
        this.customUserDetailService = customUserDetailService;
        this.jwtAuthEntryPoint = jwtAuthEntryPoint;
        this.customAccessDeniedHandler = customAccessDeniedHandler;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .headers(headers -> headers

                        //header1 : X-frame-Options: Deny (Protège contre le clickjacking)

                        .frameOptions(frame -> frame.deny())
                        //Header2 : X-content-type-options: nosniff (Protèger contre MIME-type sniffing attacks)
                        .contentTypeOptions(content -> {})
                        //Header3 : Strict-Transport-Security (HSTS) ─PROTÈGE CONTRE : SSL stripping, connexions HTTP
                        .httpStrictTransportSecurity(hsts ->hsts
                                .maxAgeInSeconds(31536000)
                                .includeSubDomains(true))
                        //header4 : Referrer-Policy (Protège contre  les fuite d'infos dans les URLs)
                        .referrerPolicy(referrer -> referrer
                                .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN)
                        )
                        //Header5 : Content-security-Policy(CSP) (PROTÈGE CONTRE : XSS (Cross-Site Scripting))
                        .contentSecurityPolicy(csp -> csp
                                .policyDirectives(
                                        "default-src 'self';"+
                                                "script-src 'self';"+
                                                "object-src 'none'"
                                )
                        )
                )
                //bloc2 :  Configuration CORS (Cross-Origin Resource Sharing)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))


                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(jwtAuthEntryPoint)
                        .accessDeniedHandler(customAccessDeniedHandler))
                .sessionManagement(session->session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorizeRequests -> authorizeRequests
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .requestMatchers("/hr/**").hasAnyRole("HR", "ADMIN")
                        .requestMatchers("/candidate/**").hasAnyRole("CANDIDAT", "ADMIN")
                        .requestMatchers("/api/audit/**").hasRole("ADMIN")
                        // endpoint de santé pour Docker healthcheck
                        .requestMatchers("/api/health").permitAll()
                        .anyRequest().authenticated());
        http.addFilterBefore(jwtAutenticationFilter() , UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
    //Bean CORS :  définit les origines et méthodes autorisées
    @Bean
    public CorsConfigurationSource corsConfigurationSource(){
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
                "http://localhost:3000",    // React dev
                "http://localhost:5173",    // Vite dev server
                "http://localhost:80",
                "http://100.51.240.199",
                "http://3.232.133.202"
                // Client Docker en local
                // "http://16.170.26.64"   // ←  après déploiement EC2
        ));

        config.setAllowedMethods(
                Arrays.asList("GET","POST", "PUT", "DELETE", "PATCH", "OPTIONS")
        );
        // Headers autorisés dans les requêtes entrantes
        // Authorization : pour le token JWT (Bearer xxx)
        // Content-Type  : pour les requêtes JSON et multipart
        config.setAllowedHeaders(
                Arrays.asList("Authorization", "Content-Type", "Accept")
        );

        //nécessaire pour l'envoi des cookies
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Appliquer cette configuration à TOUS les endpoints
        source.registerCorsConfiguration("/**", config);
        return source;
    }
    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception{
        return authConfig.getAuthenticationManager();
    }

    @Bean
    PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }

    @Bean
    public JwtAutenticationFilter jwtAutenticationFilter(){
        return new JwtAutenticationFilter();
    }

}