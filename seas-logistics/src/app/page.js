"use client";
import { useState, useEffect, useRef, useContext } from 'react';
import { GlobalizationContext } from '@/context/GlobalizationContext';
import { saveQuote, logTransaction, getRateSettings, getShipmentByTracking, getQuotes, getQuotesByUser, getShipmentsByUser, getTransactionsByUser, getSupportTicketsByUser, getUserNode } from '@/lib/firestore';

export default function Home() {
  const { t, language, setLanguage, currency, setCurrency, languages, currencies } = useContext(GlobalizationContext);
  const [navScrolled, setNavScrolled] = useState(false);
  const [scrolled, setScrolled] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [dashboardTab, setDashboardTab] = useState('trace'); // 'trace', 'bookings', 'settlements', 'support'
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authHubMode, setAuthHubMode] = useState('login'); // 'login' or 'signup'
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [searchHash, setSearchHash] = useState('');
  const [tracedShipment, setTracedShipment] = useState(null);
  const [userBookings, setUserBookings] = useState([]);
  const [userShipments, setUserShipments] = useState([]);
  const [userTransactions, setUserTransactions] = useState([]);
  const [userTickets, setUserTickets] = useState([]);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [currentUserNode, setCurrentUserNode] = useState(null);
  const [currentUserNodeName, setCurrentUserNodeName] = useState('Institutional User');

  const [settledAuditTotal, setSettledAuditTotal] = useState(0);
  const [dispatchAlertCount, setDispatchAlertCount] = useState(0);
  const [theme, setTheme] = useState('dark'); // 'dark' or 'light'
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleAuthAction = async () => {
    setIsAuthLoading(true);
    // Simulated Institutional Auth (Captures session locally)
    setTimeout(async () => {
       setIsAuthorized(true);
       setIsAuthLoading(false);
       await fetchUserHistory(authEmail);
    }, 1200);
  };

  const handleGlobalTrace = async (hash) => {
    const targetHash = hash || searchHash;
    if(!targetHash) return alert('Enter a valid Shipment Hash.');
    const data = await getShipmentByTracking(targetHash);
    if(data) {
       setTracedShipment(data);
       setDashboardTab('trace');
       // Scroll to the trace result if needed
    } else {
       alert('Dispatch Node not found in global registry.');
    }
  };

  const viewShipmentDetails = async (trackingNum) => {
    setSearchHash(trackingNum);
    await handleGlobalTrace(trackingNum);
  };

  const fetchUserHistory = async (email) => {
    if(!email) return;
    const quotes = await getQuotesByUser(email);
    const shipments = await getShipmentsByUser(email);
    const txs = await getTransactionsByUser(email);
    const tickets = await getSupportTicketsByUser(email);
    const profile = await getUserNode(email);
    
    setUserBookings(quotes);
    setUserShipments(shipments);
    setUserTransactions(txs);
    setUserTickets(tickets);
    setCurrentUserNode(email);
    if(profile?.name) setCurrentUserNodeName(profile.name);

    // Calculate Settlement Hub
    const total = quotes.reduce((sum, q) => sum + (parseFloat(q.totalAmount) || 0), 0);
    setSettledAuditTotal(total);

    // Calculate Dispatch Alerts
    const alerts = shipments.filter(s => s.status?.toLowerCase().includes('critical') || s.status?.toLowerCase().includes('delay')).length;
    setDispatchAlertCount(alerts);
  };
  const [selectedTier, setSelectedTier] = useState(null);
  const [quoteEstimate, setQuoteEstimate] = useState(null);
  const [showBackTop, setShowBackTop] = useState(false);
  const [rateSettings, setRateSettings] = useState(null);
  
  const fromAutofillRef = useRef(null);
  const toAutofillRef = useRef(null);
  const [fromIsManual, setFromIsManual] = useState(false);
  const [toIsManual, setToIsManual] = useState(false);
  const [fromAddressDetail, setFromAddressDetail] = useState(null);
  const [toAddressDetail, setToAddressDetail] = useState(null);
  const [serviceDetail, setServiceDetail] = useState(null);

  useEffect(() => {
    document.documentElement.lang = language;
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const percent = (winScroll / height) * 100;
      setScrolled(percent);
      setNavScrolled(winScroll > 50);
      setShowBackTop(winScroll > 300);
    };
    window.addEventListener('scroll', handleScroll);
    setTimeout(() => setLoading(false), 1500);

    const loadRates = async () => {
      const data = await getRateSettings();
      setRateSettings(data);
    };
    loadRates();

    // AUTO-OPEN PORTAL IF REDIRECTED FROM LOGIN
    const urlParams = new URLSearchParams(window.location.search);
    const userEmail = urlParams.get('user');
    if(urlParams.get('portal') === 'open') {
       setIsDashboardOpen(true);
       setIsAuthorized(true);
       fetchUserHistory(userEmail);
       // Clean up URL to prevent repeat pops
       window.history.replaceState({}, document.title, "/");
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, [language]);

  // RESTORED: INTERSECTION OBSERVER FOR REVEAL & STATS
  useEffect(() => {
    if (loading) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (entry.target.classList.contains('reveal')) {
            entry.target.classList.add('reveal-visible');
          }
          if (entry.target.classList.contains('stat-count')) {
            const target = parseInt(entry.target.getAttribute('data-target') || '0');
            const suffix = entry.target.getAttribute('data-suffix') || '';
            let count = 0;
            const inc = target / 100;
            const timer = setInterval(() => {
              count += inc;
              if (count >= target) {
                entry.target.innerText = target.toLocaleString() + suffix;
                clearInterval(timer);
              } else {
                entry.target.innerText = Math.floor(count).toLocaleString() + suffix;
              }
            }, 20);
          }
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal, .stat-count').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [loading]);

  const dynamicTextRef = useRef(null);
  useEffect(() => {
    if (loading) return;
    const words = t.typingWords || [];
    if (words.length === 0) return;
    let wordIdx = 0, charIdx = 0, deleting = false;
    const type = () => {
      if (!dynamicTextRef.current) return;
      const current = words[wordIdx] || "";
      dynamicTextRef.current.innerText = current.substring(0, charIdx);
      if (!deleting && charIdx < current.length) { charIdx++; setTimeout(type, 100); }
      else if (deleting && charIdx > 0) { charIdx--; setTimeout(type, 50); }
      else {
        deleting = !deleting;
        if (!deleting) wordIdx = (wordIdx + 1) % words.length;
        setTimeout(type, 1500);
      }
    };
    type();
  }, [loading, t]);

  const calculateLiveQuote = () => {
    const weightVal = parseFloat(document.getElementById('weight')?.value) || 0;
    const lengthVal = parseFloat(document.getElementById('length')?.value) || 0;
    const widthVal = parseFloat(document.getElementById('width')?.value) || 0;
    const heightVal = parseFloat(document.getElementById('height')?.value) || 0;

    const basePickupFee = 15;
    const pricePerKg = 4.5;
    const minCharge = 25;
    const handlingFee = 12.50;
    const fuelSurcharge = 8.5;

    const volumetricWeight = (lengthVal * widthVal * heightVal) / 5000;
    const billableWeight = Math.max(weightVal, volumetricWeight);

    const baseSubtotal = basePickupFee + (billableWeight * pricePerKg);
    const withFuel = baseSubtotal * (1 + (fuelSurcharge / 100));
    const rate = (rateSettings?.exchangeRates?.[currency.code] || 1);
    const baseTotal = (withFuel + handlingFee) * rate;
    const tiers = {
      air: { label: t.byAir, icon: 'fas fa-plane', price: Math.max(minCharge * rate, baseTotal * 1.5).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), date: getArrivalDate(3), description: 'Fastest Priority Delivery' },
      land: { label: t.byLand, icon: 'fas fa-truck', price: Math.max(minCharge * rate, baseTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), date: getArrivalDate(7), description: 'Standard Freight' },
      sea: { label: t.bySea, icon: 'fas fa-ship', price: Math.max(minCharge * rate, baseTotal * 0.6).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), date: getArrivalDate(25), description: 'Bulk & Economical' }
    };
    const box = document.querySelector('.box-3d');
    const resultText = document.getElementById('volRes');
    if (box && resultText) {
       const scaleL = Math.max(0.1, lengthVal / 80); const scaleW = Math.max(0.1, widthVal / 80); const scaleH = Math.max(0.1, heightVal / 80);
       box.style.transform = `rotateX(-20deg) rotateY(45deg) scale3d(${scaleL}, ${scaleH}, ${scaleW})`;
       const volumeM3 = (lengthVal * widthVal * heightVal) / 1000000;
       resultText.innerText = volumeM3.toFixed( volumeM3 < 0.01 ? 4 : 2 );
    }
    setQuoteEstimate(tiers);
  };

  const getArrivalDate = (days) => {
    const d = new Date(); d.setDate(d.getDate() + days);
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const openModal = (type) => {
    const data = {
      land: { title: "Shipping By Land", text: "Our ground network ensures fast and secure delivery via established road corridors.", img: "/transport_land_1775207381575.jpg" },
      sea: { title: "Shipping By Sea", text: "Sea freight is the backbone of global trade, moving large shipments across continents.", img: "/slide_ship_1775207286768.jpg" },
      air: { title: "Shipping By Air", text: "For urgent and high-priority shipments, air freight is the express choice.", img: "/transport_air_1775207407902.jpg" }
    };
    setServiceDetail(data[type]);
  };
  const closeModal = () => setServiceDetail(null);

  const [selectedCoin, setSelectedCoin] = useState('USDT');
  const [txId, setTxId] = useState('');
  const coins = { 
    BTC: 'bc1ql9v6mzf9h3z8v2h8z9z9z9z9z9z9z9',
    ETH: '0x1234567890abcdef1234567890abcdef12345678',
    USDT: '0xUSDT_TRC20_WALLET_ADDRESS_HERE_XXXXXXXX'
  };

  useEffect(() => {
    console.log("Strategic Search Init: Wiring Mapbox Listeners...");
    const handleRetrieve = (e, side) => {
      console.log(`Mapbox [${side}] Retrieve Event Fired:`, e.detail);
      const f = e.detail.features?.[0];
      if (!f) { console.warn(`Mapbox [${side}] No Feature Found`); return; }
      const ctx = f.context || [];
      const getC = (ids) => ctx.find(c => ids.some(id => c.id.includes(id)))?.text || '';
      
      const city = getC(['place', 'locality', 'district', 'neighborhood']);
      const state = getC(['region', 'province', 'state']);
      const country = getC(['country']);
      const zip = getC(['postcode', 'zip', 'postal']);
      
      const data = { city, state, country, zip };
      console.log(`Mapbox [${side}] Extracted Data:`, data);
      
      if (!data.city && f.place_name) {
         const parts = f.place_name.split(',').map(s => s.trim());
         if (parts.length >= 2) data.city = parts[parts.length - 2];
      }

      if (side === 'from') setFromAddressDetail(data);
      else setToAddressDetail(data);
    };
    const fromEl = fromAutofillRef.current;
    const toEl = toAutofillRef.current;
    if (fromEl) { console.log("Wiring From Node..."); fromEl.addEventListener('retrieve', (e) => handleRetrieve(e, 'from')); }
    if (toEl) { console.log("Wiring To Node..."); toEl.addEventListener('retrieve', (e) => handleRetrieve(e, 'to')); }
    return () => {
      if (fromEl) fromEl.removeEventListener('retrieve', (e) => handleRetrieve(e, 'from'));
      if (toEl) toEl.removeEventListener('retrieve', (e) => handleRetrieve(e, 'to'));
    };
  }, [loading]);

  return (
    <div className={`theme-provider ${theme === 'light' ? 'light-mode shadow-none' : 'dark-mode'}`} suppressHydrationWarning>
      <div className={`wrapper transition-all duration-500 ${theme === 'light' ? 'bg-white text-dark' : 'bg-dark text-white'}`}>
      <div id="progressBarContainer"><div id="progressBar" style={{ width: `${scrolled}%` }}></div></div>

      {loading && (
        <div className="splash-screen">
          <div className="splash-inner text-center">
            <img src="/2.jpeg" alt="Logo" className="splash-logo mb-4 rounded-circle" />
            <h2 className="splash-brand fw-bold mb-3 tracking-widest text-light">Seas Logistics Express</h2>
            <div className="splash-bar mx-auto" style={{maxWidth: '300px'}}><div className="splash-fill"></div></div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className={`navbar navbar-expand-lg fixed-top${navScrolled ? ' nav-scrolled' : ''}`}>
        <div className="container-fluid px-4 px-lg-5">
          <a className="navbar-brand d-flex align-items-center gap-3" href="#Home">
            <img src="/2.jpeg" alt="Logo" width="50" height="50" className="rounded-circle shadow-lg border border-white border-opacity-10" />
            <span className="fw-bold tracking-tighter text-white">Seas Logistics Express</span>
          </a>
          <button className="navbar-toggler border-0 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu"><i className="fas fa-bars text-white fs-3"></i></button>
          <div className="collapse navbar-collapse" id="navMenu">
            <ul className="navbar-nav ms-auto align-items-center gap-1">
              <li className="nav-item"><a className="nav-link px-2 uppercase tracking-widest small fw-bold text-white-50 hover-white transition-all text-nowrap" href="#Home">Home</a></li>
              <li className="nav-item"><a className="nav-link px-2 uppercase tracking-widest small fw-bold text-white-50 hover-white transition-all text-nowrap" href="#About">About Hub</a></li>
              <li className="nav-item"><a className="nav-link px-2 uppercase tracking-widest small fw-bold text-white-50 hover-white transition-all text-nowrap" href="#OurServices">Services</a></li>
              <li className="nav-item"><a className="nav-link px-2 uppercase tracking-widest small fw-bold text-white-50 hover-white transition-all text-nowrap" href="#Quote">Quote</a></li>
              
              <li className="nav-item dropdown ms-lg-2">
                <button className="nav-link dropdown-toggle border-0 bg-transparent text-white small fw-bold uppercase tracking-widest d-flex align-items-center gap-2 text-nowrap" data-bs-toggle="dropdown">
                  <i className="fas fa-globe text-primary"></i>{language.toUpperCase()}
                </button>
                <ul className="dropdown-menu dropdown-menu-dark rounded-4 shadow-2xl border-0 overflow-hidden" style={{ background: 'var(--glass-tint)', backdropFilter: 'blur(20px)' }}>
                  {languages.map(l=>(<li key={l.code}><button className={`dropdown-item px-4 py-2 fw-bold small uppercase ${theme === 'light' ? 'text-dark' : 'text-white'}`} onClick={()=>setLanguage(l.code)}>{l.flag} {l.name}</button></li>))}
                </ul>
              </li>

              <li className="nav-item dropdown ms-lg-1">
                <button className="nav-link dropdown-toggle border-0 bg-transparent text-white small fw-bold uppercase tracking-widest d-flex align-items-center gap-2 text-nowrap" data-bs-toggle="dropdown">
                  <i className="fas fa-coins text-success"></i>{currency.code}
                </button>
                <ul className="dropdown-menu dropdown-menu-dark rounded-4 shadow-2xl border-0 overflow-hidden" style={{ background: 'var(--glass-tint)', backdropFilter: 'blur(20px)' }}>
                  {currencies.map(c=>(<li key={c.code}><button className={`dropdown-item px-4 py-2 fw-bold small transition-all hover-white ${theme === 'light' ? 'text-dark' : 'text-white'}`} onClick={()=>setCurrency(c.code)}>{c.symbol} {c.code} - {c.name}</button></li>))}
                </ul>
              </li>

              <li className="nav-item ms-lg-2">
                 <button className="nav-link border-0 bg-transparent text-white d-flex align-items-center justify-content-center transition-all hover-scale" onClick={toggleTheme} style={{width:'40px', height:'40px'}}>
                   <i className={`fas ${theme === 'dark' ? 'fa-sun text-warning' : 'fa-moon text-info'} fs-5`}></i>
                 </button>
              </li>

              <li className="nav-item ms-lg-2">
                {!isAuthorized ? (
                  <button className="btn btn-primary d-flex align-items-center gap-2 px-3 py-2 rounded-pill shadow-xl border-0 transition-all hover-lift" onClick={() => setIsDashboardOpen(true)} style={{ background: 'linear-gradient(45deg, #3b82f6, #1d4ed8)', fontSize: '0.7rem' }}>
                    <i className="fas fa-layer-group"></i><span className="fw-bold uppercase tracking-widest text-nowrap">Elite Portal</span>
                  </button>
                ) : (
                  <button className="d-flex align-items-center gap-3 bg-transparent border-0 px-2 py-1 rounded-pill transition-all hover-lift animate-fade-in" onClick={()=>setIsDashboardOpen(true)}>
                    <div className="position-relative">
                      <div className="rounded-circle bg-dark border border-white border-opacity-20 d-flex align-items-center justify-content-center shadow-lg" style={{width:'38px', height:'38px', background:'rgba(255,255,255,0.05)'}}>
                         <i className="fas fa-user-tie text-primary fs-5"></i>
                      </div>
                      <div className="position-absolute bottom-0 end-0 bg-success border border-dark rounded-circle" style={{width:'10px', height:'10px'}}></div>
                    </div>
                    <div className="text-start d-none d-md-block">
                       <p className="x-small text-white-50 uppercase tracking-widest mb-0 fw-bold" style={{fontSize:'0.55rem'}}>Executive Node</p>
                       <h6 className="fw-bold text-white mb-0" style={{fontSize:'0.75rem', letterSpacing:'-0.5px'}}>{currentUserNodeName}</h6>
                    </div>
                  </button>
                )}
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero - Expanded 5 Slides Restoration */}
      <section id="Home" className="vh-100 position-relative overflow-hidden">
          <div id="heroCarousel" className="carousel slide h-100" data-bs-ride="carousel">
            <div className="carousel-inner h-100">
                <div className="carousel-item active h-100"><img src="/hero_ship.png" className="d-block w-100 h-100 object-fit-cover opacity-60" alt="Slide 1" /></div>
                <div className="carousel-item h-100"><img src="/hero_truck.png" className="d-block w-100 h-100 object-fit-cover opacity-60" alt="Slide 2" /></div>
                <div className="carousel-item h-100"><img src="/hero_plane.png" className="d-block w-100 h-100 object-fit-cover opacity-60" alt="Slide 3" /></div>
                <div className="carousel-item h-100"><img src="/hero_warehouse.png" className="d-block w-100 h-100 object-fit-cover opacity-60" alt="Slide 4" /></div>
                <div className="carousel-item h-100"><img src="/hero_delivery.png" className="d-block w-100 h-100 object-fit-cover opacity-60" alt="Slide 5" /></div>
            </div>
            <button className="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev"><span className="carousel-control-prev-icon shadow-lg"></span></button>
            <button className="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next"><span className="carousel-control-next-icon shadow-lg"></span></button>
          </div>
          <div className="hero-content text-center">
            <h1 className="display-2 fw-bold tracking-tighter mb-3 reveal">{t.heroTitle}</h1>
            <p ref={dynamicTextRef} className="h4 text-white-50 mb-5 reveal" style={{minHeight: '1.5em'}}></p>
            <button className="btn btn-brand-sunset btn-lg rounded-pill px-5 py-3 fw-bold reveal hover-lift" onClick={() => document.getElementById('Quote').scrollIntoView({behavior:'smooth'})}>{t.getQuote}</button>
          </div>
      </section>

      {/* Partners Ticker */}
      <section className="py-5" style={{ background: 'var(--glass-tint)' }}>
          <div className="container-fluid overflow-hidden px-0">
            <div className="partners-marquee d-flex align-items-center">
              {[1, 2].map((set) => (
                <div key={set} className="marquee-content d-flex align-items-center gap-5 px-5">
                   {[{n:'DHL',i:'fab fa-dhl'},{n:'FedEx',i:'fab fa-fedex'},{n:'UPS',i:'fab fa-ups'},{n:'Maersk',i:'fas fa-ship'},{n:'Global Air',i:'fas fa-plane'}].map((p,i)=>(
                    <div key={i} className="partner-item d-flex align-items-center gap-3 opacity-40 grayscale-hover">
                      <i className={`${p.i} fs-1 text-white`}></i><span className="fw-bold text-white uppercase tracking-widest small">{p.n}</span>
                    </div>
                   ))}
                </div>
              ))}
            </div>
          </div>
      </section>

      {/* Operations Radar */}
      <section className="py-5" style={{background: 'var(--bg-body)'}}>
          <div className="container py-5">
             <div className="row align-items-center mb-5 reveal">
                <div className="col-lg-6">
                   <h2 className="display-6 fw-bold text-white mb-2 tracking-tighter">Network Operations Active</h2>
                   <p className="text-white-50 x-small uppercase tracking-widest"><i className="fas fa-rss me-2 text-primary"></i>Live satellite telemetry</p>
                </div>
                <div className="col-lg-6 text-lg-end d-flex gap-5 justify-content-lg-end">
                   <div><h3 className="fw-bold mb-0 stat-count" data-target="3829">3,829</h3><p className="x-small text-primary uppercase mb-0 fw-bold">Active Arcs</p></div>
                   <div><h3 className="fw-bold mb-0 stat-count" data-target="24">24M</h3><p className="x-small text-success uppercase mb-0 fw-bold">TEU Capacity</p></div>
                </div>
             </div>
             <div id="radarMap" className="reveal rounded-5 overflow-hidden position-relative shadow-2xl border border-white border-opacity-10" style={{ height: '500px', background: '#0f172a' }}>
                  <img src="/cargo_radar_mockup_1775508823192.png" alt="Radar" className="w-100 h-100 object-fit-cover opacity-50 filter-blue-tint" />
                  <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
                    <div className="scanning-line"></div>
                    <div className="text-center z-2"><div className="radar-pulse-ring mb-4 mx-auto"></div><h5 className="fw-bold text-white-50 tracking-widest uppercase">Global Command Node</h5></div>
                  </div>
             </div>
          </div>
      </section>

      {/* RESTORED: LEGACY STATS BAR */}
      <section className="py-5" style={{background: 'var(--glass-tint)'}}>
         <div className="container">
            <div className="stats-inner reveal d-flex justify-content-between text-center">
               <div className="stat-item"><p className="tip stat-count" data-target="323" data-suffix="K">0</p><p className="second-text">Delivered Items</p></div>
               <div className="stat-item"><p className="tip stat-count" data-target="210" data-suffix="K">0</p><p className="second-text">Reviews</p></div>
               <div className="stat-item"><p className="tip stat-count" data-target="1247" data-suffix="">0</p><p className="second-text">Happy Clients</p></div>
               <div className="stat-item"><p className="tip stat-count" data-target="64127" data-suffix="">0</p><p className="second-text">Total Stores</p></div>
            </div>
         </div>
      </section>

      {/* About Section */}
      <section id="About" className="py-5 bg-dark">
          <div className="container py-5 text-center reveal">
            <h2 className="display-4 fw-bold text-white mb-3 tracking-tighter">{t.aboutTitle}</h2>
            <p className="text-white-50 mb-5 max-w-700 mx-auto">{t.aboutSubtitle}</p>
            <div className="row g-4">
              {[
                { type: 'land', label: t.byLand, img: '/transport_land_1775207381575.jpg', desc: 'Secure road freight services.' },
                { type: 'sea', label: t.bySea, img: '/slide_ship_1775207286768.jpg', desc: 'Global maritime network.' },
                { type: 'air', label: t.byAir, img: '/transport_air_1775207407902.jpg', desc: 'Express priority airlifts.' }
              ].map(item => (
                <div className="col-md-4" key={item.type}>
                  <div className="card-item-glass p-3 rounded-4 reveal cursor-pointer" onClick={() => openModal(item.type)}>
                    <img src={item.img} alt={item.label} className="img-fluid rounded-4 mb-4 shadow-xl hover-scale transition-all" style={{height:'240px', width:'100%', objectFit:'cover'}} />
                    <h5 className="fw-bold text-white mb-2 text-center">{item.label}</h5>
                    <p className="small text-white-50 mb-0">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
      </section>

      {/* Institutional Stats - Tactical Audit */}
      <section className="py-20 bg-dark position-relative overflow-hidden">
         <div className="container">
            <div className="row g-4 text-center align-items-stretch">
               {[{v:'323K',t:'Delivered Items',i:'fas fa-box-open'},
                 {v:'210K',t:'Reviews Received',i:'fas fa-star'},
                 {v:'1,247',t:'Happy Clients',i:'fas fa-user-check'},
                 {v:'64,127',t:'Total Online Stores',i:'fas fa-store'}].map((s,i)=>(
                 <div className="col-lg-3 col-sm-6 col-12 d-flex mb-4 mb-lg-0" key={i}>
                    <div className="stat-card reveal p-5 rounded-5 border border-white border-opacity-5 backdrop-blur-lg transition-all hover-scale w-100 d-flex flex-column align-items-center justify-content-center" style={{background:'rgba(255,255,255,0.02)', minHeight: '220px'}}>
                       <i className={`${s.i} fs-1 text-info mb-4 opacity-40 animate-pulse`}></i>
                       <h2 className="display-4 fw-bold text-white mb-2 tracking-tighter">{s.v}</h2>
                       <p className="x-small text-white-50 uppercase tracking-widest fw-bold mb-0 text-center">{s.t}</p>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* RESTORED: EXTENDED OUR SERVICES */}
      <section id="OurServices" className="py-5 brand-light">
         <div className="container py-5 text-center">
            <h2 className="display-5 fw-bold mb-3 tracking-tighter uppercase font-institutional reveal">Comprehensive Solutions</h2>
            <p className="text-muted mb-5 max-w-700 mx-auto reveal">Beyond transport, we provide the full stack of institutional logistics support.</p>
            <div className="row g-4">
               {[{i:'fas fa-globe-americas',t:'Worldwide Shipping',d:'Reliable international transport to 200+ countries.'},
                 {i:'fas fa-shipping-fast',t:'Express Delivery',d:'Guaranteed same-day institutional processing.'},
                 {i:'fas fa-warehouse',t:'Warehousing Solutions',d:'Strategic hub storage with smart inventory audit.'},
                 {i:'fas fa-file-signature',t:'Customs Clearance',d:'Automated regulatory filing for cargo release.'}].map((s,i)=>(
                 <div className="col-lg-3 col-md-6" key={i}>
                    <div className="service-card-elite reveal p-5 h-100 shadow-2xl rounded-5 transition-all hover-lift">
                       <i className={`${s.i} fs-1 text-primary mb-4`}></i>
                       <h5 className="fw-bold mb-3">{s.t}</h5>
                       <p className="small text-muted">{s.d}</p>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* Why Choose Us - Elite Configuration */}
      <section id="WhyChooseUs" className="py-20 bg-dark position-relative overflow-hidden">
         <div className="position-absolute top-0 start-0 opacity-10" style={{width:'300px', height:'300px', background:'radial-gradient(circle, #3b82f6 0%, transparent 70%)', filter:'blur(80px)'}}></div>
         <div className="container py-5 text-center px-4">
            <h2 className="display-4 fw-bold text-white mb-3 tracking-tighter reveal">Tactical Advantages</h2>
            <p className="text-white-50 mb-10 max-w-700 mx-auto reveal uppercase tracking-widest small">The Strategic Standard in Global Transport</p>
            <div className="row g-5">
               {[{i:'fas fa-bolt',t:'Advanced Speed',d:'Proprietary algorithms for the shortest global routing and instant dispatch.'},
                 {i:'fas fa-shield-alt',t:'Fortified Security',d:'Biometric and multi-sig asset protection protocols for high-value cargo.'},
                 {i:'fas fa-broadcast-tower',t:'24/7 Command Center',d:'Executive desk ready for immediate dispatch orders and real-time auditing.'}].map((feature,idx)=>(
                 <div className="col-md-4" key={idx} style={{zIndex:2}}>
                    <div className="feature-card-premium reveal p-5 h-100 rounded-5 border border-white border-opacity-5 backdrop-blur-xl transition-all hover-scale" style={{background: 'rgba(255,255,255,0.03)'}}>
                       <div className="icon-orb-premium mx-auto mb-5 d-flex align-items-center justify-content-center rounded-circle border border-info border-opacity-30 shadow-xl" style={{width:'90px', height:'90px', background:'rgba(0, 212, 255, 0.1)'}}>
                          <i className={`${feature.i} fs-1 text-info animate-pulse`}></i>
                       </div>
                       <h4 className="fw-bold text-white mb-3 tracking-tight">{feature.t}</h4>
                       <p className="small text-white-50 leading-relaxed mb-0">{feature.d}</p>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* RESTORED: LEGACY TRACKING HUB */}
      <section id="Feedback" className="py-10 bg-fixed bg-theme-gradient">
         <div className="container py-5 text-center reveal">
            <div className={`tracker-card mx-auto shadow-2xl p-5 rounded-5 border border-white border-opacity-10 backdrop-blur ${theme === 'light' ? 'shadow-none' : ''}`} style={{maxWidth: '700px', background: theme === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.02)'}}>
               <h2 className={`fw-bold display-6 tracking-tighter mb-4 shadow-sm ${theme === 'light' ? 'text-primary' : 'text-white'}`}>TRACK YOUR SHIPMENT</h2>
               <div className="d-flex flex-column gap-3 mt-4">
                  <input type="text" className="form-control-modern border-white border-opacity-20 bg-dark bg-opacity-30 text-white p-4 rounded-pill text-center fs-4" placeholder="Enter Tracking Number(s)" required />
                  <button className="btn btn-brand-sunset py-3 rounded-pill fw-bold text-white uppercase tracking-widest fs-5 shadow-xl border-0">Track Now</button>
               </div>
            </div>
         </div>
      </section>

      {/* RESTORED: TESTIMONIALS CAROUSEL (Full 9-Card Sync) */}
      <section id="Testimonials" className="brand-light py-20 overflow-visible">
         <div className="container py-10 overflow-visible">
            <div className="text-center mb-10"><h2 className="reveal display-5 fw-bold tracking-tighter brand-light-title mb-3">Institutional Endorsements</h2><p className="text-muted uppercase tracking-widest small">The Global Standard in Reliable Dispatch</p></div>
            <div id="testimonialCarousel" className="carousel slide reveal overflow-visible" data-bs-ride="carousel">
               <div className="carousel-inner pb-20 overflow-visible">
                  {[
                    [{n:'Anna Deynah',r:'UX Designer',i:'(1)',t:'Seas Logistics has redefined my supply chain audit process. Their speed is unmatched.'},
                     {n:'John Doe',r:'Web Developer',i:'(32)',t:'The blockchain settlement and crypto options provide the security our partners demand.'},
                     {n:'Maria Kate',r:'Photographer',i:'(10)',t:'Reliable, professional, and globally reachable. They handle bulk cargo with absolute care.'}],
                    [{n:'John Doe',r:'UX Designer',i:'(3)',t:'The best handling for international exports. Fast, secure, and institutional grade.'},
                     {n:'Alex Rey',r:'Web Developer',i:'(4)',t:'The API integration for tracking is seamless. Their tech stack is truly next-gen.'},
                     {n:'Maria Kate',r:'Director',i:'(5)',t:'Consistent performance over 20 years. They are our primary logistics partner.'}],
                    [{n:'Anna Deynah',r:'UX Designer',i:'(6)',t:'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quod eos id officiis hic.'},
                     {n:'John Doe',r:'Operations',i:'(8)',t:'Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit.'},
                     {n:'Chris Evans',r:'Global Trade',i:'(7)',t:'The best handling for international exports. Fast, secure, and institutional grade.'}]
                  ].map((group, gIdx) => (
                    <div className={`carousel-item ${gIdx===0?'active':''}`} key={gIdx}>
                       <div className="row g-5">
                          {group.map((t, idx) => (
                            <div className="col-md-4" key={idx}>
                               <div className="testimonial-item h-100 shadow-2xl p-5 rounded-5 bg-white border border-black border-opacity-5 transition-all hover-lift" style={{marginBottom:'20px'}}>
                                  <div className="text-center">
                                    <img src={`https://mdbcdn.b-cdn.net/img/Photos/Avatars/img%20${t.i}.webp`} alt={t.n} className="shadow-xl rounded-circle mb-4" style={{width:'80px', height:'80px'}} />
                                    <h5 className="fw-bold mb-1 text-dark">{t.n}</h5><p className="text-muted x-small uppercase-tracking-widest fw-bold">{t.r}</p>
                                    <div className="divider-lite my-4 mx-auto" style={{width:'40px'}}></div>
                                    <p className="testimonial-text mb-4"><i className="fas fa-quote-left me-2 text-primary"></i>{t.t}</p>
                                    <div className="stars text-warning"><i className="fas fa-star mx-1"></i><i className="fas fa-star mx-1"></i><i className="fas fa-star mx-1"></i><i className="fas fa-star mx-1"></i><i className="fas fa-star mx-1"></i></div>
                                  </div>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                  ))}
               </div>
               <div className="d-flex justify-content-center gap-4 mt-10">
                  <button className="btn btn-outline-dark rounded-circle border-2" data-bs-target="#testimonialCarousel" data-bs-slide="prev" style={{width:'60px', height:'60px'}}><i className="fas fa-chevron-left"></i></button>
                  <button className="btn btn-outline-dark rounded-circle border-2" data-bs-target="#testimonialCarousel" data-bs-slide="next" style={{width:'60px', height:'60px'}}><i className="fas fa-chevron-right"></i></button>
               </div>
            </div>
         </div>
      </section>

      {/* Dynamic Quote Engine - Elite Visualizer */}
      <section id="Quote" className="py-5">
         <div className="container py-5">
            <div className="quote-glass-card mx-auto shadow-2xl reveal p-0 overflow-hidden">
               <div className="px-xl-4 p-3">
                  <div className="text-center mb-5"><h2 className="text-white fw-bold display-5 tracking-tighter">Institutional Estimator</h2><p className="text-white-50 uppercase tracking-widest small">Real-time dynamic yield & volumetric audit</p></div>
                  <form>
                     <div className="row g-4 mb-5">
                        <div className="col-md-6">
                           {!fromIsManual ? (
                             <mapbox-address-autofill ref={fromAutofillRef} access-token={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN} suppressHydrationWarning>
                               <input type="text" className="form-control-modern" id="fromLocation" placeholder="Search Global Port/City" required autoComplete="shipping address-line1" />
                             </mapbox-address-autofill>
                           ) : (
                             <input type="text" className="form-control-modern" id="fromLocation" placeholder="Manual Origin Entry" required />
                           )}
                           <div className={`mt-3 p-3 rounded-4 bg-dark bg-opacity-30 border border-white border-opacity-10 animate-fade-in ${fromAddressDetail?.city || fromIsManual ? 'd-block' : 'd-none'}`}>
                             <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'1rem'}}>
                               {[
                                 {k:'city', a:'shipping address-level2'},
                                 {k:'state', a:'shipping address-level1'},
                                 {k:'zip', a:'shipping postal-code'},
                                 {k:'country', a:'shipping country-name'}
                               ].map(item=>(
                                 <div key={item.k}>
                                   <label className={`x-small uppercase tracking-widest mb-1 d-block fw-bold ${theme === 'light' ? 'text-primary' : 'text-white-50 opacity-50'}`}>{item.k}</label>
                                   <input type="text" className="form-control-modern x-small py-2 px-3 text-white border-0 bg-black bg-opacity-40" placeholder={item.k} defaultValue={fromAddressDetail?.[item.k] || ''} autoComplete={item.a} onInput={(e)=>setFromAddressDetail(p=>({...p, [item.k]: e.target.value}))} />
                                 </div>
                               ))}
                             </div>
                           </div>
                           <button type="button" className="btn btn-link text-primary x-small p-0 mt-2 text-decoration-none fw-bold" onClick={() => { setFromIsManual(!fromIsManual); setFromAddressDetail({}); }}>{fromIsManual ? 'Map Link' : 'Manual Entry'}</button>
                        </div>
                        <div className="col-md-6">
                           {!toIsManual ? (
                             <mapbox-address-autofill ref={toAutofillRef} access-token={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN} suppressHydrationWarning>
                               <input type="text" className="form-control-modern" id="toLocation" placeholder="Search Global Destination" required autoComplete="shipping address-line1" />
                             </mapbox-address-autofill>
                           ) : (
                             <input type="text" className="form-control-modern" id="toLocation" placeholder="Manual Destination Entry" required />
                           )}
                           <div className={`mt-3 p-3 rounded-4 bg-dark bg-opacity-30 border border-white border-opacity-10 animate-fade-in ${toAddressDetail?.city || toIsManual ? 'd-block' : 'd-none'}`}>
                             <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'1rem'}}>
                               {[
                                 {k:'city', a:'shipping address-level2'},
                                 {k:'state', a:'shipping address-level1'},
                                 {k:'zip', a:'shipping postal-code'},
                                 {k:'country', a:'shipping country-name'}
                               ].map(item=>(
                                 <div key={item.k}>
                                   <label className={`x-small uppercase tracking-widest mb-1 d-block fw-bold ${theme === 'light' ? 'text-primary' : 'text-white-50 opacity-50'}`}>{item.k}</label>
                                   <input type="text" className="form-control-modern x-small py-2 px-3 text-white border-0 bg-black bg-opacity-40" placeholder={item.k} defaultValue={toAddressDetail?.[item.k] || ''} autoComplete={item.a} onInput={(e)=>setToAddressDetail(p=>({...p, [item.k]: e.target.value}))} />
                                 </div>
                               ))}
                             </div>
                           </div>
                           <button type="button" className="btn btn-link text-success x-small p-0 mt-2 text-decoration-none fw-bold" onClick={() => { setToIsManual(!toIsManual); setToAddressDetail({}); }}>{toIsManual ? 'Map Link' : 'Manual Entry'}</button>
                        </div>
                     </div>
                    <div className="row g-4 mb-5">
                       <div className="col-md-6 d-grid gap-4">
                          <div className="modern-input-wrap"><input type="number" id="weight" className="form-control-modern" placeholder="KG" onChange={calculateLiveQuote} /><span className="input-unit">KG</span></div>
                          <div className="modern-input-wrap"><input type="number" id="length" className="form-control-modern" placeholder="L" onChange={calculateLiveQuote} /><span className="input-unit">L</span></div>
                       </div>
                       <div className="col-md-6 d-grid gap-4">
                          <div className="modern-input-wrap"><input type="number" id="width" className="form-control-modern" placeholder="W" onChange={calculateLiveQuote} /><span className="input-unit">W</span></div>
                          <div className="modern-input-wrap"><input type="number" id="height" className="form-control-modern" placeholder="H" onChange={calculateLiveQuote} /><span className="input-unit">H</span></div>
                       </div>
                    </div>
                    <div className="cargo-visualizer-suite mb-5 p-5 rounded-4 reveal border border-white border-opacity-5">
                       <div className="text-center">
                          <div className="cargo-box-3d-wrap no-print position-relative mx-auto mb-8"><div className="box-shadow-3d"></div><div className="box-3d"><div className="face front"></div><div className="face back"></div><div className="face right"></div><div className="face left"></div><div className="face top"></div><div className="face bottom"></div></div></div>
                          <p className="small text-white-50 mt-4 tracking-widest uppercase mb-6">Calculated Volumetric Yield: <span id="volRes" className="text-white fw-bold">0</span> m³</p>
                          <div className="divider-lite mx-auto mb-6" style={{width:'100px'}}></div>
                          <h5 className="fw-bold mb-2">Space Optimization Node</h5>
                          <p className="small text-white-50 mb-0 mx-auto" style={{maxWidth:'400px'}}>Algorithms auditing volumetric yield for maximum efficiency and fleet deployment.</p>
                       </div>
                    </div>
                    {quoteEstimate && (
                      <div className="row g-4 fade-in justify-content-center">
                        {Object.values(quoteEstimate).map((tier, idx) => (
                          <div className="col-md-4" key={idx}>
                             <div className="tier-card-elite shadow-2xl d-flex flex-column h-100 transition-all hover-scale" onClick={()=>{
                                 const getAddr = (det, id) => { if (det && (det.city || det.country)) return [det.city, det.state, det.country].filter(Boolean).join(', '); return document.getElementById(id)?.value || 'TBA'; };
                                 const f = getAddr(fromAddressDetail, 'fromLocation'); const t = getAddr(toAddressDetail, 'toLocation'); const w = document.getElementById('weight')?.value || '0';
                                 setSelectedTier({...tier, from: f, to: t, weight: w}); setIsBookingOpen(true);
                             }}>
                                <div className={`orb-icon ${idx===0?'bg-primary':idx===1?'bg-warning':'bg-success'}`}><i className={tier.icon}></i></div>
                                <h5 className="h4 fw-bold mb-1 text-white">{tier.label}</h5><p className="text-muted small mb-4">{tier.description}</p>
                                <div className="divider-lite"></div>
                                <div className="mt-auto pt-2">
                                   <div className="d-flex justify-content-between align-items-end mb-4">
                                      <div><p className="x-small text-muted mb-1 uppercase tracking-widest fw-bold">Est Arrival</p><h6 className="fw-bold text-white mb-0">{tier.date}</h6></div>
                                      <div className="text-end"><h3 className="fw-bold text-primary mb-0">{currency.symbol}{tier.price}</h3></div>
                                   </div>
                                   <button type="button" className="btn btn-brand-sunset w-100 py-3 rounded-pill fw-bold shadow-xl border-0"><i className="fas fa-check-double me-2"></i>Institutional Book</button>
                                </div>
                             </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </form>
               </div>
            </div>
         </div>
      </section>

      {/* RESTORED: READY TO BOOK CALL-TO-ACTION */}
      <section className="py-20 bg-fixed bg-theme-gradient">
         <div className="container py-5 text-center reveal">
            <h2 className="display-4 fw-bold text-white mb-4 tracking-tighter">READY TO BOOK YOUR SHIPMENT?</h2>
            <p className="text-white-50 mb-5 max-w-700 mx-auto uppercase tracking-widest small">Deploy your global assets with institutional precision and executive oversight.</p>
            <div className="d-flex justify-content-center gap-4">
               <button className="btn btn-brand-sunset btn-lg rounded-pill px-5 py-3 fw-bold reveal hover-scale" onClick={()=>document.getElementById('Quote').scrollIntoView({behavior:'smooth'})}>Initialize Dispatch</button>
               <button className={`btn btn-lg rounded-pill px-5 py-3 fw-bold hover-lift ${theme === 'light' ? 'btn-outline-dark' : 'btn-outline-light'}`} onClick={() => { if(window.Tawk_API) { window.Tawk_API.toggle(); } else { document.getElementById('ExecutiveSupportNode').scrollIntoView({behavior:'smooth'}); } }}>Executive Support</button>
            </div>
         </div>
      </section>

      {/* Insights Section */}
      <section id="Insights" className="py-5 bg-dark">
          <div className="container py-5 reveal">
             <div className="text-center mb-5"><h2 className="display-5 fw-bold text-white tracking-tighter mb-3">Industry Insights</h2><p className="text-white-50 uppercase tracking-widest small">Critical logistics market news</p></div>
             <div className="row g-4">
                {[{t:'Freight Surge',d:'Navigating trade lane constraints.'},{t:'Aviation Speed',d:'Express supply chain redefining.'},{t:'Green Logistics',d:'Sustainable practices at Sea.'}].map((b,i)=>(
                  <div className="col-md-4" key={i}>
                    <div className="blog-card-elite p-4 h-100 shadow-lg">
                       <h5 className="fw-bold text-white mb-3">{b.t}</h5>
                       <p className="small text-white-50 mb-4">{b.d}</p>
                       <button className="btn btn-link p-0 text-white fw-bold text-decoration-none small uppercase">Read Audit <i className="fas fa-arrow-right ms-2 small"></i></button>
                    </div>
                  </div>
                ))}
             </div>
          </div>
      </section>

      {/* FAQ & Strategic Support */}
      <section id="ExecutiveSupportNode" className="py-5 bg-dark border-top border-white border-opacity-5">
         <div className="container py-5 mx-auto reveal" style={{maxWidth: '800px'}}>
            <h2 className="text-center text-white fw-bold display-6 mb-5 tracking-tighter">Strategic Support</h2>
            <div className="accordion faq-accordion shadow-lg rounded-4 overflow-hidden" id="faqCenter">
               {[{q:'Tracking Mechanism?',a:'Monitored via satellite nodes.'},{q:'Crypto Security?',a:'Multi-sig escrow settlement.'},{q:'Audit Policy?',a:'100% transparent freight auditing.'}].map((f,i)=>(
                 <div className="accordion-item" key={i}>
                    <h2 className="accordion-header"><button className="accordion-button collapsed py-4" type="button" data-bs-toggle="collapse" data-bs-target={`#faq${i}`}>{f.q}</button></h2>
                    <div id={`faq${i}`} className="accordion-collapse collapse" data-bs-parent="#faqCenter"><div className="accordion-body text-white-50 py-4 pt-0">{f.a}</div></div>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* Contact Section - High Performance Identity Hub */}
      <section id="ContactSection" className="py-20 bg-dark position-relative overflow-hidden">
         <div className="position-absolute top-0 end-0 opacity-10" style={{width:'400px', height:'400px', background:'radial-gradient(circle, #3b82f6 0%, transparent 70%)', filter:'blur(100px)'}}></div>
         <div className="container py-10 reveal">
            <div className="row g-5 align-items-center">
               <div className="col-lg-5">
                  <h6 className="text-primary fw-bold uppercase tracking-widest mb-3 small anima-pulse">Direct Priority Support</h6>
                  <h2 className="display-4 fw-bold text-white mb-4 tracking-tighter">Direct command communication</h2>
                  <p className="text-white-50 mb-8 max-w-500">Access our executive desk 24/7 for fleet deployment, asset auditing, and priority dispatch.</p>
                  
                  <div className="d-grid gap-4">
                     <div className="p-4 rounded-5 bg-dark bg-opacity-40 border border-white border-opacity-10 shadow-2xl backdrop-blur transition-all hover-lift">
                        <div className="d-flex align-items-center gap-4">
                           <div className="p-3 rounded-circle bg-primary bg-opacity-20 text-primary"><i className="fas fa-headset fs-4"></i></div>
                           <div><h6 className="fw-bold text-white mb-0">Global Operations Center</h6><p className="small text-white-50 mb-0 uppercase tracking-widest">24/7 Active Dispatch</p></div>
                        </div>
                     </div>
                     <div className="p-4 rounded-5 bg-dark bg-opacity-40 border border-white border-opacity-10 shadow-2xl backdrop-blur transition-all hover-lift">
                        <div className="d-flex align-items-center gap-4">
                           <div className="p-3 rounded-circle bg-success bg-opacity-20 text-success"><i className="fas fa-microchip fs-4"></i></div>
                           <div><h6 className="fw-bold text-white mb-0">AI Audit Node</h6><p className="small text-white-50 mb-0 uppercase tracking-widest">Active Verification</p></div>
                        </div>
                     </div>
                  </div>
               </div>
               
               <div className="col-lg-7">
                  <div className="p-5 p-lg-10 rounded-5 bg-dark bg-opacity-40 border border-white border-opacity-10 shadow-3xl backdrop-blur-3xl animate-slide-up">
                     <form onSubmit={(e)=>{e.preventDefault(); alert('Tactical briefing encrypted and dispatched.');}}>
                        <div className="row g-4 mb-4">
                           <div className="col-6">
                              <label className="x-small text-white-50 uppercase tracking-widest mb-2 fw-bold">Entity Name</label>
                              <input type="text" className="form-control-modern bg-black bg-opacity-30 border-white border-opacity-10 text-white p-4 rounded-4" placeholder="Logistics Group A" required />
                           </div>
                           <div className="col-6">
                              <label className="x-small text-white-50 uppercase tracking-widest mb-2 fw-bold">Strategic Email</label>
                              <input type="email" className="form-control-modern bg-black bg-opacity-30 border-white border-opacity-10 text-white p-4 rounded-4" placeholder="dispatch@node.com" required />
                           </div>
                        </div>
                        <div className="mb-8">
                           <label className="x-small text-white-50 uppercase tracking-widest mb-2 fw-bold">Executive Briefing</label>
                           <textarea className="form-control-modern bg-black bg-opacity-30 border-white border-opacity-10 text-white p-4 rounded-5" rows="5" placeholder="Details regarding fleet deployment..."></textarea>
                        </div>
                        <button type="submit" className="btn btn-primary w-100 py-4 rounded-pill fw-bold shadow-3xl transition-all hover-lift uppercase tracking-widest" style={{background: 'linear-gradient(45deg, #3b82f6, #1d4ed8)', border:'0'}}>
                           <i className="fas fa-paper-plane me-3 animate-pulse"></i>Deploy Executive Briefing
                        </button>
                     </form>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="footer-elite text-white py-5">
         <div className="container pt-5">
            <div className="row g-5 pb-5 border-bottom border-white border-opacity-10 text-center text-md-start">
               <div className="col-lg-3">
                  <h4 className="fw-bold tracking-tighter mb-4">Seas Logistics Express</h4>
                  <p className="text-white-50 small mb-4">The global standard for institutional freight command architecture.</p>
               </div>
               <div className="col-lg-2">
                  <h6 className="fw-bold uppercase tracking-widest mb-4 small text-primary">Nav Node</h6>
                  <nav className="d-grid gap-2">
                     <a href="#Home" className="footer-link small">Home Base</a>
                     <a href="#About" className="footer-link small">Intelligence</a>
                     <a href="#OurServices" className="footer-link small">Services</a>
                     <a href="#Quote" className="footer-link small">Estimator</a>
                  </nav>
               </div>
               <div className="col-lg-2">
                  <h6 className="fw-bold uppercase tracking-widest mb-4 small text-primary">Strategic</h6>
                  <nav className="d-grid gap-2">
                     <a href="#" className="footer-link small">Freight Audit</a>
                     <a href="#" className="footer-link small">Cargo Security</a>
                     <a href="#" className="footer-link small">Customs Node</a>
                     <a href="#" className="footer-link small">Transit Brief</a>
                  </nav>
               </div>
               <div className="col-lg-2">
                  <h6 className="fw-bold uppercase tracking-widest mb-4 small text-primary">Institutional</h6>
                  <nav className="d-grid gap-2">
                     <a href="#" className="footer-link small">Command Registry</a>
                     <a href="#" className="footer-link small">Node Preferences</a>
                     <a href="/admin/login" className="footer-link small">Elite Portal</a>
                  </nav>
               </div>
               <div className="col-lg-3">
                  <h6 className="fw-bold uppercase tracking-widest mb-4 small text-primary">Node Briefing</h6>
                  <div className="position-relative">
                     <input type="email" className="newsletter-glass-input x-small" placeholder="Secure Briefing Email" />
                     <button className="btn btn-primary btn-sm rounded-circle position-absolute end-0 top-50 translate-middle-y me-2" style={{width:'40px', height:'40px'}}><i className="fas fa-paper-plane small"></i></button>
                  </div>
               </div>
            </div>
            <p className="x-small text-white-50 mt-4 text-center px-4">© 2026 Seas Logistics Express. 100% Institutional Command Audit. Global Assets Registry Enabled.</p>
         </div>
      </footer>

      {showBackTop && (<button className="btn btn-primary rounded-circle shadow-2xl position-fixed end-0 z-3 border-0" onClick={()=>window.scrollTo({top:0, behavior:'smooth'})} style={{width:'60px', height:'60px', bottom: '100px', right: '30px', background:'linear-gradient(45deg, #3b82f6, #1d4ed8)'}}><i className="fas fa-arrow-up fs-5"></i></button>)}

      {/* Service Details Overlay */}
      {serviceDetail && (
        <div className="modal-overlay-custom animate-fade-in no-print" style={{zIndex: 9999999, background: 'rgba(0,0,0,0.95)'}}>
          <div className="booking-modal-card bg-white rounded-5 shadow-2xl p-0 overflow-hidden mx-auto shadow-2xl" style={{maxWidth: '600px', margin: 'auto'}}>
            <img src={serviceDetail.img || null} alt={serviceDetail.title || "Service"} className="w-100 object-fit-cover" style={{height: '320px'}} />
            <div className="p-5">
               <h2 className="fw-bold text-dark mb-3 tracking-tighter">{serviceDetail.title}</h2>
               <p className="text-muted mb-5">{serviceDetail.text}</p>
               <button className="btn btn-dark w-100 py-3 rounded-pill fw-bold uppercase tracking-widest small" onClick={closeModal}>Dismiss Briefing</button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {isBookingOpen && selectedTier && (
        <div className="modal-overlay-custom animate-fade-in p-3 p-md-5 no-print" style={{zIndex: 999999, background:'rgba(0,0,0,0.85)'}}>
           <div className="booking-modal-card reveal-zoom bg-white shadow-2xl rounded-5 overflow-hidden mx-auto border-0" style={{maxWidth:'1000px'}}>
              <div className="row g-0">
                 <div className="col-lg-5 p-5 bg-dark text-white d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-center mb-5"><h4 className="fw-bold mb-0 text-white">Booking Summary</h4><button className="btn-close btn-close-white" onClick={()=>setIsBookingOpen(false)}></button></div>
                    <div className="flex-grow-1">
                       <div className="mb-4"><p className="x-small text-white-50 mb-0 uppercase mb-1">Origin</p><h6 className="fw-bold">{selectedTier.from}</h6></div>
                       <div className="mb-4"><p className="x-small text-white-50 mb-0 uppercase mb-1">Destination</p><h6 className="fw-bold">{selectedTier.to}</h6></div>
                       <div className="p-3 rounded-3 bg-black bg-opacity-25 border border-white border-opacity-10">
                          <p className="small mb-1">{selectedTier.label} - {selectedTier.weight} KG</p>
                          <h4 className="fw-bold text-primary mb-0">{currency.symbol}{selectedTier.price}</h4>
                       </div>
                    </div>
                    <div className="alert alert-primary bg-primary bg-opacity-10 border-0 text-white x-small mb-0 mt-4"><i className="fas fa-shield-alt me-2 text-primary"></i> 256-bit encryption. Escrow active.</div>
                 </div>
                 <div className="col-lg-7 p-5">
                    <h5 className="fw-bold text-dark mb-4">Settlement Engine</h5>
                    <div className="mb-4">
                       <p className="x-small text-muted uppercase tracking-widest mb-3">Select Asset</p>
                       <div className="d-flex gap-2">
                          {Object.keys(coins).map(c=>(
                            <button key={c} className={`btn flex-grow-1 py-2 rounded-3 fw-bold transition-all ${selectedCoin===c?'btn-primary shadow-lg':'btn-outline-secondary opacity-50'}`} style={selectedCoin===c?{background:'linear-gradient(45deg, #3b82f6, #1d4ed8)', border:'0'}:{}} onClick={()=>setSelectedCoin(c)}>{c}</button>
                          ))}
                       </div>
                    </div>
                    <div className="p-4 rounded-4 bg-light border border-2 border-dashed text-center mb-4">
                       <img src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${coins[selectedCoin]}`} alt="QR Code" className="mb-3 shadow-sm rounded-3" />
                       <p className="x-small text-muted mb-2 tracking-widest uppercase">Official Agency Wallet</p>
                       <code className="d-block p-2 bg-white rounded border small text-dark mb-2 text-break">{coins[selectedCoin]}</code>
                       <button className="btn btn-link btn-sm text-primary p-0" onClick={() => navigator.clipboard.writeText(coins[selectedCoin])}><i className="fas fa-copy me-1"></i>Copy Hash</button>
                    </div>
                    <div className="mb-4">
                       <label className="x-small text-muted uppercase tracking-widest mb-2">Transaction Hash (TXID)</label>
                       <input type="text" className="form-control form-control-lg bg-light border-0 rounded-3 shadow-sm" placeholder="Paste settlement confirmation hash" value={txId} onChange={(e)=>setTxId(e.target.value)} />
                    </div>
                    <button className="btn btn-dark w-100 py-3 rounded-pill fw-bold shadow-2xl transition-all hover-lift" onClick={async ()=>{
                       if(!txId) return alert('Transaction Hash is required.');
                       const bookingData = { ...selectedTier, coin: selectedCoin, txId, status: 'pending_verification', timestamp: new Date(), currency: currency.code };
                       await saveQuote(bookingData);
                       await logTransaction({ type: 'booking_settlement', amount: selectedTier.price, currency: currency.code, txId, user: 'guest_institutional' });
                       alert('Settlement Logged. Our executive desk will verify the TXID.');
                       setIsBookingOpen(false);
                    }}>Finalize Settlement</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Elite Portal - Institutional Command Hub */}
      {isDashboardOpen && (
        <div className="dashboard-overlay animate-fade-in no-print" style={{ zIndex: 100000000 }}>
           <div className="dashboard-modal reveal-zoom shadow-2xl">
              {!isAuthorized ? (
                /* AUTH GATEKEEPER - INSTITUTIONAL LOGIN/SIGNUP */
                <div className="d-flex h-100 flex-column flex-lg-row bg-dark text-white">
                   <div className="col-lg-6 d-none d-lg-block p-0 position-relative">
                      <img src="/hero_ship.png" className="w-100 h-100 object-fit-cover opacity-40 shadow-inner" alt="Auth Hub" />
                      <div className="position-absolute top-50 start-50 translate-middle text-center w-75">
                         <h2 className="display-5 fw-bold text-white tracking-tighter mb-4">NODE ACCESS</h2>
                         <p className="text-white-50 uppercase tracking-widest small">Real-time institutional oversight and dispatch tracking.</p>
                      </div>
                   </div>
                   <div className="col-lg-6 p-5 p-md-10 d-flex flex-column justify-content-center bg-dark">
                      <div className="text-center mb-5"><img src="/2.jpeg" alt="Logo" className="rounded-circle shadow-lg mb-4" style={{width:'80px', height:'80px'}} /><h3 className="fw-bold text-white tracking-tighter">{authHubMode==='login'?'COMMAND LOGIN':'ELITE REGISTRY'}</h3></div>
                      <div className="auth-form-hub mx-auto w-100" style={{maxWidth: '400px'}}>
                         {authHubMode==='signup' && (<div className="mb-4"><label className="x-small text-white-50 uppercase tracking-widest mb-2">Entity Name</label><input type="text" className="form-control-modern py-3 text-white" placeholder="Global Logistics Corp" /></div>)}
                         <div className="mb-4"><label className="x-small text-white-50 uppercase tracking-widest mb-2">Institutional Email</label><input type="email" value={authEmail} onChange={(e)=>setAuthEmail(e.target.value)} className="form-control-modern py-3 text-white" placeholder="dispatch@node.com" /></div>
                         <div className="mb-5"><label className="x-small text-white-50 uppercase tracking-widest mb-2">Safe-Hash Password</label><input type="password" value={authPass} onChange={(e)=>setAuthPass(e.target.value)} className="form-control-modern py-3 text-white" placeholder="••••••••" /></div>
                         <button className="btn btn-primary w-100 py-3 rounded-pill fw-bold shadow-xl mb-4 transition-all hover-lift d-flex align-items-center justify-content-center gap-2" onClick={handleAuthAction} style={{background:'linear-gradient(45deg, #3b82f6, #1d4ed8)', border:'0'}} disabled={isAuthLoading}>
                            {isAuthLoading ? <><span className="spinner-border spinner-border-sm" role="status"></span> SYNCING...</> : <><i className="fas fa-satellite"></i> INITIALIZE SESSION</>}
                         </button>
                         <button className="btn btn-link w-100 text-white-50 small text-decoration-none fw-bold mb-4" onClick={()=>setAuthHubMode(authHubMode==='login'?'signup':'login')}>{authHubMode==='login'?'Deploy New Node (Sign-up)':'Return to Command Login'}</button>
                         <div className="divider-lite mb-4" style={{height:'1px', background:'rgba(255,255,255,0.1)'}}></div>
                         <button className="btn btn-outline-light w-100 py-3 rounded-pill fw-bold opacity-50 x-small" onClick={()=>{setIsDashboardOpen(false); document.getElementById('Home')?.scrollIntoView({behavior:'smooth'});}}>PROCEED AS INSTITUTIONAL GUEST <i className="fas fa-chevron-right ms-2"></i></button>
                      </div>
                      <button className="btn btn-link text-white-50 small mt-10 text-center text-decoration-none" onClick={()=>setIsDashboardOpen(false)}>Terminate Handshake</button>
                   </div>
                </div>
              ) : (
                /* CLIENT DASHBOARD - OPERATIONAL OVERSIGHT */
                <div className="d-flex h-100 flex-column flex-lg-row text-white">
                   <aside className={`dashboard-sidebar d-flex flex-column h-100 border-end ${theme === 'light' ? 'bg-light border-dark border-opacity-10' : 'bg-dark border-white border-opacity-5'}`}>
                      <div className="text-center mb-10 p-4"><img src="/2.jpeg" alt="Logo" className="rounded-circle shadow-lg mb-3" style={{width:'80px', height:'80px'}} /><h5 className="fw-bold tracking-tighter text-white">{currentUserNodeName}</h5><p className="x-small text-white-50 uppercase tracking-widest">Client Node: Active Hub</p></div>
                      <nav className="flex-grow-1 overflow-auto px-3">
                         <button className={`nav-node-btn w-100 ${dashboardTab==='trace'?'active':''}`} onClick={()=>setDashboardTab('trace')}><i className="fas fa-search-location"></i>Trace Shipment</button>
                         <button className={`nav-node-btn w-100 ${dashboardTab==='bookings'?'active':''}`} onClick={()=>setDashboardTab('bookings')}><i className="fas fa-history"></i>Booking Audit</button>
                         <button className={`nav-node-btn w-100 ${dashboardTab==='settlements'?'active':''}`} onClick={()=>setDashboardTab('settlements')}><i className="fas fa-wallet"></i>Settlement Log</button>
                         <button className={`nav-node-btn w-100 ${dashboardTab==='support'?'active':''}`} onClick={()=>setDashboardTab('support')}><i className="fas fa-headset"></i>Executive Support</button>
                      </nav>
                      <div className="p-4 d-flex flex-column gap-2">
                         <button className="btn btn-primary rounded-pill py-3 fw-bold shadow-xl transition-all hover-lift" onClick={()=>setIsDashboardOpen(false)} style={{background: 'linear-gradient(45deg, #3b82f6, #1d4ed8)', border: '0'}}>
                            <i className="fas fa-home me-2"></i>RETURN TO HOME
                         </button>
                         <button className="btn btn-outline-light w-100 rounded-pill py-3 fw-bold opacity-25 hover-white" onClick={()=>{setIsAuthorized(false); setIsDashboardOpen(false);}}>
                            <i className="fas fa-sign-out-alt me-2"></i>EXIT PORTAL
                         </button>
                      </div>
                   </aside>
                   <main className={`dashboard-content position-relative h-100 flex-grow-1 p-5 p-lg-10 overflow-auto ${theme === 'light' ? 'bg-white' : 'bg-dark bg-opacity-80'}`}>
                      {/* CINEMATIC BACKGROUND GRID OVERLAY */}
                      <div className="position-absolute inset-0 opacity-10 pointer-events-none" style={{ background: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px', zIndex: 0 }}></div>
                      
                      <div className="position-relative z-index-10 d-flex justify-content-between align-items-center mb-8">
                         <div>
                            <h2 className="display-6 fw-bold tracking-tighter text-white mb-2">GLOBAL OPERATIONS CENTER</h2>
                            <p className="text-white-50 uppercase tracking-widest small">Institutional Dispatch & Asset Telemetry</p>
                         </div>
                         <div className="text-end d-none d-md-block">
                             <div className="badge bg-success bg-opacity-10 border border-success border-opacity-20 text-success px-4 py-2 rounded-pill x-small fw-bold tracking-widest animate-pulse">
                                <i className="fas fa-satellite-dish me-2"></i>24/7 ACTIVE DISPATCH
                             </div>
                         </div>
                      </div>
                      
                      <div className="row g-4 mb-10">
                         <div className="col-md-4">
                             <div className="stat-widget-elite shadow-xl border border-white border-opacity-10 rounded-5 p-4 bg-dark bg-opacity-50 hover-lift">
                                <div className="d-flex align-items-center gap-4">
                                  <div className="p-4 rounded-4 bg-dark bg-opacity-30 text-primary" style={{width:'65px', height:'65px', display:'flex', alignItems:'center', justifyContent:'center'}}><i className="fas fa-ship fs-3"></i></div>
                                  <div><p className="x-small text-white-50 uppercase tracking-widest mb-1 fw-bold">Transit Assets</p><h4 className="fw-bold mb-0 text-white">{userShipments.length} Active</h4></div>
                                </div>
                             </div>
                          </div>
                          <div className="col-md-4">
                             <div className="stat-widget-elite shadow-xl border border-white border-opacity-10 rounded-5 p-4 bg-dark bg-opacity-50 hover-lift">
                                <div className="d-flex align-items-center gap-4">
                                  <div className="p-4 rounded-4 bg-dark bg-opacity-30 text-success" style={{width:'65px', height:'65px', display:'flex', alignItems:'center', justifyContent:'center'}}><i className="fas fa-coins fs-3"></i></div>
                                  <div><p className="x-small text-white-50 uppercase tracking-widest mb-1 fw-bold">Settled Audit</p><h4 className="fw-bold mb-0 text-white">{currency.symbol}{settledAuditTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4></div>
                                </div>
                             </div>
                          </div>
                          <div className="col-md-4">
                             <div className="stat-widget-elite shadow-xl border border-white border-opacity-10 rounded-5 p-4 bg-dark bg-opacity-50 hover-lift">
                                <div className="d-flex align-items-center gap-4">
                                  <div className="p-4 rounded-4 bg-dark bg-opacity-30 text-warning" style={{width:'65px', height:'65px', display:'flex', alignItems:'center', justifyContent:'center'}}><i className="fas fa-exclamation-circle fs-3"></i></div>
                                  <div><p className="x-small text-white-50 uppercase tracking-widest mb-1 fw-bold">Dispatch Alerts</p><h4 className="fw-bold mb-0 text-white">{dispatchAlertCount} Critical</h4></div>
                                </div>
                             </div>
                          </div>
                      </div>

                      {dashboardTab === 'trace' && (
                         <div className="mb-10 p-5 rounded-5 bg-white bg-opacity-5 border border-white border-opacity-10 shadow-2xl animate-fade-in">
                            <h5 className="fw-bold text-white mb-4 tracking-tighter d-flex align-items-center gap-3"><i className="fas fa-satellite-dish text-primary"></i>Global Trace & Trace Hub</h5>
                            <div className="position-relative">
                               <input type="text" className="form-control-modern py-4 ps-5 text-white bg-dark bg-opacity-50" value={searchHash} onChange={(e)=>setSearchHash(e.target.value)} placeholder="Enter Global Shipment Hash (SL-XXXX)..." style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
                               <i className="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-4 text-primary opacity-50"></i>
                               <button className="btn btn-primary rounded-pill px-5 py-2 position-absolute end-0 top-50 translate-middle-y me-2 fw-bold" onClick={handleGlobalTrace} style={{background: 'linear-gradient(45deg, #3b82f6, #1d4ed8)', border: '0'}}>AUDIT NODE</button>
                            </div>
                            {tracedShipment && (
                               <div className="mt-8 p-5 bg-dark bg-opacity-50 rounded-4 border border-white border-opacity-5 reveal-zoom">
                                  <div className="d-flex justify-content-between align-items-start mb-6">
                                     <div><h4 className="fw-bold text-white mb-1">Status: {tracedShipment.status}</h4><p className="x-small text-white-50 uppercase tracking-widest font-monospace">HashID: {tracedShipment.trackingNumber}</p></div>
                                     <span className="badge bg-primary px-3 py-2 rounded-pill uppercase small tracking-widest">In Transit</span>
                                  </div>
                                  <div className="tracking-timeline-lite">
                                     {(tracedShipment.steps || []).map((step, idx)=>(
                                        <div className={`timeline-node d-flex gap-4 mb-4 ${step.done ? 'node-done' : 'node-pending'}`} key={idx}>
                                           <div className="node-icon-hub"><i className={`fas ${step.done ? 'fa-check-circle' : 'fa-circle'}`}></i></div>
                                           <div><h6 className="fw-bold text-white mb-1 small">{step.label}</h6><p className="x-small text-white-50 mb-0">{step.time || 'Pending Schedule'}</p></div>
                                        </div>
                                     ))}
                                  </div>
                               </div>
                            )}
                         </div>
                      )}

                      {dashboardTab === 'bookings' && (
                         <div className="p-5 rounded-5 bg-dark shadow-2xl border border-white border-opacity-5 animate-slide-up">
                            <div className="d-flex justify-content-between align-items-center mb-5"><h5 className="fw-bold text-white mb-0 d-flex align-items-center gap-3"><i className="fas fa-history text-primary"></i>Recent Institutional Transit Audit</h5><button className="btn btn-link text-white-50 small uppercase text-decoration-none fw-bold" onClick={()=>fetchUserHistory(currentUserNode)}>Refresh Log <i className="fas fa-sync-alt ms-2"></i></button></div>
                            <div className="telemetry-table">
                               {userBookings.length > 0 ? userBookings.map((t,i)=>(
                                 <div className="telemetry-row px-3 py-4 hover-lift-lite rounded-3 d-flex align-items-center justify-content-between" key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div className="d-flex align-items-center gap-4">
                                       <span className="fw-bold text-primary font-monospace">{t.txId?.substring(0,8) || 'ELITE_NODE'}</span>
                                       <div className="d-none d-lg-block"><p className="x-small text-white-50 uppercase tracking-widest mb-0 fw-bold">{t.fromCity} <i className="fas fa-arrow-right mx-2 text-white-30"></i> {t.toCity}</p></div>
                                    </div>
                                    <div className="d-flex align-items-center gap-4">
                                       <span className={`badge rounded-pill px-3 py-2 ${t.status==='completed'?'bg-success':'bg-primary'}`}>{t.status || 'Pending Audit'}</span>
                                       <span className="x-small text-white-50 d-none d-lg-block">{t.createdAt?.toDate?.()?.toLocaleDateString() || 'Recent'}</span>
                                       <button className="btn btn-outline-light btn-sm rounded-pill px-4 small border-opacity-10 hover-lift d-none d-md-block opacity-50" onClick={()=>viewShipmentDetails(t.trackingNumber || t.id)}>VIEW BRIEF</button>
                                    </div>
                                 </div>
                               )) : (
                                 <div className="text-center py-10 opacity-25"><i className="fas fa-box-open fs-1 mb-3"></i><p className="tracking-widest uppercase small">No recent logs found on this node.</p></div>
                               )}
                            </div>
                         </div>
                      )}

                      {dashboardTab === 'settlements' && (
                         <div className="p-5 rounded-5 bg-dark shadow-2xl border border-white border-opacity-5 animate-slide-up">
                            <div className="d-flex justify-content-between align-items-center mb-5"><h5 className="fw-bold text-white mb-0 d-flex align-items-center gap-3"><i className="fas fa-wallet text-success"></i>Settlement Ledger</h5></div>
                            <div className="telemetry-table">
                               {userTransactions.length > 0 ? userTransactions.map((tx,i)=>(
                                 <div className="telemetry-row px-3 py-4 hover-lift-lite rounded-3 d-flex align-items-center justify-content-between" key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div className="d-flex align-items-center gap-4">
                                       <span className="p-3 rounded-circle bg-dark bg-opacity-30 text-success"><i className="fas fa-arrow-up"></i></span>
                                       <div><h6 className="fw-bold text-white mb-1 small">{tx.description}</h6><p className="x-small text-white-50 mb-0 font-monospace uppercase">{tx.type}</p></div>
                                    </div>
                                    <div className="text-end">
                                       <h6 className="fw-bold text-success mb-1">+{currency.symbol}{tx.amount?.toLocaleString()}</h6>
                                       <p className="x-small text-white-50 mb-0">{tx.timestamp?.toDate?.()?.toLocaleDateString() || 'Recent'}</p>
                                    </div>
                                 </div>
                               )) : (
                                 <div className="text-center py-10 opacity-25"><i className="fas fa-file-invoice-dollar fs-1 mb-3"></i><p className="tracking-widest uppercase small">No financial settlements recorded.</p></div>
                               )}
                            </div>
                         </div>
                      )}

                      {dashboardTab === 'support' && (
                         <div className="p-5 rounded-5 bg-dark shadow-2xl border border-white border-opacity-5 animate-slide-up">
                            <div className="d-flex justify-content-between align-items-center mb-8"><div><h5 className="fw-bold text-white mb-2 d-flex align-items-center gap-3"><i className="fas fa-headset text-warning"></i>Executive Support Hub</h5><p className="text-white-50 x-small uppercase tracking-widest">Connect with your dedicated dispatch agent.</p></div><button className="btn btn-primary rounded-pill px-4 py-2 small fw-bold shadow-xl">New Ticket <i className="fas fa-plus ms-2"></i></button></div>
                            <div className="telemetry-table">
                               {userTickets.length > 0 ? userTickets.map((tik,i)=>(
                                 <div className="telemetry-row px-3 py-4 hover-lift-lite rounded-3 d-flex align-items-center justify-content-between" key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div className="d-flex align-items-center gap-4">
                                       <span className="p-3 rounded-circle bg-primary bg-opacity-20 text-primary"><i className="fas fa-comment-dots"></i></span>
                                       <div><h6 className="fw-bold text-white mb-1 small">{tik.subject}</h6><p className="x-small text-white-50 mb-0 uppercase tracking-tighter">Ref: {tik.id?.substring(0,8)}</p></div>
                                    </div>
                                    <div className="d-flex align-items-center gap-4">
                                       <span className={`badge rounded-pill px-3 py-2 ${tik.status==='open'?'bg-primary':'bg-success'}`}>{tik.status?.toUpperCase() || 'OPEN'}</span>
                                       <button className="btn btn-outline-light btn-sm rounded-pill px-4 small border-opacity-10 hover-white-5">Chat</button>
                                    </div>
                                 </div>
                               )) : (
                                 <div className="text-center py-20 bg-white bg-opacity-5 rounded-5 border border-dashed border-white border-opacity-10">
                                    <i className="fas fa-user-tie fs-1 mb-4 text-primary opacity-30"></i>
                                    <h5 className="fw-bold text-white mb-3 tracking-tighter">Your Executive Agent is Standby</h5>
                                    <p className="text-white-50 small mb-6 mx-auto" style={{maxWidth:'300px'}}>Direct priority support is active for your institutional node. No open tickets found.</p>
                                    <button className="btn btn-primary rounded-pill px-8 py-3 fw-bold transition-all hover-lift">INITIALIZE PRIORITY CHAT</button>
                                 </div>
                               )}
                            </div>
                         </div>
                      )}
                   </main>
                </div>
              )}
           </div>
        </div>
      )}
      {/* Floating Strategy Controls */}
      <div className="fixed-bottom-controls d-flex flex-column gap-3 p-4 z-3 position-fixed bottom-0 end-0 no-print">
         {showBackTop && (<button className="btn btn-primary rounded-circle shadow-3xl border-0 p-0 d-flex align-items-center justify-content-center transition-all hover-scale" onClick={()=>window.scrollTo({top:0, behavior:'smooth'})} style={{width:'65px', height:'65px', background:'linear-gradient(45deg, #3b82f6, #1d4ed8)'}}><i className="fas fa-arrow-up fs-4"></i></button>)}
      </div>
      </div>
    </div>
  );
}
