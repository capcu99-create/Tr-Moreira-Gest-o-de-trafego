import React, { useState } from 'react';
import { useDrivers, useTrucks } from '../lib/hooks';
import { dbService } from '../lib/dbService';
import { useToast } from './ui/Toast';
import { Truck, Users, Link, Unlink, AlertCircle, Box, UserCircle, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function FleetPuzzleView() {
  const { drivers, loading: driversLoading, refresh: refreshDrivers } = useDrivers();
  const { trucks, loading: trucksLoading, refresh: refreshTrucks } = useTrucks();
  const { showToast } = useToast();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleAssignTrailer = async (driverId: string, trailerId: string | null) => {
    if (!driverId || driverId === 'undefined') {
      showToast('Erro: ID do motorista inválido', 'error');
      return;
    }
    
    setIsUpdating(driverId);
    try {
      const finalTrailerId = (trailerId === 'undefined' || !trailerId) ? null : trailerId;
      await dbService.updateDriver(driverId, { current_trailer_id: finalTrailerId });
      showToast('Frota atualizada!', 'success');
      refreshDrivers();
    } catch (error: any) {
      console.error('Erro ao atualizar frota:', error);
      showToast(error.message || 'Erro ao atualizar frota', 'error');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleUpdateInvoice = async (driverId: string, invoice: string) => {
    setIsUpdating(driverId);
    try {
      await dbService.updateDriver(driverId, { current_invoice: invoice });
      showToast('Nota Fiscal atualizada!', 'success');
      refreshDrivers();
    } catch (error: any) {
      console.error('Erro ao atualizar NF:', error);
      showToast(error.message || 'Erro ao atualizar NF', 'error');
    } finally {
      setIsUpdating(null);
    }
  };

  const isLoading = driversLoading || trucksLoading;

  if (isLoading) return <div className="p-8 text-center text-brand-primary animate-pulse">Carregando gestão de tráfego...</div>;

  const availableTrailers = trucks.filter(t => 
    t.type === 'carreta' && 
    !drivers.some(d => d.current_trailer_id === t.id)
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-brand-text">Gestão de Tráfego</h2>
          <p className="text-brand-text-muted">Organize quem está com qual caminhão e carreta</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Assignments */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest flex items-center gap-2">
            <Users size={14} />
            Motoristas e Composições
          </h3>
          
          <div className="grid gap-4">
            {drivers.map(driver => {
              const fixedTruck = trucks.find(t => t.id === driver.truck_id);
              const currentTrailer = trucks.find(t => t.id === driver.current_trailer_id);

              return (
                <motion.div 
                  key={driver.id}
                  layout
                  className="panel p-4 flex flex-col sm:flex-row items-center gap-6 group"
                >
                  {/* Driver Info */}
                  <div className="flex items-center gap-3 min-w-[180px]">
                    <div className="w-10 h-10 bg-brand-dark rounded-xl flex items-center justify-center text-white font-bold overflow-hidden relative">
                      {driver.avatar_url ? (
                        <img src={driver.avatar_url} alt={driver.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <UserCircle size={24} />
                      )}
                      <div className={cn(
                        "absolute bottom-0 right-0 w-3 h-3 border-2 border-brand-dark rounded-full",
                        driver.work_status === 'road' ? "bg-orange-500" : "bg-emerald-500"
                      )}></div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-text">{driver.name}</p>
                      <p className="text-[10px] text-brand-text-muted font-medium">
                        {driver.work_status === 'road' ? 'Na Estrada' : 'Em Casa'}
                      </p>
                    </div>
                  </div>

                  {/* Puzzle Connector */}
                  <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
                    {/* Cavalo (Fixed) */}
                    <div className={cn(
                      "flex-1 p-3 rounded-xl border-2 flex items-center gap-3 transition-all",
                      fixedTruck ? "bg-brand-primary/5 border-brand-primary/20" : "bg-brand-bg border-dashed border-brand-border"
                    )}>
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        fixedTruck ? "bg-brand-primary text-white" : "bg-brand-border text-brand-text-nav"
                      )}>
                        <Truck size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wider">Cavalo (Fixo)</p>
                        <p className="text-xs font-bold text-brand-text truncate">
                          {fixedTruck ? fixedTruck.plate : 'Não definido'}
                        </p>
                      </div>
                    </div>

                    <div className="text-brand-text-muted">
                      <Link size={16} />
                    </div>

                    {/* Carreta (Dynamic) */}
                    <div className={cn(
                      "flex-1 p-3 rounded-xl border-2 flex items-center gap-3 transition-all relative",
                      currentTrailer ? "bg-brand-primary/10 border-brand-primary/30" : "bg-brand-bg border-dashed border-brand-border"
                    )}>
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        currentTrailer ? "bg-brand-primary text-white" : "bg-brand-primary/50 text-white"
                      )}>
                        <Box size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wider">
                          {currentTrailer?.trailer_category === 'frigorifica' ? 'Frigorífica' : 'Carreta'}
                        </p>
                        <p className="text-xs font-bold text-brand-text truncate">
                          {currentTrailer ? currentTrailer.plate : 'Vazio'}
                        </p>
                        {driver.current_invoice && (
                          <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                            <FileText size={10} /> {driver.current_invoice}
                          </p>
                        )}
                      </div>

                      {currentTrailer && (
                        <button 
                          onClick={() => handleAssignTrailer(driver.id, null)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-red-100 text-red-500 rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors"
                        >
                          <Unlink size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="w-full sm:w-auto flex flex-col gap-2">
                    <select 
                      disabled={isUpdating === driver.id}
                      onChange={(e) => handleAssignTrailer(driver.id, e.target.value)}
                      value={driver.current_trailer_id || ''}
                      className="w-full sm:w-48 px-3 py-2 border border-brand-border rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-brand-primary"
                    >
                      <option value="">Trocar Carreta...</option>
                      {availableTrailers.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.plate} - {t.trailer_category === 'frigorifica' ? 'Frigorífica' : 'Normal'}
                        </option>
                      ))}
                    </select>
                    
                    <div className="relative">
                      <FileText size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
                      <input 
                        type="text"
                        placeholder="Nota Fiscal..."
                        defaultValue={driver.current_invoice || ''}
                        disabled={isUpdating === driver.id}
                        onBlur={(e) => {
                          if (e.target.value !== (driver.current_invoice || '')) {
                            handleUpdateInvoice(driver.id, e.target.value);
                          }
                        }}
                        className="w-full sm:w-48 pl-8 pr-3 py-2 border border-brand-border rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-brand-primary"
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Available Resources */}
        <div className="space-y-6">
          <div className="panel p-6">
            <h3 className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-6 flex items-center gap-2">
              <AlertCircle size={14} />
              Carretas Disponíveis no Pátio
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              {availableTrailers.length === 0 ? (
                <p className="col-span-full text-center py-8 text-brand-text-muted text-sm italic">Nenhuma carreta disponível</p>
              ) : (
                availableTrailers.map(trailer => (
                  <div key={trailer.id} className="p-4 bg-gray-50 border border-brand-border rounded-xl flex items-center gap-3 relative">
                    <div className="w-10 h-10 bg-white border border-brand-border rounded-lg flex items-center justify-center text-brand-primary">
                      <Box size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{trailer.plate}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-brand-text-muted font-medium">
                          {trailer.trailer_category === 'frigorifica' ? 'Frigorífica' : 'Normal'}
                        </p>
                        {trailer.maintenance_status === 'needed' && (
                          <span className="text-[10px] text-red-500 font-bold flex items-center gap-0.5">
                            <AlertCircle size={10} />
                            Manutenção
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={cn(
                      "absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider",
                      trailer.location_status === 'yard' ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                    )}>
                      {trailer.location_status === 'yard' ? 'No Pátio' : 'Viagem'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
