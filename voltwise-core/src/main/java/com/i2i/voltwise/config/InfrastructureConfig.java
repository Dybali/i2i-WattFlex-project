package com.i2i.voltwise.config;
import org.apache.ignite.Ignition;
import org.apache.ignite.client.IgniteClient;
import org.apache.ignite.configuration.ClientConfiguration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;
@Configuration public class InfrastructureConfig {
  @Bean(destroyMethod="close") IgniteClient ignite(@Value("${voltwise.ignite-addresses}") String addresses) { return Ignition.startClient(new ClientConfiguration().setAddresses(addresses.split(","))); }
  @Bean RestClient restClient() { return RestClient.builder().build(); }
}
