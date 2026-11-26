import { useState } from 'react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import type { UserProfile } from '../types';
import type { ThemeMode } from '../utils/theme';

export type AppView = 'armada' | 'pelanggan' | 'pemilik' | 'admin';

interface NavbarProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  user: UserProfile | null;
  onSignIn: () => void;
  onSignOut: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export function Navbar({
  activeView,
  onNavigate,
  user,
  onSignIn,
  onSignOut,
  theme,
  onToggleTheme,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: Array<{ id: AppView; label: string }> = [
    { id: 'armada', label: 'Armada' },
    { id: 'pelanggan', label: 'Pelanggan' },
    { id: 'pemilik', label: 'Pemilik Mobil' },
    { id: 'admin', label: 'Admin' },
  ];

  const handleSelect = (view: AppView) => {
    onNavigate(view);
    setMobileOpen(false);
  };

  const isDark = theme === 'dark';

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            handleSelect('armada');
          }}
          className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
        >
          NusaDrive
        </a>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav aria-label="Navigasi utama" className="hidden md:flex items-center gap-7">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                  isActive
                    ? 'text-blue-700 dark:text-blue-400 border-blue-700 dark:border-blue-400'
                    : 'text-slate-600 dark:text-slate-300 border-transparent hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Theme Toggle + Single primary action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            data-testid="theme-toggle"
            aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
            aria-pressed={isDark}
            title={isDark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
            onClick={onToggleTheme}
            className="inline-flex items-center justify-center w-10 h-10 md:w-10 md:h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {user ? (
            <button
              type="button"
              onClick={onSignOut}
              className="hidden md:inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Keluar ({user.name.split(' ')[0]})
            </button>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className="hidden md:inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Masuk Akun
            </button>
          )}

          <button
            type="button"
            aria-label={mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              className={`w-full text-left px-3 min-h-[44px] flex items-center text-sm font-medium rounded-lg ${
                activeView === item.id
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            {user ? (
              <button
                type="button"
                onClick={() => {
                  onSignOut();
                  setMobileOpen(false);
                }}
                className="w-full min-h-[44px] px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg text-center"
              >
                Keluar ({user.name})
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onSignIn();
                  setMobileOpen(false);
                }}
                className="w-full min-h-[44px] px-4 py-2 text-sm font-medium text-white bg-blue-700 dark:bg-blue-600 rounded-lg text-center"
              >
                Masuk dengan Google
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
