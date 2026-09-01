'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const supabase = createClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    setLoading(false);

    if (error) {
      setError(error.message === 'User already registered' ? 'Este e-mail já está cadastrado.' : 'Não foi possível criar a conta.');
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="text-center space-y-3">
        <h2 className="text-base font-medium text-ink-100">Confira seu e-mail</h2>
        <p className="text-sm text-ink-300">
          Enviamos um link de confirmação para <span className="text-ink-100">{email}</span>. Confirme para poder entrar no PEGU.
        </p>
        <Link href="/login" className="btn-secondary inline-flex mt-2">Voltar para o login</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-base font-medium text-ink-100 mb-5">Criar sua conta</h2>

      <div>
        <label className="label" htmlFor="name">Nome</label>
        <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Seu nome" />
      </div>

      <div>
        <label className="label" htmlFor="email">E-mail</label>
        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="voce@empresa.com" />
      </div>

      <div>
        <label className="label" htmlFor="password">Senha</label>
        <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="Mínimo 6 caracteres" />
      </div>

      {error && (
        <p className="text-sm text-negative-400 bg-negative-500/10 border border-negative-500/20 rounded-control px-3 py-2">{error}</p>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
        {loading ? 'Criando conta...' : 'Criar conta'}
      </button>

      <p className="text-sm text-center text-ink-500 pt-2">
        Já tem conta?{' '}
        <Link href="/login" className="text-accent-400 hover:text-accent-300 transition-colors">Entrar</Link>
      </p>
    </form>
  );
}
