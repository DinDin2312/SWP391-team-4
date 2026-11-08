package com.team4.sportscenter.common.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

import java.util.List;

/**
 * Swagger UI for every API in the system: /api/swagger-ui.html
 * Sign in through POST /api/v1/auth/login, copy the token, then press "Authorize".
 */
@Configuration
@PropertySource("classpath:springdoc.properties")
public class OpenApiConfig {

    private static final String BEARER = "bearerAuth";

    @Bean
    public OpenAPI sportsCenterOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Nexus Sports Center API")
                        .version("v1")
                        .description("""
                                All REST endpoints of the sports center system, grouped by role.

                                **How to call protected endpoints:** sign in with `POST /api/v1/auth/login`, \
                                copy the `token` from the response, press **Authorize** and paste it. \
                                The token is kept while this page stays open.

                                Each group only works for the roles shown in its name; other roles get 403."""))
                // Relative server URL: works on localhost and behind the proxy on the VPS.
                .servers(List.of(new Server().url("/").description("This server")))
                .components(new Components().addSecuritySchemes(BEARER, new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")
                        .description("JWT from POST /api/v1/auth/login")))
                .addSecurityItem(new SecurityRequirement().addList(BEARER));
    }

    @Bean
    public GroupedOpenApi allApis() {
        return group("all", "0. All APIs", "/api/**");
    }

    @Bean
    public GroupedOpenApi authApis() {
        return group("auth", "1. Auth & account", "/api/v1/auth/**", "/api/v1/user/**");
    }

    @Bean
    public GroupedOpenApi publicApis() {
        return group("public", "2. Public (guest, images)", "/api/guest/**", "/api/avatars/**", "/api/resource-images/**");
    }

    @Bean
    public GroupedOpenApi memberApis() {
        return group("member", "3. Member", "/api/v1/member/**");
    }

    @Bean
    public GroupedOpenApi coachApis() {
        return group("coach", "4. Coach", "/api/v1/coach/**", "/api/coach/**");
    }

    @Bean
    public GroupedOpenApi receptionistApis() {
        return group("receptionist", "5. Receptionist", "/api/receptionist/**");
    }

    @Bean
    public GroupedOpenApi managerApis() {
        return group("manager", "6. Center Manager", "/api/manager/**", "/api/v1/manager/**");
    }

    @Bean
    public GroupedOpenApi paymentApis() {
        return group("payments", "7. Payments & invoices", "/api/v1/payment/**", "/api/v1/invoices/**");
    }

    @Bean
    public GroupedOpenApi notificationApis() {
        return group("notifications", "8. Notifications", "/api/v1/notifications/**");
    }

    private static GroupedOpenApi group(String id, String displayName, String... paths) {
        return GroupedOpenApi.builder().group(id).displayName(displayName).pathsToMatch(paths).build();
    }
}
