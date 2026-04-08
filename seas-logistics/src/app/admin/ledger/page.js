'use client';

import React, { useEffect, useState } from 'react';
import { getFinancialLedger } from '@/lib/firestore';

export default function LedgerPage() {
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLedger() {
      try {
        const data = await getFinancialLedger();
        setLedger(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchLedger();
  }, []);

  const totalCommissions = ledger
    .filter(t => t.type === 'referral_commission')
    .reduce((acc, t) => acc + (t.amount || 0), 0);

  const totalBonuses = ledger
    .filter(t => t.type === 'welcome_bonus')
    .reduce((acc, t) => acc + (t.amount || 0), 0);

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Financial Oversight Ledger</h4>
          <p className="text-muted small">Comprehensive audit log of all bonuses, commissions, and credits.</p>
        </div>
        <button className="btn btn-outline-dark no-print px-4 py-2 shadow-sm rounded-pill d-flex align-items-center gap-2" onClick={() => window.print()}>
          <i className="fas fa-print"></i> Export Financial Report
        </button>
      </div>

      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
             <div className="p-4 bg-primary text-white">
                <p className="small mb-1 text-uppercase fw-bold opacity-75">Platform Turnover</p>
                <h3 className="fw-bold mb-0">${(totalCommissions + totalBonuses).toLocaleString()}</h3>
             </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
             <div className="p-4 bg-success text-white">
                <p className="small mb-1 text-uppercase fw-bold opacity-75">Total Referral Commissions</p>
                <h3 className="fw-bold mb-0">${totalCommissions.toLocaleString()}</h3>
             </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
             <div className="p-4 bg-warning text-dark font-weight-bold">
                <p className="small mb-1 text-uppercase fw-bold opacity-75">Total Welcome Bonuses</p>
                <h3 className="fw-bold mb-0">${totalBonuses.toLocaleString()}</h3>
             </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0 rounded-4 overflow-hidden" id="printableCertificate">
        <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
          <h6 className="fw-bold mb-0">Auditable Transaction History</h6>
          <span className="badge bg-light text-dark shadow-sm border px-3 py-2 rounded-pill">Total Transactions: {ledger.length}</span>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="px-4 py-3 small text-muted text-uppercase">Reference / Type</th>
                <th className="py-3 small text-muted text-uppercase">Description</th>
                <th className="py-3 small text-muted text-uppercase">Amount (USD)</th>
                <th className="py-3 small text-muted text-uppercase">Date & Time</th>
                <th className="px-4 py-3 small text-muted text-uppercase text-end">Identity</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-5 text-muted"><i className="fas fa-spinner fa-spin me-2"></i> Initializing Audit Logs...</td></tr>
              ) : ledger.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-5 text-muted">No financial records currently exist in the ledger.</td></tr>
              ) : (
                ledger.map((t) => (
                  <tr key={t.id} className="transition-all hover-bg-light">
                    <td className="px-4">
                       <span className={`badge px-3 py-2 rounded-pill font-monospace ${t.type.includes('commission') ? 'bg-success-subtle text-success border border-success' : 'bg-primary-subtle text-primary border border-primary'}`}>
                          {t.type.toUpperCase()}
                       </span>
                    </td>
                    <td><p className="mb-0 small fw-medium">{t.description}</p></td>
                    <td><strong className={t.type === 'withdrawal' ? 'text-danger' : 'text-success'}>${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></td>
                    <td className="small text-muted">{t.timestamp?.seconds ? new Date(t.timestamp.seconds * 1000).toLocaleString() : 'Processing...'}</td>
                    <td className="px-4 text-end text-muted font-monospace small">ID: {t.userId.substring(0, 10)}...</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 p-4 text-center rounded-4 border-dashed border border-2 border-primary bg-light bg-opacity-50">
         <p className="small mb-0 text-muted fst-italic">This ledger is a secure, institutional record. Every transaction is cryptographically linked to a specific user and event within the Seas Logistics system.</p>
      </div>
    </div>
  );
}
