package com.uqhan.n8ncrmbackend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class N8ncrmbackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
