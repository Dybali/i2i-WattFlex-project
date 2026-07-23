package com.i2i.voltwise.home;
import jakarta.persistence.*; import java.math.BigDecimal; import java.util.UUID;
@Entity @Table(name="appliances") public class Appliance { @Id public UUID id; @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="home_id") public Home home; @Column(nullable=false) public String name; @Column(name="safe_watt_limit",nullable=false) public BigDecimal safeWattLimit; protected Appliance(){} public Appliance(UUID id,Home home,String name,BigDecimal limit){this.id=id;this.home=home;this.name=name;this.safeWattLimit=limit;} }
