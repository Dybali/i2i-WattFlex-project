import React, { useState } from 'react';

export const EV_DATABASE = [
    { brand: 'Togg', model: 'T10X', batteries: [{ name: 'Standart Menzil', capacity: 52.4 }, { name: 'Uzun Menzil', capacity: 88.5 }] },
    { brand: 'Togg', model: 'T10F', batteries: [{ name: 'Standart Menzil', capacity: 52.4 }, { name: 'Uzun Menzil', capacity: 88.5 }] },
    { brand: 'Tesla', model: 'Model Y', batteries: [{ name: 'Arkadan İtişli (RWD)', capacity: 60.0 }, { name: 'Long Range / Performance', capacity: 78.1 }] },
    { brand: 'BYD', model: 'Atto 3', batteries: [{ name: 'Standart', capacity: 60.48 }] },
    { brand: 'BYD', model: 'Seal U DM-i', batteries: [{ name: 'Plug-in Hybrid (PHEV)', capacity: 18.3 }] },
    { brand: 'Volvo', model: 'EX30', batteries: [{ name: 'Single Motor', capacity: 51.0 }, { name: 'Extended Range', capacity: 69.0 }] },
    { brand: 'KG Mobility', model: 'Torres EVX', batteries: [{ name: 'Standart', capacity: 73.4 }] },
    { brand: 'Kia', model: 'EV3', batteries: [{ name: 'Standart', capacity: 58.3 }, { name: 'Uzun Menzil', capacity: 81.4 }] },
    { brand: 'Opel', model: 'Frontera Elektrik', batteries: [{ name: 'Standart', capacity: 44.0 }] },
    { brand: 'Mini', model: 'Countryman', batteries: [{ name: 'Countryman E', capacity: 66.45 }] },
    { brand: 'Renault', model: 'Megane E-Tech', batteries: [{ name: 'EV60', capacity: 60.0 }] },
    { brand: 'Hyundai', model: 'Ioniq 5', batteries: [{ name: 'Standart', capacity: 58.0 }, { name: 'Uzun Menzil', capacity: 72.6 }] },
    { brand: 'Ford', model: 'Kuga PHEV', batteries: [{ name: 'Plug-in Hybrid Batarya', capacity: 14.4 }] },
    { brand: 'Jaecoo', model: '7 PHEV', batteries: [{ name: 'Plug-in Hybrid Batarya', capacity: 18.3 }] }
];

