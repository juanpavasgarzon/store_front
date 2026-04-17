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
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sun, Moon, X, Menu, LayoutDashboard, Heart } from 'lucide-react';

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

  const navLinkClass = (active: boolean) =>
    cn(
      'flex items-center gap-[5px] px-[14px] py-[6px] rounded-md text-[13px] font-medium transition-all duration-150 no-underline cursor-pointer border',
      active
        ? 'text-foreground bg-[var(--bg-elevated)] border-[var(--border-light)]'
        : 'text-muted-foreground bg-transparent border-transparent hover:text-foreground hover:bg-[var(--bg-elevated)]',
    );

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-border backdrop-blur-[16px]'
          : 'border-b border-transparent',
      )}
      style={{
        background: scrolled
          ? 'color-mix(in srgb, var(--bg-canvas) 92%, transparent)'
          : 'transparent',
      }}
    >
      <div className="container-wide">
        <nav className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link
            href="/"
            className="no-underline flex items-center gap-1.5 tracking-[-0.02em]"
            style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 500, color: 'var(--text-primary)' }}
          >
            <span className="text-primary">◆</span>
            <span>Pavas Marketplace</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden-mobile flex items-center gap-1">
            <Link href="/listings" className={navLinkClass(browseActive)}>
              {'Explorar'}
            </Link>

            <button
              onClick={() => handleProtectedNav('/dashboard')}
              className={navLinkClass(dashboardActive)}
            >
              <LayoutDashboard size={13} />
              Panel
            </button>

            <button
              onClick={() => handleProtectedNav('/favorites')}
              className={navLinkClass(favoritesActive)}
            >
              <Heart size={13} />
              Favoritos
            </button>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              className="bg-[var(--bg-elevated)] text-muted-foreground"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </Button>

            {/* Auth (desktop) */}
            {profile ? (
              <Link
                href="/profile"
                className="hidden-mobile flex items-center gap-2 px-3 py-[5px] rounded-lg border border-[var(--border-light)] bg-[var(--bg-elevated)] no-underline transition-all duration-150 hover:border-[var(--border-accent)]"
              >
                <UserAvatar name={profile.name} size={26} />
                <span
                  className="text-[13px] text-foreground max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap"
                >
                  {profile.name.split(' ')[0]}
                </span>
              </Link>
            ) : (
              <div className="hidden-mobile flex gap-1.5">
                <Link href="/auth/login" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
                  Iniciar sesión
                </Link>
                <Link href="/auth/register" className={cn(buttonVariants({ size: 'sm' }))}>
                  Registrarse
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setMenuOpen(!menuOpen)}
              className="show-mobile hidden border border-[var(--border-light)] bg-[var(--bg-elevated)]"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={16} /> : <Menu size={16} />}
            </Button>
          </div>
        </nav>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="border-t border-border py-4 flex flex-col gap-1">
            <Link
              href="/listings"
              onClick={() => setMenuOpen(false)}
              className={cn(
                'px-4 py-2.5 text-[14px] no-underline rounded-md text-foreground transition-all',
                browseActive ? 'bg-[var(--bg-elevated)]' : 'bg-transparent',
              )}
            >
              {'Explorar'}
            </Link>

            <button
              onClick={() => handleProtectedNav('/dashboard')}
              className={cn(
                'px-4 py-2.5 text-[14px] text-foreground rounded-md border-none cursor-pointer text-left flex items-center gap-2 transition-all',
                dashboardActive ? 'bg-[var(--bg-elevated)]' : 'bg-transparent',
              )}
            >
              <LayoutDashboard size={14} /> Panel
            </button>

            <button
              onClick={() => handleProtectedNav('/favorites')}
              className={cn(
                'px-4 py-2.5 text-[14px] text-foreground rounded-md border-none cursor-pointer text-left flex items-center gap-2 transition-all',
                favoritesActive ? 'bg-[var(--bg-elevated)]' : 'bg-transparent',
              )}
            >
              <Heart size={14} /> Favoritos
            </button>

            <div className="border-t border-border pt-3 mt-1 flex gap-2 pl-4">
              {profile ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                  >
                    {profile.name.split(' ')[0]} · Perfil
                  </Link>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    Salir
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setMenuOpen(false)}
                    className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setMenuOpen(false)}
                    className={cn(buttonVariants({ size: 'sm' }))}
                  >
                    Registrarse
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
