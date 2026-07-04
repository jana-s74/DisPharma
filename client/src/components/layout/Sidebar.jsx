import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ── Nav item definitions ──────────────────────────────────────────────────────
const navGroups = [
  {
    label: 'Main',
    items: [
      {
        to: '/dashboard',
        label: 'Dashboard',
        icon: (
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z
                 M14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z
                 M4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z
                 M14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        ),
      },
      {
        to: '/search',
        label: 'Explore',
        icon: (
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Pharmacy',
    items: [
      {
        to: '/profile',
        label: 'My Stock',
        icon: (
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        ),
      },
      {
        to: '/bill',
        label: 'Bill History',
        icon: (
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      },
    ],
  },
];

// ── Chevron arrow icon ─────────────────────────────────────────────────────────
const ChevronDown = ({ open }) => (
  <svg
    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    fill="none" viewBox="0 0 24 24" stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
  </svg>
);

// ── Main Sidebar ───────────────────────────────────────────────────────────────
const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Track which groups are open — default all open
  const [openGroups, setOpenGroups] = useState(
    Object.fromEntries(navGroups.map((g) => [g.label, true]))
  );

  const toggleGroup = (label) =>
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));

  const initials = user?.medicalName?.[0]?.toUpperCase() || 'D';

  return (
    <aside
      className="fixed left-0 top-14 bottom-0 z-40 flex flex-col"
      style={{
        width: '230px',
        background: '#ffffff',
        borderRight: '1px solid #e8edf2',
        boxShadow: '2px 0 12px rgba(0,0,0,0.04)',
      }}
    >
      {/* ── User Profile Card ── */}
      <div
        style={{
          padding: '16px 16px 14px',
          borderBottom: '1px solid #f0f4f8',
          background: 'linear-gradient(135deg, #f8fffe 0%, #f0fdf4 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Avatar */}
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              overflow: 'hidden',
              flexShrink: 0,
              background: 'linear-gradient(135deg, #16a34a, #0f3b2d)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 800,
              boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
            }}
          >
            {user?.profilePhoto
              ? <img src={user.profilePhoto} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span>{initials}</span>
            }
          </div>

          {/* Name & role */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontWeight: 700,
              fontSize: '13px',
              color: '#0f172a',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.3,
            }}>
              {user?.medicalName || 'DisPharma'}
            </p>
            <p style={{
              fontSize: '11px',
              color: '#64748b',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {user?.ownerName || 'Pharmacist'}
            </p>
          </div>

          {/* Arrow */}
          <svg
            style={{ width: '14px', height: '14px', color: '#94a3b8', flexShrink: 0 }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {/* License badge */}
        {user?.licenseNo && (
          <div style={{
            marginTop: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: 'rgba(22,163,74,0.08)',
            borderRadius: '8px',
            padding: '5px 8px',
          }}>
            <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: 700 }}>LICENSE</span>
            <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 600 }}>{user.licenseNo}</span>
            <span style={{
              marginLeft: 'auto',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#16a34a',
              animation: 'pulse 2s infinite',
            }} />
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
        {navGroups.map((group) => (
          <div key={group.label} style={{ marginBottom: '4px' }}>

            {/* Group header (collapsible) */}
            <button
              onClick={() => toggleGroup(group.label)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                marginBottom: '2px',
              }}
            >
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#94a3b8',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>
                {group.label}
              </span>
              <ChevronDown open={openGroups[group.label]} />
            </button>

            {/* Group items */}
            {openGroups[group.label] && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {group.items.map((item) => {
                  const isActive = location.pathname.startsWith(item.to);
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        fontWeight: isActive ? 700 : 500,
                        fontSize: '13.5px',
                        color: isActive ? '#16a34a' : '#475569',
                        background: isActive
                          ? 'linear-gradient(135deg, rgba(22,163,74,0.1), rgba(22,163,74,0.06))'
                          : 'transparent',
                        border: isActive ? '1px solid rgba(22,163,74,0.15)' : '1px solid transparent',
                        transition: 'all 0.15s ease',
                        position: 'relative',
                      }}
                      className="sidebar-nav-item"
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <span style={{
                          position: 'absolute',
                          left: 0,
                          top: '20%',
                          bottom: '20%',
                          width: '3px',
                          borderRadius: '0 3px 3px 0',
                          background: '#16a34a',
                        }} />
                      )}

                      {/* Icon */}
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        flexShrink: 0,
                        color: isActive ? '#16a34a' : '#64748b',
                        background: isActive ? 'rgba(22,163,74,0.12)' : '#f8fafc',
                        border: '1px solid',
                        borderColor: isActive ? 'rgba(22,163,74,0.2)' : '#e2e8f0',
                        transition: 'all 0.15s ease',
                      }}>
                        {item.icon}
                      </span>

                      <span style={{ flex: 1 }}>{item.label}</span>

                      {/* Arrow on hover (always rendered, opacity trick via CSS) */}
                      <svg
                        style={{
                          width: '12px',
                          height: '12px',
                          color: isActive ? '#16a34a' : '#cbd5e1',
                          opacity: isActive ? 1 : 0,
                          transition: 'opacity 0.15s ease',
                        }}
                        className="sidebar-item-arrow"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* ── Bottom section ── */}
      <div style={{
        padding: '12px 8px',
        borderTop: '1px solid #f0f4f8',
      }}>
        {/* Brand info */}
        <div style={{
          padding: '10px 12px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          border: '1px solid #bbf7d0',
          marginBottom: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #16a34a, #0f3b2d)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg style={{ width: '14px', height: '14px', color: '#fff' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#15803d', lineHeight: 1.2 }}>DisPharma</p>
              <p style={{ fontSize: '10px', color: '#4ade80', fontWeight: 500 }}>Inter-Pharmacy Network</p>
            </div>
            <span style={{
              marginLeft: 'auto',
              fontSize: '9px',
              fontWeight: 700,
              color: '#16a34a',
              background: 'rgba(22,163,74,0.12)',
              padding: '2px 6px',
              borderRadius: '6px',
              border: '1px solid rgba(22,163,74,0.2)',
            }}>v1.0</span>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={() => { logout(); navigate('/login'); }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: '10px',
            border: '1px solid transparent',
            background: 'transparent',
            cursor: 'pointer',
            color: '#ef4444',
            fontSize: '13px',
            fontWeight: 600,
            transition: 'all 0.15s ease',
          }}
          className="sidebar-logout-btn"
        >
          <span style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '30px',
            height: '30px',
            borderRadius: '8px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            flexShrink: 0,
          }}>
            <svg style={{ width: '15px', height: '15px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </span>
          Logout
        </button>
      </div>

      {/* ── Hover styles via <style> ── */}
      <style>{`
        .sidebar-nav-item:hover {
          background: #f8fafc !important;
          color: #1e293b !important;
          border-color: #e2e8f0 !important;
        }
        .sidebar-nav-item:hover .sidebar-item-arrow {
          opacity: 1 !important;
        }
        .sidebar-logout-btn:hover {
          background: #fef2f2 !important;
          border-color: #fecaca !important;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
