package com.uqhan.n8ncrmbackend;

import org.springframework.boot.SpringApplication;

public class TestN8ncrmbackendApplication {

	public static void main(String[] args) {
		SpringApplication.from(N8ncrmbackendApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
