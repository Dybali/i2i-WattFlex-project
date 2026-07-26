package com.i2i.voltwise.notification;

public class EVProfileDto {
    private String brand;
    private String model;
    private String batteryName;
    private double batteryCapacity;
    private double dailyKm;
    private double avgConsumptionKwh;
    private int homeChargeDaysPerWeek;
    private double dailyEvConsumptionKwh;

    // Getter ve Setter'lar
    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public double getBatteryCapacity() { return batteryCapacity; }
    public void setBatteryCapacity(double batteryCapacity) { this.batteryCapacity = batteryCapacity; }

    public double getDailyKm() { return dailyKm; }
    public void setDailyKm(double dailyKm) { this.dailyKm = dailyKm; }

    public double getAvgConsumptionKwh() { return avgConsumptionKwh; }
    public void setAvgConsumptionKwh(double avgConsumptionKwh) { this.avgConsumptionKwh = avgConsumptionKwh; }

    public int getHomeChargeDaysPerWeek() { return homeChargeDaysPerWeek; }
    public void setHomeChargeDaysPerWeek(int homeChargeDaysPerWeek) { this.homeChargeDaysPerWeek = homeChargeDaysPerWeek; }

    public double getDailyEvConsumptionKwh() { return dailyEvConsumptionKwh; }
    public void setDailyEvConsumptionKwh(double dailyEvConsumptionKwh) { this.dailyEvConsumptionKwh = dailyEvConsumptionKwh; }
}