import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  MapPin, 
  Calendar, 
  DollarSign, 
  MoreHorizontal,
  Truck as TruckIcon,
  Trash2,
  Edit2,
  ArrowRight,
  ChevronRight,
  Calculator
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { dbService } from '../lib/dbService';
import { Trip, Driver, Truck as TruckType } from '../types';
import { Modal } from './ui/Modal';
import { ConfirmModal } from './ui/ConfirmModal';
import { TripExpenseModal } from './TripExpenseModal';
import { useTrips, useDrivers, useTrucks } from '../lib/hooks';
import { useToast } from './ui/Toast';

interface TripListProps {
  type: 'ida' | 'volta';
}

export function TripList({ type }: TripListProps) {
  const { trips, loading, refresh } = useTrips(type);
  const { drivers } = useDrivers();
  const { trucks } = useTrucks();
  const { showToast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expenseTrip, setExpenseTrip] = useState<Trip | null>(null);

  // Sincronizar o frete selecionado para gastos caso os dados mudem (ex: após editar KM)
  React.useEffect(() => {
    if (expenseTrip) {
      const updated = trips.find(t => t.id === expenseTrip.id);
      if (updated) setExpenseTrip(updated as Trip);
    }
  }, [trips]);

  const handleSaveTrip = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const tripData = {
      driver_id: (formData.get('driver_id') as string) || null,
      truck_id: (formData.get('truck_id') as string) || null,
      trailer_id: (formData.get('trailer_id') as string) || null,
      origin: formData.get('origin') as string,
      destination: formData.get('destination') as string,
      cte: formData.get('cte') as string,
      loading_date: formData.get('loading_date') as string,
      cte_date: (formData.get('cte_date') as string) || null,
      delivery_date: (formData.get('delivery_date') as string) || null,
      km_initial: Number(formData.get('km_initial')) || 0,
      km_final: Number(formData.get('km_final')) || 0,
      freight_value: Number(formData.get('freight_value')),
      advance_value: Number(formData.get('advance_value')),
      status: formData.get('status') as any,
      type: type
    };

    // Remove any fields that are literally the string "undefined"
    Object.keys(tripData).forEach(key => {
      if ((tripData as any)[key] === 'undefined') {
        (tripData as any)[key] = null;
      }
    });

    try {
      if (editingTrip) {
        await dbService.updateTrip(editingTrip.id, tripData);
        showToast('Frete atualizado com sucesso!', 'success');
      } else {
        await dbService.addTrip(tripData);
        showToast('Frete cadastrado com sucesso!', 'success');
      }
      setIsModalOpen(false);
      setEditingTrip(null);
      refresh();
    } catch (error: any) {
      console.error('Erro ao salvar frete:', error);
      showToast(error.message || 'Erro ao salvar frete', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await dbService.deleteTrip(deleteId);
      showToast('Frete excluído com sucesso!', 'success');
      refresh();
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      showToast(error.message || 'Erro ao excluir', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  const filteredTrips = trips.filter(trip => 
    trip.drivers?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.cte.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-gray-200 rounded-xl animate-pulse w-full max-w-md"></div>
        <div className="panel h-96 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar por motorista, destino ou CTE..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-primary outline-none transition-all shadow-sm"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-brand-border rounded-xl text-brand-text-muted hover:bg-gray-50 transition-all font-bold text-xs uppercase tracking-wider">
            <Filter size={16} />
            <span>Filtros</span>
          </button>
          <button 
            onClick={() => { setEditingTrip(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-primary text-white rounded-xl hover:bg-blue-600 shadow-lg shadow-blue-200 transition-all font-bold text-xs uppercase tracking-wider"
          >
            <Plus size={16} />
            <span>Novo Frete</span>
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block panel overflow-hidden">
        <div className="panel-header flex items-center justify-between">
          <span>Listagem de Fretes ({type === 'ida' ? 'Ida' : 'Volta'})</span>
          <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">{filteredTrips.length} registros</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-brand-border bg-[var(--table-header-bg)]">
                <th className="px-6 py-4 text-[11px] font-bold text-brand-text-muted uppercase tracking-widest">Motorista / Veículo</th>
                <th className="px-6 py-4 text-[11px] font-bold text-brand-text-muted uppercase tracking-widest">Rota</th>
                <th className="px-6 py-4 text-[11px] font-bold text-brand-text-muted uppercase tracking-widest">CTE / Data</th>
                <th className="px-6 py-4 text-[11px] font-bold text-brand-text-muted uppercase tracking-widest text-right">Valor Frete</th>
                <th className="px-6 py-4 text-[11px] font-bold text-brand-text-muted uppercase tracking-widest">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {filteredTrips.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-brand-text-muted italic">Nenhum frete encontrado</td></tr>
              ) : (
                filteredTrips.map((trip, index) => (
                  <motion.tr 
                    key={trip.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-brand-primary/5 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-dark rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm">
                          {trip.drivers?.name[0]}
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-brand-text">{trip.drivers?.name}</p>
                          <p className="text-[11px] text-brand-text-muted font-medium">{trip.trucks?.plate} • {trip.trucks?.model}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-[13px] font-medium text-brand-text">
                        <span>{trip.origin}</span>
                        <ArrowRight size={14} className="text-brand-text-muted" />
                        <span>{trip.destination}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-[13px] font-bold text-brand-text">#{trip.cte}</p>
                        <p className="text-[11px] text-brand-text-muted font-medium">{formatDate(trip.loading_date)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-[14px] font-bold text-brand-text">{formatCurrency(trip.freight_value)}</p>
                      {trip.advance_value > 0 && (
                        <p className="text-[10px] text-emerald-600 font-bold">-{formatCurrency(trip.advance_value)} (Adiant.)</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-block",
                        trip.status === 'paid' ? "bg-emerald-100 text-emerald-700" : 
                        trip.status === 'completed' ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                      )}>
                        {trip.status === 'paid' ? 'Pago' : trip.status === 'completed' ? 'Entregue' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end md:opacity-0 md:group-hover:opacity-100 transition-opacity gap-1">
                        <button 
                          onClick={() => setExpenseTrip(trip as any)}
                          className="p-2 text-brand-text-muted hover:text-emerald-500 hover:bg-white rounded-lg transition-all"
                          title="Gastos da Viagem"
                        >
                          <Calculator size={14} />
                        </button>
                        <button 
                          onClick={() => { setEditingTrip(trip); setIsModalOpen(true); }}
                          className="p-2 text-brand-text-muted hover:text-brand-primary hover:bg-white rounded-lg transition-all"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => setDeleteId(trip.id)}
                          className="p-2 text-brand-text-muted hover:text-red-500 hover:bg-white rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile List */}
      <div className="md:hidden space-y-4">
        {filteredTrips.map((trip) => (
          <div key={trip.id} className="panel p-4 space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-dark rounded-xl flex items-center justify-center text-white font-bold">
                  {trip.drivers?.name[0]}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{trip.drivers?.name}</p>
                  <p className="text-xs text-brand-text-muted">{trip.trucks?.plate}</p>
                </div>
              </div>
              <span className={cn(
                "px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider",
                trip.status === 'paid' ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
              )}>
                {trip.status === 'paid' ? 'Pago' : 'Pendente'}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-3 border-y border-brand-border">
              <div className="text-center flex-1">
                <p className="text-[10px] text-brand-text-muted uppercase font-bold mb-1">Origem</p>
                <p className="text-xs font-bold text-gray-900">{trip.origin}</p>
              </div>
              <ArrowRight size={16} className="text-brand-text-muted mx-4" />
              <div className="text-center flex-1">
                <p className="text-[10px] text-brand-text-muted uppercase font-bold mb-1">Destino</p>
                <p className="text-xs font-bold text-gray-900">{trip.destination}</p>
              </div>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] text-brand-text-muted font-bold uppercase">CTE #{trip.cte}</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(trip.freight_value)}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setExpenseTrip(trip as any)}
                  className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"
                >
                  <Calculator size={16} />
                </button>
                <button 
                  onClick={() => { setEditingTrip(trip); setIsModalOpen(true); }}
                  className="p-2 bg-gray-50 text-brand-text-muted rounded-lg"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => setDeleteId(trip.id)}
                  className="p-2 bg-red-50 text-red-500 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trip Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingTrip ? 'Editar Frete' : 'Novo Frete'}
      >
        <form onSubmit={handleSaveTrip} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Motorista</label>
              <select name="driver_id" defaultValue={editingTrip?.driver_id} required className="w-full px-4 py-2.5 border border-brand-border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm">
                <option value="">Selecionar motorista...</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Cavalo (Placa)</label>
              <select name="truck_id" defaultValue={editingTrip?.truck_id} required className="w-full px-4 py-2.5 border border-brand-border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm">
                <option value="">Selecionar cavalo...</option>
                {trucks.filter(t => t.type === 'cavalo').map(t => <option key={t.id} value={t.id}>{t.plate} - {t.model}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Carreta (Placa)</label>
              <select name="trailer_id" defaultValue={editingTrip?.trailer_id} className="w-full px-4 py-2.5 border border-brand-border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm">
                <option value="">Selecionar carreta...</option>
                {trucks.filter(t => t.type === 'carreta').map(t => <option key={t.id} value={t.id}>{t.plate} - {t.trailer_category === 'frigorifica' ? 'Frigorífica' : 'Normal'}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Origem</label>
              <input name="origin" defaultValue={editingTrip?.origin} required className="w-full px-4 py-2.5 border border-brand-border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm" placeholder="Ex: Manaus" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Destino</label>
              <input name="destination" defaultValue={editingTrip?.destination} required className="w-full px-4 py-2.5 border border-brand-border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm" placeholder="Ex: São Paulo" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">CTE</label>
              <input name="cte" defaultValue={editingTrip?.cte} required className="w-full px-4 py-2.5 border border-brand-border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm" placeholder="00000" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Data Carreg.</label>
              <input type="date" name="loading_date" defaultValue={editingTrip?.loading_date} required className="w-full px-4 py-2.5 border border-brand-border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Data Emissão CTE</label>
              <input type="date" name="cte_date" defaultValue={editingTrip?.cte_date} className="w-full px-4 py-2.5 border border-brand-border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Data Entrega</label>
              <input type="date" name="delivery_date" defaultValue={editingTrip?.delivery_date} className="w-full px-4 py-2.5 border border-brand-border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">KM Inicial</label>
              <input type="number" name="km_initial" defaultValue={editingTrip?.km_initial || 0} className="w-full px-4 py-2.5 border border-brand-border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm" placeholder="0" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">KM Final</label>
              <input type="number" name="km_final" defaultValue={editingTrip?.km_final || 0} className="w-full px-4 py-2.5 border border-brand-border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm" placeholder="0" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Status</label>
              <select name="status" defaultValue={editingTrip?.status || 'pending'} className="w-full px-4 py-2.5 border border-brand-border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm">
                <option value="pending">Pendente</option>
                <option value="completed">Entregue</option>
                <option value="paid">Pago</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Valor Frete</label>
              <input type="number" step="0.01" name="freight_value" defaultValue={editingTrip?.freight_value} required className="w-full px-4 py-2.5 border border-brand-border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Adiantamento</label>
              <input type="number" step="0.01" name="advance_value" defaultValue={editingTrip?.advance_value || 0} className="w-full px-4 py-2.5 border border-brand-border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm" placeholder="0.00" />
            </div>
          </div>

          <button 
            disabled={isSubmitting}
            className="w-full bg-brand-primary text-white font-bold py-3.5 rounded-xl hover:bg-blue-600 transition-all mt-4 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              editingTrip ? 'Salvar Alterações' : 'Cadastrar Frete'
            )}
          </button>
        </form>
      </Modal>

      <ConfirmModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir este frete? Esta ação não pode ser desfeita."
        variant="danger"
      />

      {expenseTrip && (
        <TripExpenseModal 
          isOpen={!!expenseTrip}
          onClose={() => setExpenseTrip(null)}
          trip={expenseTrip}
          onUpdateTrip={refresh}
        />
      )}
    </div>
  );
}
