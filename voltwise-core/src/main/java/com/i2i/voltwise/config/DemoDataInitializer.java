package com.i2i.voltwise.config;

import com.i2i.voltwise.audit.ConsumptionSnapshot;
import com.i2i.voltwise.audit.SnapshotRepository;
import com.i2i.voltwise.home.Appliance;
import com.i2i.voltwise.home.Home;
import com.i2i.voltwise.home.HomeRepository;
import com.i2i.voltwise.state.LiveModels;
import com.i2i.voltwise.state.LiveStateService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Component
public class DemoDataInitializer implements ApplicationRunner {
  private final HomeRepository homes;
  private final SnapshotRepository snapshots;
  private final LiveStateService live;

  @Value("${voltwise.demo-data-enabled:true}")
  boolean enabled;

  public DemoDataInitializer(HomeRepository homes, SnapshotRepository snapshots, LiveStateService live) {
    this.homes = homes;
    this.snapshots = snapshots;
    this.live = live;
  }

  @Override
  @Transactional
  public void run(ApplicationArguments args) {
    if (!enabled) return;
    createDemo("Yeşil Vadi Evi", "normal@voltwise.demo", 1500, 310, 4.8, false, false);
    createDemo("Sahil Apartmanı", "uyari@voltwise.demo", 1200, 1020, 18.4, false, false);
    createDemo("Merkez Rezidans", "ceza@voltwise.demo", 1000, 1145, 26.7, true, false);
    createDemo("Akıllı Villa", "anomali@voltwise.demo", 1800, 720, 12.9, false, true);
  }

  private void createDemo(String name, String email, double budget, double cost,
                          double energy, boolean penalty, boolean anomaly) {
    Home home = homes.findByName(name).orElse(null);
    boolean newlyCreated = home == null;
    if (newlyCreated) {
      home = new Home(UUID.randomUUID(), name, email, BigDecimal.valueOf(budget),
          BigDecimal.valueOf(2.60), BigDecimal.valueOf(1.50));
      home.appliances.add(new Appliance(UUID.randomUUID(), home, "Klima", BigDecimal.valueOf(1800)));
      home.appliances.add(new Appliance(UUID.randomUUID(), home, "Buzdolabı", BigDecimal.valueOf(450)));
      home.appliances.add(new Appliance(UUID.randomUUID(), home, "Çamaşır Makinesi", BigDecimal.valueOf(2200)));
      homes.save(home);
    }
    live.register(home);

    LiveModels.HomeLive state = live.get(home.id);
    state.energyKwh = energy;
    state.cost = cost;
    state.penalty = penalty;
    state.warningSent = cost >= budget * .80;
    state.breachSent = cost >= budget;
    state.updatedAt = Instant.now().toEpochMilli();

    int index = 0;
    for (LiveModels.ApplianceLive device : state.appliances.values()) {
      device.watts = index == 0 ? (anomaly ? 2350 : 780) : 180 + index * 120;
      if (anomaly && index == 0) {
        device.breachCount = 3;
        device.anomalous = true;
      }
      index++;
    }
    live.put(state);

    if (newlyCreated) {
      for (int day = 6; day >= 0; day--) {
        double factor = (7 - day) / 7.0;
        var snapshot = new ConsumptionSnapshot(home, energy * factor, cost * factor);
        snapshot.capturedAt = Instant.now().minus(day, ChronoUnit.DAYS);
        snapshots.save(snapshot);
      }
    }
  }
}
