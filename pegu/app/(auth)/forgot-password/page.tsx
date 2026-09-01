'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center space-y-3">
        <h2 className="text-base font-medium text-ink-100">Verifique seu e-mail</h2>
        <p className="text-sm text-ink-300">Se {email} estiver cadastrado, você receberá um link para redefinir a senha.</p>
        <Link href="/login" className="btn-secondary inline-flex mt-2">Voltar para o login</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-base font-medium text-ink-100 mb-1">Redefinir senha</h2>
      <p className="text-sm text-ink-500 mb-4">Informe seu e-mail para receber o link de redefinição.</p>

      <div>
        <label className="label" htmlFor="email">E-mail</label>
        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="voce@empresa.com" />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
        {loading ? 'Enviando...' : 'Enviar link'}
      </button>

      <p className="text-sm text-center text-ink-500 pt-2">
        <Link href="/login" className="text-accent-400 hover:text-accent-300 transition-colors">Voltar para o login</Link>
      </p>
    </form>
  );
}
