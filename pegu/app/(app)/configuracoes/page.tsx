'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getSettings, updateSettings } from '@/lib/services/settings';
import { useToast } from '@/components/ui/toast';

export default function ConfiguracoesPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [initialBalance, setInitialBalance] = useState('0');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      setEmail(userData.user?.email ?? '');
      const settings = await getSettings();
      setDisplayName(settings.display_name ?? '');
      setInitialBalance(String(settings.initial_balance));
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings({ display_name: displayName, initial_balance: Number(initialBalance) || 0 });
      showToast('Configurações salvas.');
    } catch {
      showToast('Não foi possível salvar as configurações.', 'error');
    }
    setSaving(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  if (loading) {
    return <div className="h-64 bg-base-800 rounded-card animate-pulse" />;
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="font-display text-xl font-semibold text-ink-100">Configurações</h1>

      <form onSubmit={handleSave} className="card p-6 space-y-4">
        <div>
          <label className="label" htmlFor="cname">Nome do usuário</label>
          <input id="cname" className="input-field" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="cemail">E-mail</label>
          <input id="cemail" className="input-field opacity-60" value={email} disabled />
        </div>
        <div>
          <label className="label" htmlFor="cbalance">Saldo inicial (R$)</label>
          <input id="cbalance" type="number" step="0.01" className="input-field" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} />
          <p className="text-xs text-ink-500 mt-1.5">Usado no cálculo do valor disponível: saldo inicial + vendas recebidas − gastos.</p>
        </div>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Salvar alterações'}</button>
      </form>

      <div className="card p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-ink-100">Sair da conta</p>
          <p className="text-xs text-ink-500 mt-0.5">Você será desconectado deste dispositivo.</p>
        </div>
        <button onClick={handleLogout} className="btn-danger-ghost border border-negative-500/30">Sair</button>
      </div>
    </div>
  );
}
