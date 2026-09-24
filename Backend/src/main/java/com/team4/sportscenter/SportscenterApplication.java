package com.team4.sportscenter;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SportscenterApplication {

	public static void main(String[] args) {
		SpringApplication.run(SportscenterApplication.class, args);
	}

}
