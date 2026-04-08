'use client';

import React, { useEffect, useState } from 'react';
import { getQuotes, updateQuoteStatus } from '@/lib/firestore';

export default function QuotesPage() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const data = await getQuotes();
      setQuotes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateQuoteStatus(id, status);
      fetchQuotes();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container-fluid">
       <div className="mb-4">
        <h4 className="fw-bold mb-1">Quote Inquiries</h4>
        <p className="text-muted small">Manage and respond to shipping quote requests.</p>
      </div>

       <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table hover mb-0 align-middle">
            <thead className="bg-light">
              <tr>
                <th className="border-0 px-4 py-3 small text-uppercase text-muted">From & To</th>
                <th className="border-0 py-3 small text-uppercase text-muted">Dimensions & Weight</th>
                <th className="border-0 py-3 small text-uppercase text-muted">Date Received</th>
                <th className="border-0 py-3 small text-uppercase text-muted">Status</th>
                <th className="border-0 px-4 py-3 small text-uppercase text-muted text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-5">Loading Inquiries...</td></tr>
              ) : quotes.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-5">No quote requests yet.</td></tr>
              ) : (
                quotes.map((q) => (
                  <tr key={q.id}>
                    <td className="px-4 py-3">
                      <div className="fw-bold text-dark">{q.from}</div>
                      <i className="fas fa-arrow-down text-muted small mx-2"></i>
                      <div className="fw-bold text-dark">{q.to}</div>
                    </td>
                    <td className="small">
                      <div>Weight: {q.weight}kg</div>
                      <div>Size: {q.length}x{q.width}x{q.height} cm</div>
                    </td>
                    <td className="small text-muted">
                        {q.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                    </td>
                    <td>
                       <select 
                         className={`form-select form-select-sm w-auto rounded-pill px-3 fw-bold ${q.status === 'pending' ? 'bg-warning-subtle text-warning-emphasis' : 'bg-success-subtle text-success-emphasis'}`} 
                         value={q.status} 
                         onChange={(e) => handleStatusChange(q.id, e.target.value)}
                       >
                         <option value="pending">Pending Review</option>
                         <option value="completed">Quoted / Completed</option>
                       </select>
                    </td>
                    <td className="px-4 text-end">
                       <button className="btn btn-sm btn-outline-primary" title="View Details">
                         <i className="fas fa-eye"></i>
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
