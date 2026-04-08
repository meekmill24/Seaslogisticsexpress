'use client';

import React, { useEffect, useState } from 'react';
import { getContacts, markContactRead } from '@/lib/firestore';

export default function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const data = await getContacts();
      setMessages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRead = async (id) => {
    try {
      await markContactRead(id);
      fetchMessages();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container-fluid">
       <div className="mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h4 className="fw-bold mb-1">Contact Messages</h4>
          <p className="text-muted small">Read and respond to inquiries from customers.</p>
        </div>
        <span className="badge bg-danger rounded-pill px-3 py-2 fs-6 shadow-sm">
          {messages.filter(m => !m.read).length} Unread
        </span>
      </div>

       <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead className="bg-light">
              <tr>
                <th className="border-0 px-4 py-3 small text-uppercase text-muted">Sender</th>
                <th className="border-0 py-3 small text-uppercase text-muted">Subject</th>
                <th className="border-0 py-3 small text-uppercase text-muted">Message</th>
                <th className="border-0 py-3 small text-uppercase text-muted">Date</th>
                <th className="border-0 px-4 py-3 small text-uppercase text-muted text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-5">Loading Messages...</td></tr>
              ) : messages.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-5">Your inbox is empty.</td></tr>
              ) : (
                messages.map((m) => (
                  <tr key={m.id} className={!m.read ? 'bg-primary bg-opacity-10 fw-bold' : ''}>
                    <td className="px-4 py-3">
                       <div className="d-flex align-items-center gap-2">
                         <div className="avatar bg-primary text-white rounded-circle p-2 text-center" style={{width: '32px', height: '32px', fontSize: '11px'}}>{m.fullName[0]}</div>
                         <div>
                            <div>{m.fullName}</div>
                            <div className="text-muted small fw-normal">{m.email}</div>
                         </div>
                       </div>
                    </td>
                    <td>{m.subject}</td>
                    <td className="text-muted small" style={{maxWidth: '300px', cursor: 'pointer'}} onClick={() => alert(m.message)}>
                       <span className="text-truncate d-block">{m.message}</span>
                    </td>
                    <td className="small text-muted">{m.createdAt?.toDate()?.toLocaleDateString() || 'N/A'}</td>
                    <td className="px-4 text-end">
                       {!m.read ? (
                          <button onClick={() => handleRead(m.id)} className="btn btn-sm btn-outline-success">Mark Read</button>
                       ) : (
                          <span className="text-muted small"><i className="fas fa-check-double text-success"></i> Read</span>
                       )}
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
