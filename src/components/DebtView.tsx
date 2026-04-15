import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  Trash2, 
  Edit2,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { dbService } from '../lib/dbService';
import { Modal } from './ui/Modal';
import { ConfirmModal } from './ui/ConfirmModal';
import { useDebts } from '../lib/hooks';
import { useToast } from './ui/Toast';

export function DebtView() {
  const { debts, loading, refresh } = useDebts();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const installments_count = Number(formData.get('installments_count'));
    const installments_paid = Number(formData.get('installments_paid'));
    const total_value = Number(formData.get('total_value'));
    const due_date = formData.get('due_date') as string;
    const person_name = formData.get('person_name') as string;
    const type = formData.get('type') as 'pagar' | 'receber';
    
    const data = {
      person_name,
      total_value,
      installments_count,
      installments_paid,
      due_date,
      type,
      status: installments_paid >= installments_count ? 'paid' : 'pending' as const
    };

    try {
      if (editingDebt?.id) {
        await dbService.updateDebt(editingDebt.id, data);
        showToast('Lançamento atualizado!', 'success');
      } else {
        await dbService.addDebt(data);
        showToast('Lançamento cadastrado!', 'success');
      }
      setIsModalOpen(false);
      setEditingDebt(null);
      refresh();
    } catch (error: any) {
      console.error('Erro ao salvar lançamento:', error);
      showToast(error.message || 'Erro ao salvar lançamento', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayInstallment = async (debt: any) => {
    if (debt.installments_paid >= debt.installments_count) return;

    const nextPaid = debt.installments_paid + 1;
    const isPaid = nextPaid >= debt.installments_count;
    
    // Calculate next due date
    const currentDate = new Date(debt.due_date + 'T12:00:00');
    const nextDate = new Date(currentDate);
    nextDate.setMonth(currentDate.getMonth() + 1);
    
    // Handle edge cases like 31st
    if (nextDate.getDate() !== currentDate.getDate()) {
      nextDate.setDate(0);
    }

    try {
      await dbService.updateDebt(debt.id, {
        ...debt,
        installments_paid: nextPaid,
        due_date: isPaid ? debt.due_date : nextDate.toISOString().split('T')[0],
        status: isPaid ? 'paid' : 'pending'
      });
      showToast(isPaid ? 'Dívida quitada!' : 'Parcela confirmada!', 'success');
      refresh();
    } catch (error: any) {
      showToast('Erro ao atualizar parcela', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await dbService.deleteDebt(deleteId);
      showToast('Lançamento excluído', 'success');
      refresh();
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      showToast(error.message || 'Erro ao excluir', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  const filteredDebts = debts.filter(d => 
    d.person_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalToPay = debts.filter(d => d.type === 'pagar' && d.status === 'pending').reduce((acc, d) => acc + (d.total_value || 0), 0);
  const totalToReceive = debts.filter(d => d.type === 'receber' && d.status === 'pending').reduce((acc, d) => acc + (d.total_value || 0), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="panel h-32 animate-pulse bg-gray-50"></div>
          <div className="panel h-32 animate-pulse bg-gray-50"></div>
        </div>
        <div className="panel h-96 animate-pulse bg-gray-50"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="panel p-6 border-l-4 border-l-red-500"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
              <TrendingDown size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1">Total a Pagar (Pendentes)</p>
              <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(totalToPay)}</h3>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="panel p-6 border-l-4 border-l-brand-primary"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1">Total a Receber (Pendentes)</p>
              <h3 className="text-2xl font-bold text-brand-text">{formatCurrency(totalToReceive)}</h3>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar por credor/devedor..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-primary outline-none transition-all shadow-sm"
          />
        </div>
        
        <button 
          onClick={() => { setEditingDebt(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-6 py-2.5 bg-brand-primary text-white rounded-xl hover:bg-brand-primary/90 shadow-lg shadow-brand-primary/20 transition-all font-bold text-xs uppercase tracking-wider"
        >
          <Plus size={16} />
          <span>Novo Lançamento</span>
        </button>
      </div>

      {/* Grid of Debts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredDebts.length === 0 ? (
            <div className="col-span-full py-20 text-center panel">
              <p className="text-brand-text-muted font-medium">Nenhum lançamento encontrado</p>
            </div>
          ) : (
            filteredDebts.map((debt, index) => (
              <motion.div
                key={debt.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "panel group hover:border-brand-primary transition-all duration-300 overflow-hidden border-l-4",
                  debt.type === 'pagar' ? "border-l-red-500" : "border-l-brand-primary"
                )}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-brand-text truncate">{debt.person_name}</h4>
                      <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">
                        {debt.type === 'pagar' ? 'A Pagar' : 'A Receber'}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setEditingDebt(debt); setIsModalOpen(true); }}
                        className="p-2 text-brand-text-muted hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-all"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => setDeleteId(debt.id)}
                        className="p-2 text-brand-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <p className="text-[10px] text-brand-text-muted font-bold uppercase mb-1">Valor Total</p>
                      <p className={cn(
                        "text-xl font-bold",
                        debt.type === 'pagar' ? "text-red-600" : "text-brand-primary"
                      )}>
                        {formatCurrency(debt.total_value)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-brand-text-muted font-bold uppercase mb-1">Vencimento</p>
                      <p className="text-sm font-bold text-brand-text">{formatDate(debt.due_date)}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-brand-text-muted">Progresso de Pagamento</span>
                      <span className="text-brand-text">{debt.installments_paid}/{debt.installments_count} Parcelas</span>
                    </div>
                    <div className="w-full h-2 bg-brand-bg rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(debt.installments_paid / debt.installments_count) * 100}%` }}
                        className={cn(
                          "h-full transition-all",
                          debt.type === 'pagar' ? "bg-red-500" : "bg-brand-primary"
                        )}
                      />
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-brand-border flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {debt.status === 'paid' ? (
                        <>
                          <CheckCircle2 size={14} className="text-emerald-500" />
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Quitado</span>
                        </>
                      ) : (
                        <button 
                          onClick={() => handlePayInstallment(debt)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-bg hover:bg-brand-primary/10 text-brand-text hover:text-brand-primary rounded-lg transition-all border border-brand-border"
                        >
                          <CheckCircle2 size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Pagar Parcela</span>
                        </button>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-brand-text-muted group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingDebt?.id ? 'Editar Lançamento' : 'Novo Lançamento'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Nome (Credor/Devedor)</label>
            <input name="person_name" defaultValue={editingDebt?.person_name} required className="w-full px-4 py-2.5 border border-brand-border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm" placeholder="Ex: Posto de Combustível X" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Valor Total</label>
              <input type="number" step="0.01" name="total_value" defaultValue={editingDebt?.total_value} required className="w-full px-4 py-2.5 border border-brand-border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Vencimento</label>
              <input type="date" name="due_date" defaultValue={editingDebt?.due_date} required className="w-full px-4 py-2.5 border border-brand-border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Total Parcelas</label>
              <input type="number" name="installments_count" defaultValue={editingDebt?.installments_count || 1} required className="w-full px-4 py-2.5 border border-brand-border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Parcelas Pagas</label>
              <input type="number" name="installments_paid" defaultValue={editingDebt?.installments_paid || 0} required className="w-full px-4 py-2.5 border border-brand-border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Tipo</label>
            <select name="type" defaultValue={editingDebt?.type || 'pagar'} className="w-full px-4 py-2.5 border border-brand-border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary bg-white text-sm">
              <option value="pagar">A Pagar (Dívida)</option>
              <option value="receber">A Receber (Crédito)</option>
            </select>
          </div>

          <button 
            disabled={isSubmitting}
            className="w-full bg-brand-primary text-white font-bold py-3.5 rounded-xl hover:bg-blue-600 transition-all mt-4 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              editingDebt?.id ? 'Salvar Alterações' : 'Cadastrar Lançamento'
            )}
          </button>
        </form>
      </Modal>

      <ConfirmModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir este lançamento financeiro? Esta ação não pode ser desfeita."
        variant="danger"
      />
    </div>
  );
}
