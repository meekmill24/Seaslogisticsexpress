'use client';

import React, { useEffect, useState } from 'react';
import { getRateSettings, updateRateSettings } from '@/lib/firestore';

export default function RatesPage() {
  const [settings, setSettings] = useState({
    currency: 'USD',
    exchangeRates: {
      INR: 83.35, NGN: 1530, VND: 25440, IDR: 16180, THB: 36.7, SAR: 3.75, MXN: 16.9
    },
    basePickupFee: 0,
    pricePerKg: 0,
    minCharge: 0,
    dimDivisor: 5000,
    fuelSurcharge: 0,
    handlingFee: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Simulator State
  const [sim, setSim] = useState({ l: 10, w: 10, h: 10, weight: 1, targetCurrency: 'USD' });
  const [estimate, setEstimate] = useState(0);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    calculateEstimate();
  }, [settings, sim]);

  async function fetchSettings() {
    try {
      const data = await getRateSettings();
      setSettings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Ensure numeric values
      const numericSettings = {
        ...settings,
        basePickupFee: parseFloat(settings.basePickupFee),
        pricePerKg: parseFloat(settings.pricePerKg),
        minCharge: parseFloat(settings.minCharge),
        dimDivisor: parseFloat(settings.dimDivisor),
        fuelSurcharge: parseFloat(settings.fuelSurcharge),
        handlingFee: parseFloat(settings.handlingFee),
        // Exchange rates are already numeric or handled by inputs
      };
      await updateRateSettings(numericSettings);
      alert('Rates updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Error updating rates.');
    } finally {
      setSaving(false);
    }
  }

  const calculateEstimate = () => {
    const { basePickupFee, pricePerKg, minCharge, dimDivisor, fuelSurcharge, handlingFee, exchangeRates } = settings;
    const { l, w, h, weight, targetCurrency } = sim;

    const rate = targetCurrency === 'USD' ? 1 : (exchangeRates[targetCurrency] || 1);
    const dimWeight = (l * w * h) / dimDivisor;
    const billableWeight = Math.max(weight, dimWeight);
    
    const subtotal = parseFloat(basePickupFee) + (billableWeight * parseFloat(pricePerKg));
    const withFuel = subtotal * (1 + (parseFloat(fuelSurcharge) / 100));
    const total = (withFuel + parseFloat(handlingFee)) * rate;
    
    setEstimate(Math.max(parseFloat(minCharge) * rate, total).toFixed(2));
  };

  if (loading) return <div className="p-4 text-center"><i className="fas fa-spinner fa-spin me-2"></i> Loading Engine...</div>;

  return (
    <div className="container-fluid pb-5">
      <div className="mb-4">
        <h4 className="fw-bold mb-1">Pricing & Globalization Engine</h4>
        <p className="text-muted small">Manage global base rates and real-time currency exchange conversions.</p>
      </div>

      <div className="row g-4">
        {/* Settings Form */}
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 p-4 mb-4">
            <h6 className="fw-bold mb-4 border-bottom pb-2">Base Pricing Rules (USD Reference)</h6>
            <form onSubmit={handleSave}>
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <label className="form-label small fw-bold">Base Pickup Fee ($)</label>
                  <input type="number" step="0.01" className="form-control" value={settings.basePickupFee} onChange={e => setSettings({...settings, basePickupFee: e.target.value})} required />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold">Price per KG ($)</label>
                  <input type="number" step="0.01" className="form-control" value={settings.pricePerKg} onChange={e => setSettings({...settings, pricePerKg: e.target.value})} required />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold">Minimum Charge ($)</label>
                  <input type="number" step="0.01" className="form-control" value={settings.minCharge} onChange={e => setSettings({...settings, minCharge: e.target.value})} required />
                </div>
                <div className="col-md-4">
                   <label className="form-label small fw-bold">DIM Divisor</label>
                   <input type="number" className="form-control" value={settings.dimDivisor} onChange={e => setSettings({...settings, dimDivisor: e.target.value})} required />
                </div>
                <div className="col-md-4">
                   <label className="form-label small fw-bold">Fuel Surcharge (%)</label>
                   <input type="number" step="0.1" className="form-control" value={settings.fuelSurcharge} onChange={e => setSettings({...settings, fuelSurcharge: e.target.value})} required />
                </div>
                <div className="col-md-4">
                   <label className="form-label small fw-bold">Flat Handling Fee ($)</label>
                   <input type="number" step="0.01" className="form-control" value={settings.handlingFee} onChange={e => setSettings({...settings, handlingFee: e.target.value})} required />
                </div>
              </div>

              <h6 className="fw-bold mb-3 mt-5 text-primary"><i className="fas fa-globe-americas me-2"></i>Live Exchange Rates (1 USD = X)</h6>
              <div className="row g-3 bg-light p-3 rounded-3 border">
                 {Object.entries(settings.exchangeRates).map(([code, val]) => (
                   <div className="col-md-3 col-sm-4" key={code}>
                      <label className="form-label x-small fw-bold text-uppercase text-muted">{code}</label>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text bg-white border-end-0">{code}</span>
                        <input 
                          type="number" 
                          step="0.01" 
                          className="form-control border-start-0" 
                          value={val} 
                          onChange={e => setSettings({
                            ...settings, 
                            exchangeRates: { ...settings.exchangeRates, [code]: parseFloat(e.target.value) || 0 }
                          })} 
                        />
                      </div>
                   </div>
                 ))}
              </div>

              <div className="mt-5 pt-3 border-top d-flex justify-content-between align-items-center">
                <span className="text-muted small italic">Last modified: {settings.updatedAt}</span>
                <button type="submit" className="btn btn-primary px-5 py-2 fw-bold shadow-sm" disabled={saving}>
                   {saving ? 'Syncing...' : 'Save Global Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Live Simulator */}
        <div className="col-lg-4">
           <div className="card shadow-sm border-0 p-4 bg-dark text-white sticky-top" style={{top: '100px'}}>
              <h6 className="fw-bold mb-4 border-bottom border-secondary pb-2">Global Price Simulator</h6>
              
              <div className="mb-3">
                 <label className="form-label small opacity-75">Target Currency</label>
                 <select className="form-select bg-secondary border-0 text-white" value={sim.targetCurrency} onChange={e => setSim({...sim, targetCurrency: e.target.value})}>
                    <option value="USD">US Dollar ($)</option>
                    {Object.keys(settings.exchangeRates).map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
              </div>

              <div className="mb-3">
                 <label className="form-label small opacity-75">Package Dimensions (cm)</label>
                 <div className="input-group input-group-sm">
                    <input type="number" placeholder="L" className="form-control bg-secondary border-0 text-white" value={sim.l} onChange={e => setSim({...sim, l: e.target.value})} />
                    <input type="number" placeholder="W" className="form-control bg-secondary border-0 text-white" value={sim.w} onChange={e => setSim({...sim, w: e.target.value})} />
                    <input type="number" placeholder="H" className="form-control bg-secondary border-0 text-white" value={sim.h} onChange={e => setSim({...sim, h: e.target.value})} />
                 </div>
              </div>
              
              <div className="mb-4">
                 <label className="form-label small opacity-75">Actual Weight (Kg)</label>
                 <input type="number" step="0.1" className="form-control bg-secondary border-0 text-white" value={sim.weight} onChange={e => setSim({...sim, weight: e.target.value})} />
              </div>

              <div className="p-4 rounded text-center border border-warning border-opacity-25" style={{background: 'rgba(255,255,255,0.05)'}}>
                  <p className="small mb-1 text-uppercase opacity-50 tracking-wider">Converted Quote</p>
                  <h1 className="fw-bold mb-0 text-warning">
                    {sim.targetCurrency === 'USD' ? '$' : sim.targetCurrency + ' '}{estimate}
                  </h1>
                  <span className="small opacity-50">Local pricing preview</span>
              </div>

              <div className="mt-4 small opacity-75 d-flex flex-column gap-2">
                  <div className="d-flex justify-content-between">
                    <span>Chargeable Weight:</span>
                    <span className="fw-bold">{Math.max(sim.weight, (sim.l * sim.w * sim.h) / settings.dimDivisor).toFixed(2)}kg</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Applied Rate (1 USD):</span>
                    <span className="fw-bold text-success">{sim.targetCurrency === 'USD' ? '1.00' : settings.exchangeRates[sim.targetCurrency]}</span>
                  </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
