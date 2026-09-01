'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import clsx from 'clsx';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/estoque', label: 'Estoque' },
  { href: '/gastos', label: 'Gastos' },
  { href: '/vendas', label: 'Vendas' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const NavLinks = (
    <nav className="flex-1 flex flex-col gap-1 mt-2">
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={clsx(
              'px-3.5 py-2.5 rounded-control text-sm transition-colors',
              active
                ? 'bg-accent-500/15 text-accent-400 font-medium'
                : 'text-ink-300 hover:bg-base-700/60 hover:text-ink-100'
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-56 shrink-0 h-screen sticky top-0 border-r border-base-600/60 bg-base-900 px-4 py-6">
        <div className="flex items-center gap-2.5 px-1">
          <div className="w-8 h-8 rounded-control bg-accent-500 flex items-center justify-center text-white font-semibold text-sm">P</div>
          <span className="font-display text-ink-100 font-semibold tracking-tight">PEGU</span>
        </div>
        {NavLinks}
        <div className="border-t border-base-600/60 pt-3 mt-3 flex flex-col gap-1">
          <Link href="/configuracoes" className="px-3.5 py-2.5 rounded-control text-sm text-ink-300 hover:bg-base-700/60 hover:text-ink-100 transition-colors">
            Configurações
          </Link>
          <button onClick={handleLogout} className="text-left px-3.5 py-2.5 rounded-control text-sm text-ink-500 hover:bg-base-700/60 hover:text-negative-400 transition-colors">
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 border-b border-base-600/60 bg-base-900">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-control bg-accent-500 flex items-center justify-center text-white font-semibold text-xs">P</div>
          <span className="font-display text-ink-100 font-semibold">PEGU</span>
        </div>
        <button
          aria-label="Abrir menu"
          onClick={() => setMobileOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-control hover:bg-base-700/60"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 4.5H16M2 9H16M2 13.5H16" stroke="#B8C0CC" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-base-900 border-r border-base-600/60 px-4 py-6 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-control bg-accent-500 flex items-center justify-center text-white font-semibold text-sm">P</div>
                <span className="font-display text-ink-100 font-semibold tracking-tight">PEGU</span>
              </div>
              <button aria-label="Fechar menu" onClick={() => setMobileOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-control hover:bg-base-700/60">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M13 1L1 13" stroke="#B8C0CC" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            {NavLinks}
            <div className="border-t border-base-600/60 pt-3 mt-3 flex flex-col gap-1">
              <Link href="/configuracoes" onClick={() => setMobileOpen(false)} className="px-3.5 py-2.5 rounded-control text-sm text-ink-300 hover:bg-base-700/60 hover:text-ink-100">
                Configurações
              </Link>
              <button onClick={handleLogout} className="text-left px-3.5 py-2.5 rounded-control text-sm text-ink-500 hover:bg-base-700/60 hover:text-negative-400">
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