export default function EVOnboardingModal({ isOpen, onComplete, onSkip }) {
    const [selectedVehicle, setSelectedVehicle] = useState({
        brand: '',
        model: '',
        batteryName: '',
        batteryCapacity: 0
    });

    const [usageData, setUsageData] = useState({
        dailyKm: 40,
        avgConsumptionKwh: 16.5, // 100 km'de ortalama kW/kWh tüketimi
        homeChargeDaysPerWeek: 4
    });

    const [step, setStep] = useState(1);

    if (!isOpen) return null;

    // Filtrelenmiş Model ve Paket Listeleri
    const availableModels = EV_DATABASE.filter(v => v.brand === selectedVehicle.brand);
    const selectedModelObj = availableModels.find(v => v.model === selectedVehicle.model);

    // Demo Yükle Butonu İşlevi
    const handleLoadDemo = () => {
        const demoVehicle = {
            brand: 'Togg',
            model: 'T10F',
            batteryName: 'Standart Menzil',
            batteryCapacity: 52.4
        };
        const demoUsage = {
            dailyKm: 45,
            avgConsumptionKwh: 15.8,
            homeChargeDaysPerWeek: 4
        };

        setSelectedVehicle(demoVehicle);
        setUsageData(demoUsage);

        // Analiz hesaplamasıyla doğrudan ilerle
        const analysis = calculateEVMetrics(demoVehicle, demoUsage);
        onComplete({ vehicle: demoVehicle, usage: demoUsage, analysis });
    };

    // İlerle / Tamamla Butonu
    const handleAdvance = () => {
        if (step === 1) {
            if (!selectedVehicle.brand || !selectedVehicle.model || !selectedVehicle.batteryCapacity) {
                alert('Lütfen araç markası, modeli ve batarya paketini seçiniz.');
                return;
            }
            setStep(2);
        } else {
            const analysis = calculateEVMetrics(selectedVehicle, usageData);
            onComplete({ vehicle: selectedVehicle, usage: usageData, analysis });
        }
    };

    return (
        <div className="modal-overlay">
            <div className="ev-modal-card">
                <div className="ev-modal-header">
                    <h2>⚡ Elektrikli Araç Profilinizi Oluşturun</h2>
                    <p>Enerji tüketimi ve akıllı şarj optimizasyonları için araç bilgilerinizi girin.</p>
                </div>

                <div className="ev-modal-body">
                    {step === 1 ? (
                        <div className="step-container">
                            <h3>1. Araç Seçimi</h3>

                            <div className="form-group">
                                <label>Marka</label>
                                <select
                                    value={selectedVehicle.brand}
                                    onChange={(e) => setSelectedVehicle({ brand: e.target.value, model: '', batteryName: '', batteryCapacity: 0 })}
                                >
                                    <option value="">Marka Seçiniz</option>
                                    {[...new Set(EV_DATABASE.map(item => item.brand))].map(brand => (
                                        <option key={brand} value={brand}>{brand}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Model</label>
                                <select
                                    value={selectedVehicle.model}
                                    disabled={!selectedVehicle.brand}
                                    onChange={(e) => setSelectedVehicle(prev => ({ ...prev, model: e.target.value, batteryName: '', batteryCapacity: 0 }))}
                                >
                                    <option value="">Model Seçiniz</option>
                                    {availableModels.map(item => (
                                        <option key={item.model} value={item.model}>{item.model}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Batarya / Paket</label>
                                <select
                                    value={selectedVehicle.batteryName}
                                    disabled={!selectedVehicle.model}
                                    onChange={(e) => {
                                        const bat = selectedModelObj?.batteries.find(b => b.name === e.target.value);
                                        setSelectedVehicle(prev => ({
                                            ...prev,
                                            batteryName: e.target.value,
                                            batteryCapacity: bat ? bat.capacity : 0
                                        }));
                                    }}
                                >
                                    <option value="">Paket Seçiniz</option>
                                    {selectedModelObj?.batteries.map(bat => (
                                        <option key={bat.name} value={bat.name}>
                                            {bat.name} ({bat.capacity} kWh)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="step-container">
                            <h3>2. Tüketim ve Şarj Alışkanlıkları</h3>
                            <p className="selected-summary">
                                Seçilen Araç: <strong>{selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.batteryCapacity} kWh)</strong>
                            </p>

                            <div className="form-group">
                                <label>Günlük Katedilen Ortalama Mesafe (km)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={usageData.dailyKm}
                                    onChange={(e) => setUsageData({ ...usageData, dailyKm: Number(e.target.value) })}
                                />
                            </div>

                            <div className="form-group">
                                <label>100 km'deki Ortalama Tüketim (kWh)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="5"
                                    value={usageData.avgConsumptionKwh}
                                    onChange={(e) => setUsageData({ ...usageData, avgConsumptionKwh: Number(e.target.value) })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Haftada Kaç Gün Evden Şarj Ediliyor?</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="7"
                                    value={usageData.homeChargeDaysPerWeek}
                                    onChange={(e) => setUsageData({ ...usageData, homeChargeDaysPerWeek: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Alt Buton Alanı */}
                <div className="ev-modal-footer">
                    <button className="btn-secondary" onClick={onSkip}>Bu adımı atla</button>
                    <button className="btn-demo" onClick={handleLoadDemo}>Demo yükle</button>
                    <button className="btn-primary" onClick={handleAdvance}>
                        {step === 1 ? 'İlerle' : 'Kaydet ve Tamamla'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Analiz Hesaplama Fonksiyonu
export function calculateEVMetrics(vehicle, usage) {
    const dailyEvConsumptionKwh = (usage.dailyKm * usage.avgConsumptionKwh) / 100;
    const weeklyEvConsumptionKwh = dailyEvConsumptionKwh * usage.homeChargeDaysPerWeek;
    const monthlyEvConsumptionKwh = weeklyEvConsumptionKwh * 4.33;

    // Standart ev prizi (3.7 kW) veya Wallbox (7.4 kW / 11 kW) şarj süresi tahmini
    const estimatedChargeTimeHours = dailyEvConsumptionKwh / 7.4;

    return {
        dailyEvConsumptionKwh: Number(dailyEvConsumptionKwh.toFixed(2)),
        weeklyEvConsumptionKwh: Number(weeklyEvConsumptionKwh.toFixed(2)),
        monthlyEvConsumptionKwh: Number(monthlyEvConsumptionKwh.toFixed(2)),
        estimatedChargeTimeHours: Number(estimatedChargeTimeHours.toFixed(1)),
        batteryCapacity: vehicle.batteryCapacity
    };
}