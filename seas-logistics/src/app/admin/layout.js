'use client';

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        if (pathname === '/admin/login') {
          router.push('/admin/dashboard');
        }
      } else {
        if (pathname !== '/admin/login') {
          router.push('/admin/login');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, pathname]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/admin/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // If we are on the login page, just render the child (which is the login form)
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Double check user exists before rendering the dashboard shells
  if (!user) {
    return null;
  }

  // Links for the sidebar
  const menuItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: 'fas fa-th-large' },
    { label: 'Shipments', path: '/admin/shipments', icon: 'fas fa-shipping-fast' },
    { label: 'Quotes', path: '/admin/quotes', icon: 'fas fa-file-invoice-dollar' },
    { label: 'Rates', path: '/admin/rates', icon: 'fas fa-hand-holding-usd' },
    { label: 'Messages', path: '/admin/messages', icon: 'fas fa-envelope' },
  ];

  return (
    <div className="admin-layout d-flex">
      {/* Sidebar */}
      <aside className="admin-sidebar text-white shadow-lg">
        <div className="sidebar-header p-4 d-flex align-items-center gap-3">
          <img src="/2.jpeg" alt="Logo" width="40" height="40" className="rounded-circle" />
          <h5 className="mb-0 fw-bold">Admin Panel</h5>
        </div>

        <nav className="sidebar-nav mt-4 flex-grow-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`nav-link-item ${pathname === item.path ? 'active' : ''}`}
            >
              <i className={`${item.icon} nav-icon`}></i>
              <span className="nav-text">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer p-3 border-top border-white border-opacity-10">
          <div className="user-profile mb-3 px-2">
            <div className="small text-muted mb-1 fw-bold text-uppercase" style={{fontSize: '0.65rem'}}>Logged in as</div>
            <div className="d-flex align-items-center gap-2">
                <i className="fas fa-circle text-success" style={{fontSize: '0.5rem'}}></i>
                <span className="user-email text-truncate" style={{fontSize: '0.85rem'}}>{user?.email || 'Admin'}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="btn logout-btn w-100 py-2">
            <i className="fas fa-sign-out-alt me-2"></i> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main flex-grow-1 bg-light">
        <header className="admin-header bg-white shadow-sm d-flex align-items-center justify-content-between p-3 px-4 sticky-top">
          <h6 className="mb-0 fw-bold text-muted">
            {menuItems.find(i => i.path === pathname)?.label || 'Admin Portal'}
          </h6>
          <div className="admin-header-right d-flex align-items-center gap-3">
             <span className="badge bg-success-subtle text-success p-2 small">Live System Connected</span>
          </div>
        </header>

        <div className="admin-content p-4">
          {children}
        </div>
      </main>

      <style jsx global>{`
        .admin-layout {
          min-height: 100vh;
        }
        .admin-sidebar {
          width: 280px;
          background: #0f172a !important;
          display: flex;
          flex-direction: column;
          z-index: 1001;
          color: white;
          min-height: 100vh;
        }
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          background: transparent;
        }
        .nav-link-item {
          display: flex !important;
          align-items: center !important;
          padding: 14px 24px !important;
          text-decoration: none !important;
          color: rgba(255, 255, 255, 0.6) !important;
          transition: all 0.25s ease;
          border-left: 4px solid transparent;
        }
        .nav-link-item:hover {
          color: #ffffff !important;
          background: rgba(255, 255, 255, 0.05) !important;
        }
        .nav-link-item.active {
          color: #ffffff !important;
          background: rgba(255, 255, 255, 0.1) !important;
          border-left-color: #3b82f6 !important;
        }
        .nav-icon {
          font-size: 1.1rem !important;
          width: 28px !important;
          margin-right: 12px !important;
          color: inherit !important;
        }
        .nav-text {
          font-weight: 500 !important;
          font-size: 1rem !important;
          color: inherit !important;
        }
        .logout-btn {
          background: rgba(239, 68, 68, 0.1) !important;
          color: #ef4444 !important;
          border: 1px solid rgba(239, 68, 68, 0.2) !important;
          font-weight: 600 !important;
          font-size: 0.95rem !important;
          transition: all 0.2s ease;
        }
        .logout-btn:hover {
          background: #ef4444 !important;
          color: white !important;
        }
        .admin-main {
          min-width: 0;
        }
        @media (max-width: 991.98px) {
          .admin-sidebar {
             width: 80px;
          }
          .admin-sidebar span, .sidebar-header h5 {
             display: none;
          }
           .nav-link-item {
             justify-content: center;
             padding: 15px 0;
           }
        }
      `}</style>
    </div>
  );
}
