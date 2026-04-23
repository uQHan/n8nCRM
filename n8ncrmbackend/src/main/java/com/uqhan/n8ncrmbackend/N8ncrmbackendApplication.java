package com.uqhan.n8ncrmbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class N8ncrmbackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(N8ncrmbackendApplication.class, args);
	}

}

