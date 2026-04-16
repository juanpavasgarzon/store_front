'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '../providers/ThemeProvider';
import { clearTokens, getRefreshToken } from '../lib/api/client';
import { auth } from '../lib/api/auth';
import { useProfile } from '../lib/hooks';
import { useQueryClient } from '@tanstack/react-query';
import UserAvatar from './UserAvatar';
import { Sun, Moon, X, Menu, LayoutDashboard, Heart } from 'lucide-react';

const iconBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 34,
  height: 34,
  borderRadius: 8,
  border: '1px solid var(--border-light)',
  background: 'var(--bg-elevated)',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  fontSize: 14,
  transition: 'all 0.15s',
  flexShrink: 0,
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();

  const { data: profile } = useProfile();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    const refreshToken = getRefreshToken();
    clearTokens();
    queryClient.clear();
    setMenuOpen(false);
    if (refreshToken) {
      auth.logout(refreshToken).catch(() => undefined);
    }
    router.push('/listings');
  };

  // Panel + Favorites navigate to login if unauthenticated
  const handleProtectedNav = (href: string) => {
    setMenuOpen(false);
    if (!profile) {
      window.location.href = `/auth/login?redirect=${encodeURIComponent(href)}`;
    } else {
      router.push(href as Parameters<typeof router.push>[0]);
    }
  };

  const browseActive = pathname === '/listings' || pathname.startsWith('/listings/');
  const dashboardActive = pathname === '/dashboard' || pathname.startsWith('/dashboard');
  const favoritesActive = pathname === '/favorites';

  const navLinkStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
    background: active ? 'var(--bg-elevated)' : 'transparent',
    textDecoration: 'none',
    transition: 'all 0.15s',
    border: `1px solid ${active ? 'var(--border-light)' : 'transparent'}`,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  });

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: scrolled
          ? 'color-mix(in srgb, var(--bg-canvas) 92%, transparent)'
          : 'transparent',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        transition: 'all 0.3s ease',
      }}
    >
      <div className="container-wide">
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>

          {/* Logo */}
          <Link
            href="/"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.4rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
              textDecoration: 'none',
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ color: 'var(--accent)' }}>◆</span>
            <span>Tienda</span>
          </Link>

          {/* Desktop nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="hidden-mobile">
            {/* Browse */}
            <Link href="/listings" style={navLinkStyle(browseActive)}>
              {'Explorar'}
            </Link>

            {/* Panel — always visible, auth-gated */}
            <button onClick={() => handleProtectedNav('/dashboard')} style={navLinkStyle(dashboardActive)}>
              <LayoutDashboard size={13} />
              Panel
            </button>

            {/* Favorites — always visible, auth-gated */}
            <button onClick={() => handleProtectedNav('/favorites')} style={navLinkStyle(favoritesActive)}>
              <Heart size={13} />
              Favoritos
            </button>
          </div>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              style={iconBtn}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Auth (desktop) */}
            {profile ? (
              <Link
                href="/profile"
                className="hidden-mobile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 12px 5px 6px',
                  borderRadius: 8,
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-elevated)',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                }}
              >
                <UserAvatar name={profile.name} size={26} />
                <span style={{ fontSize: 13, color: 'var(--text-primary)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {profile.name.split(' ')[0]}
                </span>
              </Link>
            ) : (
              <div style={{ display: 'flex', gap: 6 }} className="hidden-mobile">
                <Link href="/auth/login" className="btn btn-ghost" style={{ padding: '7px 14px', fontSize: 13 }}>
                  {'Iniciar sesión'}
                </Link>
                <Link href="/auth/register" className="btn btn-primary" style={{ padding: '7px 14px', fontSize: 13 }}>
                  {'Registrarse'}
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ ...iconBtn, display: 'none' }}
              className="show-mobile"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </nav>

        {/* Mobile drawer */}
        {menuOpen && (
          <div style={{ borderTop: '1px solid var(--border)', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Link
              href="/listings"
              onClick={() => setMenuOpen(false)}
              style={{
                padding: '10px 16px', fontSize: 14, color: 'var(--text-primary)',
                textDecoration: 'none', borderRadius: 6,
                background: browseActive ? 'var(--bg-elevated)' : 'transparent',
              }}
            >
              {'Explorar'}
            </Link>

            <button
              onClick={() => handleProtectedNav('/dashboard')}
              style={{
                padding: '10px 16px', fontSize: 14, color: 'var(--text-primary)',
                background: dashboardActive ? 'var(--bg-elevated)' : 'transparent',
                border: 'none', cursor: 'pointer', textAlign: 'left', borderRadius: 6,
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <LayoutDashboard size={14} /> Panel
            </button>

            <button
              onClick={() => handleProtectedNav('/favorites')}
              style={{
                padding: '10px 16px', fontSize: 14, color: 'var(--text-primary)',
                background: favoritesActive ? 'var(--bg-elevated)' : 'transparent',
                border: 'none', cursor: 'pointer', textAlign: 'left', borderRadius: 6,
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <Heart size={14} /> Favoritos
            </button>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4, display: 'flex', gap: 8, paddingLeft: 16 }}>
              {profile ? (
                <>
                  <Link href="/profile" className="btn btn-outline" style={{ fontSize: 13 }} onClick={() => setMenuOpen(false)}>
                    {profile.name.split(' ')[0]} · Perfil
                  </Link>
                  <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={handleLogout}>
                    Salir
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => setMenuOpen(false)}>
                    {'Iniciar sesión'}
                  </Link>
                  <Link href="/auth/register" className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => setMenuOpen(false)}>
                    {'Registrarse'}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .hidden-mobile { display: none !important; }
          .show-mobile   { display: flex !important; }
        }
      `}</style>
    </header>
  );
}
