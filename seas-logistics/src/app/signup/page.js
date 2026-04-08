'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UserSignup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(false);
    try {
       const { createUserNode } = await import('@/lib/firestore');
       await createUserNode({ email, name, password });
       router.push('/login?registered=true');
    } catch (err) {
       console.error(err);
       alert('Failed to deploy node. Check connectivity.');
    } finally {
       setLoading(false);
    }
  };

  return (
    <div className="auth-full-wrapper">
       <video autoPlay muted loop className="auth-bg-video">
          <source src="/hero_ship.png" type="image/png" />
       </video>
       <div className="auth-overlay-cinematic"></div>

       <div className="container position-relative z-index-10 d-flex align-items-center justify-content-center min-vh-100">
          <div className="auth-glass-card reveal-zoom shadow-2xl p-5 p-lg-10">
             <div className="text-center mb-8">
                <a href="/"><img src="/2.jpeg" alt="Logo" className="rounded-circle shadow-lg mb-4 animate-pulse" style={{width:'90px', height:'90px', border:'2px solid rgba(255,255,255,0.1)'}} /></a>
                <h2 className="display-6 fw-bold text-white tracking-tighter mb-2">ELITE REGISTRY</h2>
                <p className="text-white-50 uppercase tracking-widest small">Deploy New Command Node Access</p>
             </div>

             <form onSubmit={handleSignup} className="auth-form mx-auto w-100" style={{maxWidth:'400px'}}>
                <div className="mb-4">
                   <label className="x-small text-white-50 uppercase tracking-widest mb-2 fw-bold">Institutional Entity Name</label>
                   <div className="input-group-modern">
                      <i className="fas fa-building icon"></i>
                      <input type="text" required className="form-control-elite" placeholder="Logistics Global Hub" value={name} onChange={(e)=>setName(e.target.value)} />
                   </div>
                </div>
                <div className="mb-4">
                   <label className="x-small text-white-50 uppercase tracking-widest mb-2 fw-bold">Admin Dispatch Email</label>
                   <div className="input-group-modern">
                      <i className="fas fa-envelope icon"></i>
                      <input type="email" required className="form-control-elite" placeholder="admin@node.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
                   </div>
                </div>
                <div className="mb-6">
                   <label className="x-small text-white-50 uppercase tracking-widest mb-2 fw-bold">Safe-Hash Password</label>
                   <div className="input-group-modern">
                      <i className="fas fa-lock icon"></i>
                      <input type="password" required className="form-control-elite" placeholder="••••••••" value={password} onChange={(e)=>setPassword(e.target.value)} />
                   </div>
                </div>
                
                <button type="submit" className="btn btn-primary-elite w-100 py-3 rounded-pill fw-bold shadow-2xl mb-5 transition-all hover-lift" disabled={loading}>
                   {loading ? <><span className="spinner-border spinner-border-sm me-2"></span> DEPLOYING NODE...</> : 'DEPLOY REGISTERED NODE'}
                </button>

                <div className="divider-lite mb-5"><span>OR</span></div>

                <div className="d-flex flex-column gap-3">
                   <button type="button" className="btn btn-outline-light w-100 py-3 rounded-pill fw-bold opacity-50 x-small transition-all hover-white" onClick={() => router.push('/login')}>
                      RETURN TO COMMAND LOGIN <i className="fas fa-chevron-right ms-2"></i>
                   </button>
                </div>
             </form>
          </div>
       </div>

       <style jsx>{`
          .auth-full-wrapper { position: relative; min-height: 100vh; background: #050a14; overflow: hidden; }
          .auth-bg-video { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.3; }
          .auth-overlay-cinematic { position: absolute; inset: 0; background: radial-gradient(circle at center, transparent 0%, #050a14 100%); z-index: 1; }
          .auth-glass-card { background: rgba(255,255,255,0.03); backdrop-filter: blur(25px); border: 1px solid rgba(255,255,255,0.08); border-radius: 40px; width: 100%; max-width: 550px; z-index: 10; }
          .input-group-modern { position: relative; }
          .input-group-modern .icon { position: absolute; left: 20px; top: 50%; transform: translateY(-50%); color: #3b82f6; opacity: 0.5; font-size: 0.9rem; }
          .form-control-elite { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 18px 20px 18px 50px; color: white; width: 100%; transition: all 0.3s; }
          .form-control-elite:focus { background: rgba(0,0,0,0.5); border-color: #3b82f6; outline: none; box-shadow: 0 0 20px rgba(59, 130, 246, 0.1); }
          .btn-primary-elite { background: linear-gradient(45deg, #3b82f6, #1d4ed8); border: 0; color: white; }
          .divider-lite { position: relative; text-align: center; color: rgba(255,255,255,0.1); font-size: 0.7rem; font-weight: 800; letter-spacing: 2px; }
          .divider-lite::before, .divider-lite::after { content: ''; position: absolute; top: 50%; width: 40%; height: 1px; background: rgba(255,255,255,0.05); }
          .divider-lite::before { left: 0; }
          .divider-lite::after { right: 0; }
       `}</style>
    </div>
  );
}
