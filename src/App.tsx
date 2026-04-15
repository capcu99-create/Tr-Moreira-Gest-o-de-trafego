import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { TripList } from './components/TripList';
import { FinancialView } from './components/FinancialView';
import { IdentificationView } from './components/IdentificationView';
import { CalendarView } from './components/CalendarView';
import { DebtView } from './components/DebtView';
import { FleetPuzzleView } from './components/FleetPuzzleView';
import { Login } from './components/Login';
import { Search, Bell, User, Menu, X, AlertTriangle, Database, Sun, Moon, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ToastProvider } from './components/ui/Toast';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsAuthReady(true);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthReady(true);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} />;
      case 'puzzle':
        return <FleetPuzzleView />;
      case 'fretes_ida':
        return <TripList type="ida" />;
      case 'fretes_volta':
        return <TripList type="volta" />;
      case 'financeiro':
      case 'dre':
        return <FinancialView />;
      case 'drivers':
      case 'trucks':
        return <IdentificationView defaultTab={activeTab as 'drivers' | 'trucks'} />;
      case 'cronograma':
        return <CalendarView />;
      case 'dividas':
        return <DebtView />;
      default:
        return (
          <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 capitalize">
              {activeTab.replace('_', ' ')}
            </h2>
            <div className="flex items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
              Módulo em desenvolvimento...
            </div>
          </div>
        );
    }
  };

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Visão Geral';
      case 'puzzle': return 'Gestão de Tráfego';
      case 'fretes_ida': return 'Fretes Ida';
      case 'fretes_volta': return 'Fretes Volta';
      case 'financeiro': return 'Financeiro';
      case 'dre': return 'DRE / Lucros';
      case 'drivers': return 'Motoristas';
      case 'trucks': return 'Frotas';
      case 'cronograma': return 'Cronograma';
      case 'dividas': return 'Dívidas';
      default: return tab.replace('_', ' ').toUpperCase();
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (isSupabaseConfigured && !session) {
    return (
      <ToastProvider>
        <Login />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-brand-bg flex flex-col md:flex-row overflow-hidden font-sans text-brand-text">
        {/* Sidebar (Desktop) */}
        <div className="hidden md:block w-[260px] shrink-0 h-screen sticky top-0">
          <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
              />
              <motion.div 
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 w-[280px] bg-brand-dark z-50 md:hidden shadow-2xl flex flex-col"
              >
                <div className="absolute top-4 right-4 z-10">
                  <button onClick={() => setIsMobileMenuOpen(false)} className="text-white/60 hover:text-white p-2">
                    <X size={24} />
                  </button>
                </div>
                <Navigation 
                  activeTab={activeTab} 
                  onTabChange={(tab) => {
                    setActiveTab(tab);
                    setIsMobileMenuOpen(false);
                  }} 
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
        
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Header */}
          <header className="flex items-center justify-between px-4 md:px-8 py-4 bg-[var(--header-bg)] border-b border-brand-border sticky top-0 z-30 transition-colors duration-200">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 hover:bg-brand-bg rounded-lg transition-colors text-brand-text"
              >
                <Menu size={20} />
              </button>
              <h1 className="text-lg md:text-2xl font-bold text-brand-text tracking-tight">
                {getTabTitle(activeTab)}
              </h1>
            </div>
            
            <div className="flex items-center gap-3 md:gap-6">
              <button 
                onClick={toggleDarkMode}
                className="p-2.5 bg-brand-bg border border-brand-border rounded-xl text-brand-text hover:bg-brand-primary/10 hover:border-brand-primary/30 transition-all"
                title={isDarkMode ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {!isSupabaseConfigured ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-red-100 animate-pulse">
                  <AlertTriangle size={14} />
                  <span>Desconectado</span>
                </div>
              ) : (
                <div className="hidden lg:flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-brand-text-muted">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <span>Sistema Online</span>
                </div>
              )}
              
              <div className="flex items-center gap-3 pl-3 md:pl-6 border-l border-brand-border">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-brand-text leading-none mb-1">
                    {session?.user?.email?.split('@')[0] || 'Administrador'}
                  </p>
                  <p className="text-[10px] text-brand-text-muted font-medium">TR Moreira</p>
                </div>
                <button 
                  onClick={() => supabase.auth.signOut()}
                  className="w-8 h-8 md:w-10 md:h-10 bg-brand-dark rounded-xl flex items-center justify-center text-white shadow-lg hover:bg-red-600 transition-colors group"
                  title="Sair do Sistema"
                >
                  <LogOut size={18} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
            {!isSupabaseConfigured && activeTab !== 'dashboard' && (
              <div className="mb-8 p-6 bg-orange-50 border border-orange-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 text-orange-800">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="shrink-0 mt-1" />
                  <div className="text-sm">
                    <p className="font-bold text-lg mb-1">Banco de Dados não conectado!</p>
                    <p className="opacity-90 leading-relaxed">
                      Para salvar e editar dados, você precisa configurar o Supabase.<br/>
                      Vá em <b>Settings &gt; Secrets</b> e adicione as chaves <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code>.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
