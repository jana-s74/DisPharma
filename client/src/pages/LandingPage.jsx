import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState, useRef } from 'react';

const categories = [
  { name: 'Heart Care', icon: '/icons/heart.png', bgColor: 'bg-yellow-50', hoverBg: 'hover:bg-yellow-100' },
  { name: 'Liver Care', icon: '/icons/lungs.png', bgColor: 'bg-pink-50', hoverBg: 'hover:bg-pink-100' },
  { name: 'Eye Care', icon: '/icons/eye.png', bgColor: 'bg-blue-50', hoverBg: 'hover:bg-blue-100' },
  { name: 'Diabetic Care', icon: '/icons/diabetic.png', bgColor: 'bg-purple-50', hoverBg: 'hover:bg-purple-100' },
  { name: 'Kidney Care', icon: '/icons/medical.png', bgColor: 'bg-orange-50', hoverBg: 'hover:bg-orange-100' },
];

const NAV_LINKS = [
  { label: 'Home', id: 'home' },
  { label: 'Services', id: 'services' },
  { label: 'Shop', id: 'shop' },
  { label: 'About Us', id: 'about' },
  { label: 'Contact', id: 'contact' },
];

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const navContainerRef = useRef(null);
  const navBtnRefs = useRef({});
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });

  /* ── Move sliding pill whenever active section changes ── */
  useEffect(() => {
    const btn = navBtnRefs.current[activeSection];
    const container = navContainerRef.current;
    if (!btn || !container) return;
    const btnRect = btn.getBoundingClientRect();
    const conRect = container.getBoundingClientRect();
    setPillStyle({
      left: btnRect.left - conRect.left,
      width: btnRect.width,
    });
  }, [activeSection]);

  /* ── Light-mode enforcement ── */
  useEffect(() => {
    document.documentElement.classList.add('light-mode');
    return () => {
      if (localStorage.getItem('theme') !== 'light')
        document.documentElement.classList.remove('light-mode');
    };
  }, []);

  /* ── Scroll-spy: picks section whose top is nearest navbar bottom ── */
  useEffect(() => {
    const NAVBAR_H = 72; // px — height of fixed navbar

    const onScroll = () => {
      const sections = NAV_LINKS
        .map(({ id }) => {
          const el = document.getElementById(id);
          if (!el) return null;
          return { id, top: el.getBoundingClientRect().top - NAVBAR_H };
        })
        .filter(Boolean);

      // If scrolled to bottom of page → always activate last section (contact)
      const atBottom =
        window.innerHeight + window.scrollY >= document.body.scrollHeight - 10;
      if (atBottom) {
        setActiveSection(NAV_LINKS[NAV_LINKS.length - 1].id);
        return;
      }

      // Find the last section whose top has crossed the navbar
      let current = sections[0].id;
      for (const s of sections) {
        if (s.top <= 10) current = s.id;
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // run once on mount
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Smooth scroll helper ── */
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#a3e635] selection:text-[#0f3b2d] pt-[68px]">

      {/* ══════════════════════════════════════════
          FIXED NAVBAR
      ══════════════════════════════════════════ */}
      <div className="fixed top-0 left-0 right-0 w-full z-50 bg-white/95 backdrop-blur-lg border-b border-slate-100 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
        <nav className="flex items-center justify-between px-4 sm:px-6 md:px-10 py-3 md:py-4 max-w-[1400px] mx-auto">

          {/* Brand */}
          <button onClick={() => scrollTo('home')} className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 overflow-hidden transition-transform group-hover:scale-105">
              <img src="/logo.png" alt="DisPharma Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[#0f3b2d] uppercase">
              DisPharma
            </span>
          </button>

          {/* Desktop Nav Links — sliding pill */}
          <div
            ref={navContainerRef}
            className="hidden md:flex items-center gap-1 bg-slate-50/80 rounded-2xl px-2 py-1.5 border border-slate-100 relative"
          >
            {/* Animated sliding pill background */}
            {pillStyle.width > 0 && (
              <span
                className="absolute top-1.5 bottom-1.5 bg-white rounded-xl shadow-md shadow-slate-200/70 pointer-events-none"
                style={{
                  left: pillStyle.left,
                  width: pillStyle.width,
                  transition: 'left 0.35s cubic-bezier(0.4,0,0.2,1), width 0.35s cubic-bezier(0.4,0,0.2,1)',
                }}
              />
            )}

            {NAV_LINKS.map(({ label, id }) => {
              const isActive = activeSection === id;
              return (
                <button
                  key={id}
                  ref={el => { navBtnRefs.current[id] = el; }}
                  onClick={() => scrollTo(id)}
                  className={`relative z-10 px-4 py-2 text-sm font-semibold rounded-xl transition-colors duration-200 ${isActive ? 'text-[#0f3b2d]' : 'text-slate-500 hover:text-[#0f3b2d]'
                    }`}
                >
                  {label}
                  {isActive && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#a3e635]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/search')}
                className="bg-[#0f3b2d] text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm font-semibold hover:bg-[#16a34a] transition-colors shadow-md"
              >
                Dashboard
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="font-semibold text-sm text-slate-600 hover:text-[#0f3b2d] transition-colors hidden sm:block px-3 py-2 rounded-xl hover:bg-slate-100"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="bg-[#0f3b2d] text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm font-semibold hover:bg-[#16a34a] transition-colors shadow-md border-2 border-transparent hover:border-[#a3e635]"
                >
                  Get Started
                </Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="md:hidden flex flex-col gap-1.5 p-2.5 rounded-xl hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              <span className={`block h-0.5 w-5 bg-slate-700 rounded transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block h-0.5 w-5 bg-slate-700 rounded transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 w-5 bg-slate-700 rounded transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map(({ label, id }) => {
              const isActive = activeSection === id;
              return (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${isActive
                      ? 'bg-[#0f3b2d]/5 text-[#0f3b2d] border-l-4 border-[#a3e635]'
                      : 'text-slate-600 hover:bg-slate-50 border-l-4 border-transparent'
                    }`}
                >
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#a3e635] flex-shrink-0" />}
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          HERO  (#home)
      ══════════════════════════════════════════ */}
      <div id="home" className="max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 mb-10 sm:mb-16 relative z-10 pt-6 scroll-mt-20">
        <div className="bg-[#0b3124] rounded-2xl sm:rounded-[2.5rem] relative overflow-hidden pt-10 sm:pt-16 px-5 sm:px-8 md:px-16 min-h-[380px] sm:min-h-[500px] flex flex-col md:flex-row items-center shadow-2xl">

          {/* Decorative background text — hidden from screen readers & crawlers */}
          <div aria-hidden="true" className="absolute top-4 sm:top-8 left-0 right-0 text-center pointer-events-none select-none z-0">
            <span className="text-[18vw] sm:text-[14vw] font-black tracking-tighter leading-none text-[#a3e635] opacity-[0.10] sm:opacity-[0.15]">
              Pharm<span className="text-[#8ef34b]">acy</span>
            </span>
          </div>

          <div className="relative z-10 w-full md:w-1/2 mt-6 sm:mt-10 md:mt-24 pb-8 sm:pb-16">
            <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-[1.1]">
              India's Premiere <br />
              <span className="text-[#a3e635]">Inter-Pharmacy</span> <br />
              Network
            </h1>
            <p className="text-emerald-100/80 mb-6 sm:mb-8 max-w-sm text-sm sm:text-base lg:text-lg leading-relaxed">
              Connect with nearby medicals, search real-time stock, and refer customers with an exclusive 4% margin system.
            </p>
            <button
              onClick={() => navigate(isAuthenticated ? '/search' : '/register')}
              className="bg-white text-[#0f3b2d] px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg hover:bg-[#a3e635] hover:scale-105 transition-all duration-300 shadow-xl inline-flex items-center gap-2"
            >
              Start Now <span>→</span>
            </button>
          </div>

          <div className="relative z-10 w-full md:w-1/2 flex justify-center items-end h-full mt-4 md:mt-0">
            <img
              src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&q=80"
              alt="A pharmacist in a white coat ready to assist customers"
              fetchpriority="high"
              className="object-cover rounded-t-full border-4 border-[#a3e635]/20 shadow-[0_0_50px_rgba(163,230,53,0.15)] h-[260px] sm:h-[360px] md:h-[450px] object-top"
            />
            <div className="absolute bottom-8 sm:bottom-16 -left-2 sm:-left-8 bg-white/10 backdrop-blur-md p-2 sm:p-4 rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl">
              <div className="w-14 h-14 sm:w-24 sm:h-24 bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-inner">
                <img src="/generic_medicine_box.png" alt="Sample medicine packaging" loading="lazy" className="w-full h-full object-cover mix-blend-multiply" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          SERVICES  (#services)
      ══════════════════════════════════════════ */}
      <div id="services" className="max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 mb-14 sm:mb-24 scroll-mt-20">
        <div className="text-center mb-8 sm:mb-16">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#16a34a] bg-[#16a34a]/10 px-4 py-1.5 rounded-full mb-3">What We Offer</span>
          <h3 className="text-2xl sm:text-3xl font-bold text-[#0f3b2d] mb-3 sm:mb-4">Our Services</h3>
          <p className="text-slate-500 max-w-2xl mx-auto text-sm sm:text-base">Everything you need to run your pharmacy efficiently and grow your business network.</p>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {[
            { icon: '/icons/search.png', title: 'Smart Search', desc: 'Find medicines instantly across nearby pharmacies when you run out of stock.' },
            { icon: '/icons/margin.png', title: 'Earn Margin', desc: 'Refer customers to other pharmacies and earn an instant 4% margin.' },
            { icon: '/icons/receipt.png', title: 'Quick Billing', desc: 'Generate professional bills for your customers with built-in stock management.' }
          ].map((service, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 hover:-translate-y-2 hover:shadow-2xl hover:border-[#a3e635]/30 transition-all duration-300 group">
              <div className="w-24 h-24 bg-[#16a34a]/5 group-hover:bg-[#16a34a]/10 flex items-center justify-center rounded-2xl mb-6 overflow-hidden transition-colors">
                <img src={service.icon} alt={service.title} className="w-full h-full object-contain mix-blend-multiply" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">{service.title}</h4>
              <p className="text-slate-600 leading-relaxed">{service.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          SHOP / CATEGORIES  (#shop)
      ══════════════════════════════════════════ */}
      <div id="shop" className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 mb-14 sm:mb-24 text-center scroll-mt-20">
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#16a34a] bg-[#16a34a]/10 px-4 py-1.5 rounded-full mb-3">Browse</span>
        <h3 className="text-2xl sm:text-3xl font-bold text-[#0f3b2d] mb-8 sm:mb-12">Popular Categories</h3>
        <div className="flex flex-wrap justify-center gap-5 sm:gap-8 md:gap-12 lg:gap-16">
          {categories.map((cat, i) => (
            <button
              key={i}
              type="button"
              onClick={() => navigate(isAuthenticated ? '/search' : '/login')}
              className="flex flex-col items-center gap-2 sm:gap-4 group cursor-pointer"
              aria-label={`Browse ${cat.name}`}
            >
              <div className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full ${cat.bgColor} ${cat.hoverBg} flex items-center justify-center shadow-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl overflow-hidden`}>
                <img src={cat.icon} alt={cat.name} loading="lazy" className="w-full h-full object-contain mix-blend-multiply" />
              </div>
              <span className="font-semibold text-slate-700 text-sm group-hover:text-[#0f3b2d] transition-colors">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Promo Banners */}
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 mb-14 sm:mb-24 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
        <div className="bg-[#0f3b2d] rounded-2xl sm:rounded-3xl p-6 sm:p-10 flex flex-col justify-center relative overflow-hidden shadow-2xl group">
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-[#a3e635] text-[#0f3b2d] text-xs font-bold px-3 py-1 rounded-full">DELIVERY</div>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white max-w-[250px] mb-4 sm:mb-6 leading-tight">
            Free Delivery Within <span className="text-[#a3e635]">10 km</span>
          </h3>
          <button onClick={() => navigate(isAuthenticated ? '/search' : '/register')} className="self-start bg-white/10 hover:bg-white/20 text-white border border-white/30 px-6 py-2.5 rounded-full font-semibold transition-all">
            Learn More
          </button>
          <img src="https://images.unsplash.com/photo-1576602976047-174e57a47881?w=400&q=80" alt="Delivery motorcycle on the road" loading="lazy" className="absolute -right-10 -bottom-10 w-64 h-64 object-cover opacity-80 rounded-full group-hover:scale-105 transition-transform duration-500" />
        </div>

        <div className="bg-[#facc15] rounded-2xl sm:rounded-3xl p-6 sm:p-10 flex flex-col justify-center relative overflow-hidden shadow-2xl group">
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-white text-[#ca8a04] text-xs font-bold px-3 py-1 rounded-full shadow-sm">FEATURED</div>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 max-w-[300px] mb-4 sm:mb-6 leading-tight uppercase tracking-tight">
            You can enjoy <span className="text-white drop-shadow-md">5% discount</span> using our network
          </h3>
          <button onClick={() => navigate(isAuthenticated ? '/search' : '/register')} className="self-start bg-white text-[#ca8a04] hover:bg-slate-50 px-6 py-2.5 rounded-full font-bold shadow-md transition-all hover:shadow-lg">
            View Details
          </button>
          <img src="/generic_medicine_box.png" alt="Medicine box packaging" loading="lazy" className="absolute -right-4 -bottom-8 w-56 h-56 object-cover opacity-90 drop-shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500" />
        </div>
      </div>

      {/* ══════════════════════════════════════════
          ABOUT US  (#about)
      ══════════════════════════════════════════ */}
      <div id="about" className="bg-slate-50 scroll-mt-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-14 sm:py-24">
          <div className="text-center mb-10 sm:mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#16a34a] bg-[#16a34a]/10 px-4 py-1.5 rounded-full mb-3">Who We Are</span>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#0f3b2d] mb-3">About DisPharma</h3>
            <p className="text-slate-500 max-w-2xl mx-auto text-sm sm:text-base">India's leading inter-pharmacy network built to empower pharmacists and serve patients better.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { emoji: '🏥', title: 'Our Mission', desc: 'To create a seamless pharmacy ecosystem where medicine is always accessible and profitable for every pharmacy owner.' },
              { emoji: '🌿', title: 'Our Vision', desc: 'A connected India where no patient is turned away due to stock shortages and every pharmacy grows together.' },
              { emoji: '🤝', title: 'Our Values', desc: 'Trust, transparency, and technology — we build tools that pharmacists can rely on every single day.' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="text-4xl mb-4">{item.emoji}</div>
                <h4 className="text-lg font-bold text-[#0f3b2d] mb-2">{item.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          CONTACT  (#contact)
      ══════════════════════════════════════════ */}
      <div id="contact" className="scroll-mt-20">
        <footer className="bg-[#0f3b2d] text-emerald-100/60 py-10 sm:py-16 mt-auto">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                </div>
                <span className="font-black text-2xl tracking-tight text-white uppercase">DisPharma</span>
              </div>
              <p className="leading-relaxed">India's leading inter-pharmacy network. Connect, search stock, and grow your sales seamlessly.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Quick Links</h4>
              <div className="space-y-3 flex flex-col items-start">
                {NAV_LINKS.map(({ label, id }) => (
                  <button key={id} onClick={() => scrollTo(id)} className="hover:text-white transition-colors text-sm">{label}</button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Contact Us</h4>
              <div className="space-y-3 text-sm">
                <p>📍 Madurai, Tamil Nadu</p>
                <p>📞 +91 8940133017</p>
                <p>✉️ janaselvarasu7@gmail.com</p>
              </div>
            </div>
          </div>
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 mt-10 sm:mt-16 pt-6 sm:pt-8 border-t border-white/10 text-center text-sm">
            &copy; {new Date().getFullYear()} DisPharma Network. All rights reserved.
          </div>
        </footer>
      </div>

    </div>
  );
};

export default LandingPage;
