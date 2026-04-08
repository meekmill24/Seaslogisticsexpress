'use client';

import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/admin/dashboard');
    } catch (err) {
      console.error(err);
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-card backdrop-blur-3xl shadow-3xl">
        <div className="text-center mb-5">
          <img src="/2.jpeg" alt="Logo" width="80" height="80" className="mb-4 rounded-circle shadow-xl border border-white border-opacity-20" />
          <h2 className="fw-bold text-white display-6 tracking-tighter">Elite Command Portal</h2>
          <p className="text-white-50 small uppercase tracking-widest">Enter Credentials for Strategic Access</p>
        </div>

        {error && (
          <div className="alert alert-danger bg-danger bg-opacity-20 border-danger border-opacity-30 text-danger py-3 small mb-5 rounded-4 text-center">
            <i className="fas fa-exclamation-triangle me-2"></i> {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="x-small text-white-50 uppercase tracking-widest mb-2 fw-bold d-block">Executive Node</label>
            <div className="input-group overflow-hidden rounded-4 border border-white border-opacity-10">
              <span className="input-group-text bg-black bg-opacity-40 border-0 text-white-50 px-4"><i className="fas fa-microchip"></i></span>
              <input
                type="email"
                className="form-control bg-black bg-opacity-20 border-0 text-white p-4"
                placeholder="admin@seas.express"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-10">
            <label className="x-small text-white-50 uppercase tracking-widest mb-2 fw-bold d-block">Security Key</label>
            <div className="input-group overflow-hidden rounded-4 border border-white border-opacity-10">
              <span className="input-group-text bg-black bg-opacity-40 border-0 text-white-50 px-4"><i className="fas fa-fingerprint"></i></span>
              <input
                type="password"
                className="form-control bg-black bg-opacity-20 border-0 text-white p-4"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-4 rounded-pill fw-bold shadow-3xl transition-all hover-lift uppercase tracking-widest border-0"
            disabled={loading}
            style={{
              background: 'linear-gradient(45deg, #3b82f6, #1d4ed8)',
            }}
          >
            {loading ? (
              <><i className="fas fa-circle-notch fa-spin me-3"></i> Authenticating...</>
            ) : (
              <><i className="fas fa-shield-alt me-3"></i> Initialize Access</>
            )}
          </button>
        </form>

        <div className="mt-8 pt-5 border-top border-white border-opacity-5 text-center">
          <a href="/" className="text-decoration-none x-small text-white-50 hover-text-white transition-all uppercase tracking-widest fw-bold">
            <i className="fas fa-arrow-left me-2"></i> Return to Global Hub
          </a>
        </div>
      </div>

      <style jsx>{`
        .admin-login-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #020617 url('/slide_warehouse_1775207348110.jpg') no-repeat center center fixed;
          background-size: cover;
          padding: 20px;
          position: relative;
        }
        .admin-login-wrapper::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(15, 23, 42, 0.8), rgba(2, 6, 23, 0.95));
          z-index: 1;
        }
        .admin-login-card {
          width: 100%;
          max-width: 480px;
          background: rgba(15, 23, 42, 0.4);
          padding: 60px;
          border-radius: 40px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          z-index: 2;
          position: relative;
        }
      `}</style>
    </div>
  );
}
