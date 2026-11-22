package eventlink.config;

import eventlink.security.JwtFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth

                        // Public
                        .requestMatchers("/api/auth/**").permitAll()

                        // ADMIN only
                        .requestMatchers(HttpMethod.POST,   "/api/evenements").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT,    "/api/evenements/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/evenements/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/users/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET,    "/api/users/participants").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET,    "/api/inscriptions/evenement/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT,    "/api/inscriptions/*/valider").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT,    "/api/inscriptions/*/refuser").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/commentaires/*/admin").hasRole("ADMIN")

                        // Authenticated (ADMIN + PARTICIPANT)
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}