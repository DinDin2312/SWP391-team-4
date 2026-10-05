package com.team4.sportscenter.common.config;

import com.team4.sportscenter.security.jwt.JwtAuthenticationFilter;
import com.team4.sportscenter.security.auth.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsServiceImpl userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults()) // SÄ‚Â¡Ă‚Â»Ă‚Â­ dÄ‚Â¡Ă‚Â»Ă‚Â¥ng cÄ‚Â¡Ă‚ÂºĂ‚Â¥u hĂ„â€Ă‚Â¬nh corsConfigurationSource bĂ„â€Ă‚Âªn dÄ‚â€ Ă‚Â°Ä‚Â¡Ă‚Â»Ă¢â‚¬Âºi
                .authorizeHttpRequests(auth -> auth
                        // Preflight OPTIONS
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Auth endpoints
                        .requestMatchers("/api/v1/auth/**", "/api/auth/**", "/auth/**", "/api/guest/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/avatars/**").permitAll()

                        // Cho phĂ„â€Ă‚Â©p truy cÄ‚Â¡Ă‚ÂºĂ‚Â­p cĂ„â€Ă‚Â¡c API cÄ‚Â¡Ă‚Â»Ă‚Â§a Receptionist
                        .requestMatchers("/api/receptionist/**", "/receptionist/**").hasAnyRole("RECEPTIONIST", "CENTER_MANAGER")


                  


                        // Manager operations are restricted to the Center Manager authority.
                        .requestMatchers("/api/manager/**").hasRole("CENTER_MANAGER")
                        .requestMatchers("/api/v1/coach/**", "/api/coach/**").hasAnyRole("COACH", "CENTER_MANAGER")

                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint((request, response, exception) -> {
                            response.setStatus(401);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"message\":\"PhiĂ„â€Ă‚Âªn Ä‚â€Ă¢â‚¬ËœÄ‚â€Ă†â€™ng nhÄ‚Â¡Ă‚ÂºĂ‚Â­p khĂ„â€Ă‚Â´ng hÄ‚Â¡Ă‚Â»Ă‚Â£p lÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¡ hoÄ‚Â¡Ă‚ÂºĂ‚Â·c tĂ„â€Ă‚Â i khoÄ‚Â¡Ă‚ÂºĂ‚Â£n Ä‚â€Ă¢â‚¬ËœĂ„â€Ă‚Â£ bÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¹ khĂ„â€Ă‚Â³a.\"}");
                        })
                        .accessDeniedHandler((request, response, exception) -> {
                            response.setStatus(403);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"message\":\"BÄ‚Â¡Ă‚ÂºĂ‚Â¡n khĂ„â€Ă‚Â´ng cĂ„â€Ă‚Â³ quyÄ‚Â¡Ă‚Â»Ă‚Ân thÄ‚Â¡Ă‚Â»Ă‚Â±c hiÄ‚Â¡Ă‚Â»Ă¢â‚¬Â¡n thao tĂ„â€Ă‚Â¡c nĂ„â€Ă‚Â y.\"}");
                        }))
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // Bean cÄ‚Â¡Ă‚ÂºĂ‚Â¥u hĂ„â€Ă‚Â¬nh chi tiÄ‚Â¡Ă‚ÂºĂ‚Â¿t CORS cho toĂ„â€Ă‚Â n bÄ‚Â¡Ă‚Â»Ă¢â€Â¢ Ä‚Â¡Ă‚Â»Ă‚Â©ng dÄ‚Â¡Ă‚Â»Ă‚Â¥ng
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Cho phĂ„â€Ă‚Â©p nguÄ‚Â¡Ă‚Â»Ă¢â‚¬Å“n Front-end (Vite/React thÄ‚â€ Ă‚Â°Ä‚Â¡Ă‚Â»Ă‚Âng chÄ‚Â¡Ă‚ÂºĂ‚Â¡y 5173 hoÄ‚Â¡Ă‚ÂºĂ‚Â·c 3000)
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept", "X-Requested-With", "Origin"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}



