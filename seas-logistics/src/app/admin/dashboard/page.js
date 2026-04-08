'use client';

import React, { useEffect, useState } from 'react';
import { getAllShipments, getQuotes, getContacts } from '@/lib/firestore';
import Link from 'next/link';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    activeShipments: 0,
    newQuotes: 0,
    unreadMessages: 0,
    totalDeliveries: 0,
  });
  const [chartData, setChartData] = useState({
    shippingVolume: { labels: [], datasets: [] },
    revenuePipeline: { labels: [], datasets: [] },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [shipments, quotes, messages] = await Promise.all([
          getAllShipments(),
          getQuotes(),
          getContacts()
        ]);

        // ─── Stats ───────────────────────────────────────────
        setStats({
          activeShipments: shipments.filter(s => s.status !== 'Delivered').length,
          newQuotes: quotes.filter(q => q.status === 'pending').length,
          unreadMessages: messages.filter(m => !m.read).length,
          totalDeliveries: shipments.filter(s => s.status === 'Delivered').length
        });

        // ─── Chart Data Processing ───────────────────────────
        const last7Days = [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        const volumeData = last7Days.map(day => {
            return shipments.filter(s => {
                const sDate = s.createdAt?.seconds ? new Date(s.createdAt.seconds * 1000) : new Date(s.createdAt);
                return sDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) === day;
            }).length;
        });

        const revenueData = last7Days.map(day => {
            return quotes.reduce((acc, q) => {
                const qDate = q.createdAt?.seconds ? new Date(q.createdAt.seconds * 1000) : new Date(q.createdAt);
                const qDay = qDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                if (qDay === day) {
                    return acc + (parseFloat(q.estimatedPrice) || 0);
                }
                return acc;
            }, 0);
        });

        setChartData({
          shippingVolume: {
            labels: last7Days,
            datasets: [{
              label: 'Daily Shipments',
              data: volumeData,
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: true,
              tension: 0.4,
              borderWidth: 3,
              pointRadius: 4,
            }]
          },
          revenuePipeline: {
            labels: last7Days,
            datasets: [{
              label: 'Quote Revenue ($)',
              data: revenueData,
              backgroundColor: '#10b981',
              borderRadius: 6,
            }]
          }
        });

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const cards = [
    { label: 'Active Shipments', value: stats.activeShipments, icon: 'fas fa-truck', color: 'primary', link: '/admin/shipments' },
    { label: 'Pending Quotes', value: stats.newQuotes, icon: 'fas fa-file-invoice-dollar', color: 'warning', link: '/admin/quotes' },
    { label: 'Unread Messages', value: stats.unreadMessages, icon: 'fas fa-envelope-open-text', color: 'danger', link: '/admin/messages' },
    { label: 'Total Deliveries', value: stats.totalDeliveries, icon: 'fas fa-check-circle', color: 'success', link: '/admin/shipments' },
  ];

  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true, grid: { display: false } },
      x: { grid: { display: false } }
    }
  };

  return (
    <div className="container-fluid">
       <div className="mb-4">
        <h4 className="fw-bold mb-1">Command Center Dashboard</h4>
        <p className="text-muted small">Real-time logistics analytics and revenue forecasting.</p>
      </div>

       <div className="row g-4">
          {cards.map((card, idx) => (
            <div className="col-sm-6 col-xl-3" key={idx}>
              <Link href={card.link} className="text-decoration-none">
                <div className="card shadow-sm border-0 transition-hover h-100">
                   <div className="card-body p-4">
                     <div className="d-flex justify-content-between align-items-center">
                        <div>
                           <p className="text-muted small mb-1 fw-bold text-uppercase">{card.label}</p>
                           <h2 className="mb-0 fw-bold">{loading ? '...' : card.value}</h2>
                        </div>
                        <div className={`icon-box bg-${card.color}-subtle text-${card.color} rounded-circle p-3`}>
                           <i className={`${card.icon} fs-4`}></i>
                        </div>
                     </div>
                   </div>
                </div>
              </Link>
            </div>
          ))}
       </div>

       <div className="mt-5 row g-4">
          <div className="col-lg-8">
             <div className="card shadow-sm border-0 p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                   <h6 className="fw-bold mb-0">Shipping Volume (7 Days)</h6>
                   <span className="badge bg-primary-subtle text-primary">Live Data</span>
                </div>
                <div style={{ height: '300px' }}>
                   {loading ? (
                     <div className="h-100 d-flex align-items-center justify-content-center text-muted">Loading Charts...</div>
                   ) : (
                     <Line data={chartData.shippingVolume} options={commonChartOptions} />
                   )}
                </div>
             </div>
          </div>
          <div className="col-lg-4">
             <div className="card shadow-sm border-0 p-4 h-100">
                <h6 className="fw-bold mb-4">Revenue Pipeline ($)</h6>
                <div style={{ height: '300px' }}>
                   {loading ? (
                     <div className="h-100 d-flex align-items-center justify-content-center text-muted">Loading...</div>
                   ) : (
                     <Bar data={chartData.revenuePipeline} options={commonChartOptions} />
                   )}
                </div>
                <div className="mt-3 text-center">
                   <p className="text-muted small mb-0">Estimated value of recent quote requests.</p>
                </div>
             </div>
          </div>
       </div>

       <div className="mt-4 row g-4">
           <div className="col-lg-12">
               <div className="card shadow-sm border-0 p-4">
                 <h6 className="fw-bold mb-3">System Quick Actions</h6>
                 <div className="row g-2">
                    <div className="col-md-4">
                       <Link href="/admin/shipments" className="btn btn-outline-primary w-100 text-start px-3 py-2">
                          <i className="fas fa-plus-circle me-2"></i> New Shipment
                       </Link>
                    </div>
                    <div className="col-md-4">
                       <Link href="/admin/quotes" className="btn btn-outline-dark w-100 text-start px-3 py-2">
                          <i className="fas fa-eye me-2"></i> View Quotes
                       </Link>
                    </div>
                    <div className="col-md-4">
                       <Link href="/admin/messages" className="btn btn-outline-dark w-100 text-start px-3 py-2">
                           <i className="fas fa-envelope me-2"></i> Message Inbox
                       </Link>
                    </div>
                 </div>
               </div>
           </div>
       </div>

       <style jsx>{`
          .transition-hover {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          .transition-hover:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.1) !important;
          }
          .icon-box {
            width: 56px;
            height: 56px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
       `}</style>
    </div>
  );
}
