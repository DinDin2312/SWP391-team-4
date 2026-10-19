package com.team4.sportscenter.common.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class JacksonConfig {

    @Bean
    public org.springframework.boot.jackson.autoconfigure.JsonMapperBuilderCustomizer strictIntegerInputs() {
        return builder -> builder.disable(tools.jackson.databind.DeserializationFeature.ACCEPT_FLOAT_AS_INT);
    }

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        // Integer fields (IDs, minutes, lesson counts) must not silently truncate decimals.
        mapper.disable(DeserializationFeature.ACCEPT_FLOAT_AS_INT);
        return mapper;
    }
}
