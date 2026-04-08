'use client';

import React, { useEffect, useState } from 'react';
import { getAllShipments, createShipment, updateShipment, deleteShipment, uploadShipmentDocument } from '@/lib/firestore';

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  const [newShipment, setNewShipment] = useState({
    trackingNumber: '',
    customerName: '',
    origin: '',
    destination: '',
    weight: ''
  });

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const data = await getAllShipments();
      setShipments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (shipmentId, file) => {
    if (!file) return;
    setUploadingId(shipmentId);
    try {
      await uploadShipmentDocument(shipmentId, file);
      alert('Document uploaded successfully!');
      fetchShipments();
    } catch (err) {
      console.error(err);
      alert('Error uploading document.');
    } finally {
      setUploadingId(null);
    }
  };

  const handleAddShipment = async (e) => {
    e.preventDefault();
    try {
      await createShipment({
        ...newShipment,
        trackingNumber: newShipment.trackingNumber || 'SLE-' + Math.floor(100000000 + Math.random() * 900000000)
      });
      setIsAdding(false);
      setNewShipment({ trackingNumber: '', customerName: '', origin: '', destination: '', weight: '' });
      fetchShipments();
      alert('Shipment created successfully!');
    } catch (err) {
      console.error(err);
      alert('Error creating shipment.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this shipment?')) {
      try {
        await deleteShipment(id);
        fetchShipments();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const updateStatus = async (id, currentSteps, currentStatus) => {
    const statuses = ['Order Placed', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'];
    const currentIndex = statuses.indexOf(currentStatus);
    const nextStatus = statuses[currentIndex + 1];

    if (!nextStatus) {
      alert('Shipment is already delivered!');
      return;
    }

    const updatedSteps = currentSteps.map(step => {
      if (step.label === nextStatus) {
        return { ...step, done: true, time: new Date().toLocaleString() };
      }
      return step;
    });

    try {
      await updateShipment(id, { status: nextStatus, steps: updatedSteps });
      fetchShipments();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Shipment Management</h4>
          <p className="text-muted small mb-0">Create and monitor all active shipments.</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2 shadow-sm" onClick={() => setIsAdding(true)}>
          <i className="fas fa-plus"></i> New Shipment
        </button>
      </div>

      {isAdding && (
        <div className="card shadow-sm border-0 mb-4 p-4">
          <div className="d-flex justify-content-between mb-3">
             <h6 className="fw-bold mb-0">Create New Shipment</h6>
             <button className="btn-close" onClick={() => setIsAdding(false)}></button>
          </div>
          <form className="row g-3" onSubmit={handleAddShipment}>
            <div className="col-md-3">
              <label className="form-label small fw-bold">Tracking Number (Auto if empty)</label>
              <input type="text" className="form-control" value={newShipment.trackingNumber} onChange={e => setNewShipment({...newShipment, trackingNumber: e.target.value.toUpperCase()})} placeholder="SLE-123456" />
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-bold">Customer Name</label>
              <input type="text" className="form-control" value={newShipment.customerName} onChange={e => setNewShipment({...newShipment, customerName: e.target.value})} required />
            </div>
            <div className="col-md-2">
              <label className="form-label small fw-bold">Origin</label>
              <input type="text" className="form-control" value={newShipment.origin} onChange={e => setNewShipment({...newShipment, origin: e.target.value})} required />
            </div>
            <div className="col-md-2">
              <label className="form-label small fw-bold">Destination</label>
              <input type="text" className="form-control" value={newShipment.destination} onChange={e => setNewShipment({...newShipment, destination: e.target.value})} required />
            </div>
            <div className="col-md-2">
              <label className="form-label small fw-bold">Weight (kg)</label>
              <input type="text" className="form-control" value={newShipment.weight} onChange={e => setNewShipment({...newShipment, weight: e.target.value})} />
            </div>
            <div className="col-12 mt-3">
              <button type="submit" className="btn btn-dark px-4 shadow-sm">Create Shipment</button>
              <button type="button" className="btn btn-light ms-2 shadow-sm border" onClick={() => setIsAdding(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card shadow-sm border-0 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead className="bg-light">
              <tr>
                <th className="border-0 px-4 py-3 small text-uppercase text-muted">Tracking #</th>
                <th className="border-0 py-3 small text-uppercase text-muted">Customer</th>
                <th className="border-0 py-3 small text-uppercase text-muted">Status</th>
                <th className="border-0 py-3 small text-uppercase text-muted">Documents</th>
                <th className="border-0 px-4 py-3 small text-uppercase text-muted text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-5"><i className="fas fa-spinner fa-spin me-2"></i> Loading Data...</td></tr>
              ) : shipments.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-5">No shipments found.</td></tr>
              ) : (
                shipments.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4">
                        <div className="fw-bold text-primary">{s.trackingNumber}</div>
                        <div className="x-small text-muted">{s.origin} <i className="fas fa-arrow-right mx-1"></i> {s.destination}</div>
                    </td>
                    <td>{s.customerName}</td>
                    <td>
                      <span className={`badge p-2 rounded-pill ${s.status === 'Delivered' ? 'bg-success' : 'bg-info'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td>
                       {s.documentUrl ? (
                         <div className="d-flex align-items-center gap-2">
                            <a href={s.documentUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-dark px-2 py-1">
                               <i className="fas fa-file-pdf me-1"></i> Waybill
                            </a>
                            <label className="btn btn-sm btn-link text-muted p-0 m-0 x-small text-decoration-none" style={{cursor: 'pointer'}}>
                               Replace
                               <input type="file" className="d-none" onChange={(e) => handleFileUpload(s.id, e.target.files[0])} />
                            </label>
                         </div>
                       ) : (
                         <div className="position-relative">
                           {uploadingId === s.id ? (
                             <span className="small text-muted"><i className="fas fa-spinner fa-spin me-1"></i> Uploading...</span>
                           ) : (
                             <label className="btn btn-sm btn-outline-secondary px-2 py-1" style={{cursor: 'pointer'}}>
                               <i className="fas fa-upload me-1"></i> Add Waybill
                               <input type="file" className="d-none" onChange={(e) => handleFileUpload(s.id, e.target.files[0])} />
                             </label>
                           )}
                         </div>
                       )}
                    </td>
                    <td className="px-4 text-end d-flex gap-2 justify-content-end">
                      {s.status !== 'Delivered' && (
                        <button className="btn btn-sm btn-outline-info" title="Next Status" onClick={() => updateStatus(s.id, s.steps, s.status)}>
                            <i className="fas fa-step-forward"></i>
                        </button>
                      )}
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(s.id)}>
                        <i className="fas fa-trash"></i>
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
