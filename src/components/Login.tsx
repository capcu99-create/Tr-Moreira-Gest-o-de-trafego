import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './ui/Toast';
import { LogIn, User, Lock, Loader2, Truck } from 'lucide-react';
import { motion } from 'motion/react';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Supabase Auth requires an email, so we map the nickname to a virtual email
      // This allows using nicknames while still using Supabase Auth
      const virtualEmail = `${username.toLowerCase().trim()}@trmoreira.internal`;
      
      const { error } = await supabase.auth.signInWithPassword({
        email: virtualEmail,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Usuário ou senha incorretos');
        }
        throw error;
      }
      
      showToast('Bem-vindo de volta!', 'success');
    } catch (error: any) {
      showToast(error.message || 'Erro ao fazer login', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-brand-panel border border-brand-border rounded-3xl shadow-2xl p-8"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 mb-4">
            <img 
              src="https://i.imgur.com/nkXSx8R.jpeg" 
              alt="TR Moreira Logo" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-2xl font-bold text-brand-text">TR Moreira</h1>
          <p className="text-brand-text-muted text-sm">Gestão de Transportes</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-2">Usuário / Nickname</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-muted" size={18} />
              <input 
                type="text" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-brand-bg border border-brand-border rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary text-brand-text transition-all"
                placeholder="Digite seu usuário"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-2">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-muted" size={18} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-brand-bg border border-brand-border rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary text-brand-text transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-brand-primary text-white rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <LogIn size={20} />
                <span>Entrar no Sistema</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-brand-border text-center">
          <p className="text-[10px] text-brand-text-muted uppercase tracking-widest">
            Acesso Restrito a Colaboradores
          </p>
        </div>
      </motion.div>
    </div>
  );
}
