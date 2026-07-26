package com.i2i.voltwise;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
@EnableScheduling
@SpringBootApplication public class VoltWiseApplication { public static void main(String[] args) { SpringApplication.run(VoltWiseApplication.class, args); } }
