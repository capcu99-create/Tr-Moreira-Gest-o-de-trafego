import React, { useState } from 'react';
import { 
  Plus, 
  Truck as TruckIcon, 
  Users, 
  Trash2, 
  Edit2, 
  Search,
  ChevronRight,
  MessageCircle,
  Camera,
  Image as ImageIcon,
  UserCircle,
  Box,
  Home,
  Map as MapIcon,
  Warehouse,
  FileText,
  Paperclip,
  Download,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { dbService } from '../lib/dbService';
import { Driver, Truck } from '../types';
import { Modal } from './ui/Modal';
import { ConfirmModal } from './ui/ConfirmModal';
import { useDrivers, useTrucks } from '../lib/hooks';
import { useToast } from './ui/Toast';
import { cn } from '../lib/utils';
import { isSupabaseConfigured } from '../lib/supabase';
import { AlertTriangle, Database, Info } from 'lucide-react';

interface IdentificationViewProps {
  defaultTab?: 'drivers' | 'trucks';
}

export function IdentificationView({ defaultTab = 'drivers' }: IdentificationViewProps) {
  const { drivers, loading: driversLoading, refresh: refreshDrivers } = useDrivers();
  const { trucks, loading: trucksLoading, refresh: refreshTrucks } = useTrucks();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'drivers' | 'trucks'>(defaultTab);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Sync activeTab with defaultTab when it changes from parent
  React.useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const bucket = 'documents';
      const publicUrl = await dbService.uploadFile(bucket, fileName, file);
      
      // Update form value
      const input = document.getElementsByName(fieldName)[0] as HTMLInputElement;
      if (input) {
        input.value = publicUrl;
        showToast('Documento carregado com sucesso!', 'success');
      }
    } catch (error: any) {
      console.error('Erro detalhado no upload:', error);
      const errorMessage = error.message || error.error_description || 'Erro desconhecido';
      showToast(`Erro no upload: ${errorMessage}. Verifique se o bucket "documents" existe e é público no Supabase.`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      if (activeTab === 'drivers') {
        const data = {
          name: formData.get('name') as string,
          phone: formData.get('phone') as string,
          avatar_url: (formData.get('avatar_url') as string) || null,
          cnh_url: (formData.get('cnh_url') as string) || null,
          work_status: formData.get('work_status') as 'home' | 'road',
          truck_id: (formData.get('truck_id') as string) || null,
          current_trailer_id: (formData.get('current_trailer_id') as string) || null,
          current_invoice: (formData.get('current_invoice') as string) || null,
          status: 'active' as const
        };

        // Safety check for "undefined" strings
        Object.keys(data).forEach(key => {
          if ((data as any)[key] === 'undefined') {
            (data as any)[key] = null;
          }
        });

        if (editingItem?.id) {
          await dbService.updateDriver(editingItem.id, data);
          showToast('Motorista atualizado!', 'success');
        } else {
          await dbService.addDriver(data);
          showToast('Motorista cadastrado!', 'success');
        }
        refreshDrivers();
      } else {
        const data = {
          plate: formData.get('plate') as string,
          model: (formData.get('model') as string) || null,
          trailer_category: (formData.get('trailer_category') as any) || null,
          location_status: formData.get('location_status') as 'yard' | 'road',
          maintenance_status: formData.get('maintenance_status') as 'ok' | 'needed' || 'ok',
          type: formData.get('type') as 'cavalo' | 'carreta',
          doc_url: (formData.get('doc_url') as string) || null,
          status: 'available' as const
        };

        // Safety check for "undefined" strings
        Object.keys(data).forEach(key => {
          if ((data as any)[key] === 'undefined') {
            (data as any)[key] = null;
          }
        });

        if (editingItem?.id) {
          await dbService.updateTruck(editingItem.id, data);
          showToast('Veículo atualizado!', 'success');
        } else {
          await dbService.addTruck(data);
          showToast('Veículo cadastrado!', 'success');
        }
        refreshTrucks();
      }
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      showToast(error.message || 'Erro ao salvar dados', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      if (activeTab === 'drivers') {
        await dbService.deleteDriver(deleteId);
        showToast('Motorista excluído', 'success');
        refreshDrivers();
      } else {
        await dbService.deleteTruck(deleteId);
        showToast('Veículo excluído', 'success');
        refreshTrucks();
      }
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      const message = error.message?.includes('foreign key constraint') 
        ? 'Não é possível excluir: este registro possui vínculos (fretes, dívidas, etc).'
        : 'Erro ao excluir registro.';
      showToast(message, 'error');
    } finally {
      setDeleteId(null);
    }
  };

  const filteredItems = (activeTab === 'drivers' ? drivers : trucks).filter((item: any) => {
    const search = searchTerm.toLowerCase();
    if (activeTab === 'drivers') {
      return item.name.toLowerCase().includes(search) || item.phone.includes(search);
    }
    return item.plate.toLowerCase().includes(search) || item.model.toLowerCase().includes(search);
  });

  const isLoading = driversLoading || trucksLoading;

  const renderItem = (item: any, index: number) => (
    <motion.div
      key={item.id}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
      className="panel group hover:border-brand-primary transition-all duration-300 overflow-hidden"
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-110 overflow-hidden",
            activeTab === 'drivers' ? "bg-brand-primary" : (item.type === 'cavalo' ? "bg-brand-dark" : "bg-brand-primary")
          )}>
            {activeTab === 'drivers' ? (
              item.avatar_url ? (
                <img src={item.avatar_url} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : <UserCircle size={24} />
            ) : (
              item.type === 'cavalo' ? <TruckIcon size={24} /> : <Box size={24} />
            )}
          </div>
          <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
              className="p-2 text-brand-text-muted hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-all"
            >
              <Edit2 size={14} />
            </button>
            <button 
              onClick={() => setDeleteId(item.id)}
              className="p-2 text-brand-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <h4 className="text-lg font-bold text-brand-text truncate">
            {activeTab === 'drivers' ? item.name : item.plate}
          </h4>
          
          <div className="flex flex-wrap gap-2 mt-2">
            {activeTab === 'drivers' && item.cnh_url && (
              <a 
                href={item.cnh_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 text-brand-primary rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all shadow-sm"
              >
                <FileText size={12} />
                CNH
                <Download size={10} />
              </a>
            )}
            {activeTab === 'trucks' && item.doc_url && (
              <a 
                href={item.doc_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 text-brand-primary rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all shadow-sm"
              >
                <FileText size={12} />
                DOC
                <Download size={10} />
              </a>
            )}
          </div>

          {activeTab === 'drivers' && (
            <div className="space-y-1 mt-1">
              <p className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">
                🚚 {trucks.find(t => t.id === item.truck_id)?.plate || 'Sem Cavalo Fixo'}
              </p>
              <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wider">
                📦 {trucks.find(t => t.id === item.current_trailer_id)?.plate || 'Sem Carreta'}
              </p>
              {item.current_invoice && (
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                  <FileText size={10} /> NF: {item.current_invoice}
                </p>
              )}
            </div>
          )}
          <div className="flex items-center gap-2">
            <p className="text-sm text-brand-text-muted font-medium">
              {activeTab === 'drivers' ? item.phone : (item.type === 'cavalo' ? item.model : (item.trailer_category === 'frigorifica' ? 'Frigorífica' : 'Normal'))}
            </p>
            {activeTab === 'drivers' && item.phone && (
              <a 
                href={`https://wa.me/55${item.phone.replace(/\D/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
                title="Conversar no WhatsApp"
              >
                <svg viewBox="0 0 24 24" size={14} className="w-3.5 h-3.5 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-brand-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className={cn(
                "w-2 h-2 rounded-full",
                activeTab === 'drivers' 
                  ? (item.work_status === 'road' ? "bg-orange-500" : "bg-emerald-500")
                  : (item.location_status === 'yard' ? "bg-emerald-500" : "bg-orange-500")
              )}></div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wider",
                activeTab === 'drivers'
                  ? (item.work_status === 'road' ? "text-orange-600" : "text-emerald-600")
                  : (item.location_status === 'yard' ? "text-emerald-600" : "text-orange-600")
              )}>
                {activeTab === 'drivers' 
                  ? (item.work_status === 'road' ? 'Na Estrada' : 'Em Casa / Livre')
                  : (item.location_status === 'yard' ? 'No Pátio' : 'Em Viagem')}
              </span>
            </div>
            {activeTab === 'trucks' && item.type === 'carreta' && (
              <div className="flex items-center gap-1.5 ml-3 pl-3 border-l border-brand-border">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  item.maintenance_status === 'needed' ? "bg-red-500" : "bg-emerald-500"
                )}></div>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  item.maintenance_status === 'needed' ? "text-red-600" : "text-emerald-600"
                )}>
                  {item.maintenance_status === 'needed' ? 'Manutenção' : 'OK'}
                </span>
              </div>
            )}
          </div>
          <ChevronRight size={16} className="text-brand-text-muted group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {!isSupabaseConfigured && (
        <div className="p-6 bg-orange-50 border border-orange-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 text-orange-800">
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
          <button 
            onClick={() => setShowSetup(true)}
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 shrink-0"
          >
            <Database size={16} />
            Ver Instruções SQL
          </button>
        </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex bg-white p-1 rounded-2xl border border-brand-border shadow-sm w-fit">
          <button
            onClick={() => setActiveTab('drivers')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
              activeTab === 'drivers' ? "bg-brand-primary text-white shadow-lg shadow-blue-200" : "text-brand-text-muted hover:bg-gray-50"
            )}
          >
            <Users size={16} />
            <span>Motoristas</span>
          </button>
          <button
            onClick={() => setActiveTab('trucks')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
              activeTab === 'trucks' ? "bg-brand-primary text-white shadow-lg shadow-blue-200" : "text-brand-text-muted hover:bg-gray-50"
            )}
          >
            <TruckIcon size={16} />
            <span>Frota</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={18} />
            <input 
              type="text" 
              placeholder={`Buscar ${activeTab === 'drivers' ? 'motorista' : 'veículo'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-primary outline-none transition-all shadow-sm w-full md:w-64"
            />
          </div>
          <button 
            onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-dark text-white rounded-xl hover:bg-gray-800 shadow-lg shadow-gray-200 transition-all font-bold text-xs uppercase tracking-wider shrink-0"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Adicionar</span>
          </button>
        </div>
      </div>

      {/* Content Grid */}
      <AnimatePresence mode="popLayout">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="panel h-40 animate-pulse bg-gray-50"></div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-brand-border">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {activeTab === 'drivers' ? <Users size={32} className="text-gray-300" /> : <TruckIcon size={32} className="text-gray-300" />}
            </div>
            <p className="text-brand-text-muted font-medium">Nenhum registro encontrado</p>
          </div>
        ) : activeTab === 'drivers' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* No Pátio Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-2">
                <Warehouse size={16} className="text-brand-primary" />
                <h3 className="text-xs font-bold text-brand-text uppercase tracking-widest">No Pátio / Em Casa</h3>
                <span className="ml-auto text-[10px] font-bold text-brand-text-muted bg-brand-bg px-2 py-0.5 rounded-full">
                  {filteredItems.filter(i => i.work_status === 'home').length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {filteredItems.filter(i => i.work_status === 'home').map((item: any, index) => renderItem(item, index))}
                {filteredItems.filter(i => i.work_status === 'home').length === 0 && (
                  <div className="p-8 text-center border-2 border-dashed border-gray-100 rounded-2xl text-brand-text-muted text-xs">
                    Nenhum motorista no pátio
                  </div>
                )}
              </div>
            </div>

            {/* Na Estrada Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-2">
                <MapIcon size={16} className="text-brand-primary" />
                <h3 className="text-xs font-bold text-brand-text uppercase tracking-widest">Na Estrada</h3>
                <span className="ml-auto text-[10px] font-bold text-brand-text-muted bg-brand-bg px-2 py-0.5 rounded-full">
                  {filteredItems.filter(i => i.work_status === 'road').length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {filteredItems.filter(i => i.work_status === 'road').map((item: any, index) => renderItem(item, index))}
                {filteredItems.filter(i => i.work_status === 'road').length === 0 && (
                  <div className="p-8 text-center border-2 border-dashed border-gray-100 rounded-2xl text-brand-text-muted text-xs">
                    Nenhum motorista na estrada
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Cavalos Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-2">
                <TruckIcon size={16} className="text-brand-primary" />
                <h3 className="text-xs font-bold text-brand-text uppercase tracking-widest">Cavalos</h3>
                <span className="ml-auto text-[10px] font-bold text-brand-text-muted bg-brand-bg px-2 py-0.5 rounded-full">
                  {filteredItems.filter(i => i.type === 'cavalo').length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {filteredItems.filter(i => i.type === 'cavalo').map((item: any, index) => renderItem(item, index))}
                {filteredItems.filter(i => i.type === 'cavalo').length === 0 && (
                  <div className="p-8 text-center border-2 border-dashed border-gray-100 rounded-2xl text-brand-text-muted text-xs">
                    Nenhum cavalo encontrado
                  </div>
                )}
              </div>
            </div>

            {/* Carretas Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-2">
                <Box size={16} className="text-brand-primary" />
                <h3 className="text-xs font-bold text-brand-text uppercase tracking-widest">Carretas</h3>
                <span className="ml-auto text-[10px] font-bold text-brand-text-muted bg-brand-bg px-2 py-0.5 rounded-full">
                  {filteredItems.filter(i => i.type === 'carreta').length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {filteredItems.filter(i => i.type === 'carreta').map((item: any, index) => renderItem(item, index))}
                {filteredItems.filter(i => i.type === 'carreta').length === 0 && (
                  <div className="p-8 text-center border-2 border-dashed border-gray-100 rounded-2xl text-brand-text-muted text-xs">
                    Nenhuma carreta encontrada
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingItem ? `Editar ${activeTab === 'drivers' ? 'Motorista' : 'Veículo'}` : `Novo ${activeTab === 'drivers' ? 'Motorista' : 'Veículo'}`}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {activeTab === 'drivers' ? (
            <>
              <div className="flex justify-center mb-6">
                <div className="relative group">
                  <div className="w-24 h-24 bg-gray-100 rounded-3xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                    {editingItem?.avatar_url ? (
                      <img src={editingItem.avatar_url} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Camera size={32} className="text-gray-300" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-3xl cursor-pointer">
                    <ImageIcon size={20} className="text-white" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">URL da Foto (Opcional)</label>
                <input name="avatar_url" defaultValue={editingItem?.avatar_url} className="w-full px-4 py-2.5 border border-brand-border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm" placeholder="https://exemplo.com/foto.jpg" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Nome Completo</label>
                <input name="name" defaultValue={editingItem?.name} required className="w-full px-4 py-2.5 border border-brand-border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm" placeholder="Ex: João Silva" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Telefone / WhatsApp</label>
                <input name="phone" defaultValue={editingItem?.phone} required className="w-full px-4 py-2.5 border border-brand-border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm" placeholder="(00) 00000-0000" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5 flex items-center justify-between">
                  <span>Documento CNH</span>
                  {isUploading && <span className="text-brand-primary animate-pulse text-[8px]">Carregando...</span>}
                </label>
                <div className="flex gap-2">
                  <input 
                    name="cnh_url" 
                    defaultValue={editingItem?.cnh_url} 
                    className="flex-1 px-4 py-2.5 border border-brand-border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-[10px]" 
                    placeholder="URL do documento ou use o botão ->" 
                  />
                  <div className="relative">
                    <input 
                      type="file" 
                      onChange={(e) => handleFileUpload(e, 'cnh_url')} 
                      className="absolute inset-0 opacity-0 cursor-pointer w-full"
                      accept=".pdf,image/*"
                    />
                    <div className="h-full px-4 flex items-center justify-center bg-gray-100 rounded-xl text-gray-600 hover:bg-gray-200 transition-colors">
                      <Paperclip size={18} />
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Status de Trabalho</label>
                <select name="work_status" defaultValue={editingItem?.work_status || 'home'} className="w-full px-4 py-2.5 border border-brand-border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm">
                  <option value="home">Em Casa / Livre</option>
                  <option value="road">Na Estrada</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Caminhão Fixo (Cavalo)</label>
                <select name="truck_id" defaultValue={editingItem?.truck_id} className="w-full px-4 py-2.5 border border-brand-border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm">
                  <option value="">Nenhum</option>
                  {trucks.filter(t => t.type === 'cavalo').map(t => (
                    <option key={t.id} value={t.id}>{t.plate} - {t.model}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Carreta Atual</label>
                <select name="current_trailer_id" defaultValue={editingItem?.current_trailer_id} className="w-full px-4 py-2.5 border border-brand-border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm">
                  <option value="">Nenhuma</option>
                  {trucks.filter(t => t.type === 'carreta').map(t => (
                    <option key={t.id} value={t.id}>{t.plate} - {t.trailer_category === 'frigorifica' ? 'Frigorífica' : 'Normal'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Nota Fiscal em Trânsito</label>
                <input name="current_invoice" defaultValue={editingItem?.current_invoice} className="w-full px-4 py-2.5 border border-brand-border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm" placeholder="Ex: NF 12345" />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Placa</label>
                  <input name="plate" defaultValue={editingItem?.plate} required className="w-full px-4 py-2.5 border border-brand-border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm uppercase" placeholder="ABC-1234" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Tipo</label>
                  <select 
                    name="type" 
                    defaultValue={editingItem?.type || 'cavalo'} 
                    className="w-full px-4 py-2.5 border border-brand-border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm"
                    onChange={(e) => {
                      // Force re-render to show/hide category
                      setEditingItem({...editingItem, type: e.target.value});
                    }}
                  >
                    <option value="cavalo">Cavalo</option>
                    <option value="carreta">Carreta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5 flex items-center justify-between">
                  <span>Documento do Veículo</span>
                  {isUploading && <span className="text-brand-primary animate-pulse text-[8px]">Carregando...</span>}
                </label>
                <div className="flex gap-2">
                  <input 
                    name="doc_url" 
                    defaultValue={editingItem?.doc_url} 
                    className="flex-1 px-4 py-2.5 border border-brand-border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-[10px]" 
                    placeholder="URL do documento ou use o botão ->" 
                  />
                  <div className="relative">
                    <input 
                      type="file" 
                      onChange={(e) => handleFileUpload(e, 'doc_url')} 
                      className="absolute inset-0 opacity-0 cursor-pointer w-full"
                      accept=".pdf,image/*"
                    />
                    <div className="h-full px-4 flex items-center justify-center bg-gray-100 rounded-xl text-gray-600 hover:bg-gray-200 transition-colors">
                      <Paperclip size={18} />
                    </div>
                  </div>
                </div>
              </div>
              
              {editingItem?.type === 'carreta' || (!editingItem && (document.getElementsByName('type')[0] as HTMLSelectElement)?.value === 'carreta') ? (
                <div>
                  <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Categoria da Carreta</label>
                  <select name="trailer_category" defaultValue={editingItem?.trailer_category || 'normal'} className="w-full px-4 py-2.5 border border-brand-border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm">
                    <option value="normal">Normal</option>
                    <option value="frigorifica">Frigorífica</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Modelo / Marca</label>
                  <input name="model" defaultValue={editingItem?.model} required className="w-full px-4 py-2.5 border border-brand-border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm" placeholder="Ex: Volvo FH 540" />
                </div>
              )}
              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Localização / Status</label>
                <select name="location_status" defaultValue={editingItem?.location_status || 'yard'} className="w-full px-4 py-2.5 border border-brand-border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm">
                  <option value="yard">No Pátio</option>
                  <option value="road">Em Viagem</option>
                </select>
              </div>
              {(editingItem?.type === 'carreta' || (!editingItem && (document.getElementsByName('type')[0] as HTMLSelectElement)?.value === 'carreta')) && (
                <div>
                  <label className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-1.5">Status de Manutenção</label>
                  <select name="maintenance_status" defaultValue={editingItem?.maintenance_status || 'ok'} className="w-full px-4 py-2.5 border border-brand-border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm">
                    <option value="ok">Manutenção OK ✅</option>
                    <option value="needed">Manutenção Necessária ⚠️</option>
                  </select>
                </div>
              )}
            </>
          )}

          <button 
            disabled={isSubmitting}
            className="w-full bg-brand-primary text-white font-bold py-3.5 rounded-xl hover:bg-blue-600 transition-all mt-4 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              editingItem ? 'Salvar Alterações' : 'Cadastrar'
            )}
          </button>
        </form>
      </Modal>

      <ConfirmModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir este ${activeTab === 'drivers' ? 'motorista' : 'veículo'}? Esta ação não pode ser desfeita.`}
        variant="danger"
      />

      <Modal isOpen={showSetup} onClose={() => setShowSetup(false)} title="Configuração do Banco de Dados">
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 rounded-xl flex items-start gap-3 text-blue-800">
            <Info className="shrink-0 mt-1" size={18} />
            <p className="text-xs leading-relaxed">
              Copie o código abaixo e cole no <b>SQL Editor</b> do seu painel Supabase para criar as tabelas necessárias.
            </p>
          </div>
          
          <div className="relative">
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl text-[10px] font-mono overflow-x-auto max-h-[300px]">
{`-- 1. CRIAR TABELA DE VEÍCULOS (TRUCKS)
CREATE TABLE IF NOT EXISTS trucks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plate TEXT NOT NULL UNIQUE,
  model TEXT,
  type TEXT CHECK (type IN ('cavalo', 'carreta')),
  trailer_category TEXT, -- 'frigorifica' ou 'normal'
  location_status TEXT DEFAULT 'yard', -- 'yard' ou 'road'
  status TEXT DEFAULT 'available',
  doc_url TEXT, -- Documento do veículo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CRIAR TABELA DE MOTORISTAS (DRIVERS)
CREATE TABLE IF NOT EXISTS drivers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  cnh_url TEXT, -- Documento CNH
  work_status TEXT DEFAULT 'home', -- 'home' ou 'road'
  truck_id UUID REFERENCES trucks(id) ON DELETE SET NULL, -- Cavalo Fixo
  current_trailer_id UUID REFERENCES trucks(id) ON DELETE SET NULL, -- Carreta Atual
  current_invoice TEXT, -- Nota Fiscal Atual
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CRIAR TABELA DE FRETES (TRIPS)
CREATE TABLE IF NOT EXISTS trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  truck_id UUID REFERENCES trucks(id) ON DELETE SET NULL,
  trailer_id UUID REFERENCES trucks(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('ida', 'volta')),
  origin TEXT,
  destination TEXT,
  cte TEXT,
  loading_date DATE,
  cte_date DATE,
  delivery_date DATE,
  km_initial DECIMAL(12,2),
  km_final DECIMAL(12,2),
  freight_value DECIMAL(12,2),
  advance_value DECIMAL(12,2),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CRIAR TABELA DE GASTOS DE VIAGEM (TRIP_EXPENSES)
CREATE TABLE IF NOT EXISTS trip_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('fuel', 'diverse', 'advance')),
  date DATE DEFAULT CURRENT_DATE,
  description TEXT,
  value DECIMAL(12,2) NOT NULL,
  liters DECIMAL(12,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CRIAR TABELA DE DÍVIDAS/FINANCEIRO (DEBTS)
CREATE TABLE IF NOT EXISTS debts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person_name TEXT NOT NULL,
  total_value DECIMAL(12,2),
  installments_count INTEGER DEFAULT 1,
  installments_paid INTEGER DEFAULT 0,
  due_date DATE,
  type TEXT CHECK (type IN ('pagar', 'receber')),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ATUALIZAÇÃO DE COLUNAS (Caso as tabelas já existam)
DO $$ 
BEGIN 
  -- Colunas para trucks
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trucks' AND column_name='trailer_category') THEN
    ALTER TABLE trucks ADD COLUMN trailer_category TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trucks' AND column_name='location_status') THEN
    ALTER TABLE trucks ADD COLUMN location_status TEXT DEFAULT 'yard';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trucks' AND column_name='maintenance_status') THEN
    ALTER TABLE trucks ADD COLUMN maintenance_status TEXT DEFAULT 'ok';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trucks' AND column_name='doc_url') THEN
    ALTER TABLE trucks ADD COLUMN doc_url TEXT;
  END IF;

  -- Colunas para drivers
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='drivers' AND column_name='avatar_url') THEN
    ALTER TABLE drivers ADD COLUMN avatar_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='drivers' AND column_name='work_status') THEN
    ALTER TABLE drivers ADD COLUMN work_status TEXT DEFAULT 'home';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='drivers' AND column_name='current_invoice') THEN
    ALTER TABLE drivers ADD COLUMN current_invoice TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='drivers' AND column_name='cnh_url') THEN
    ALTER TABLE drivers ADD COLUMN cnh_url TEXT;
  END IF;

  -- Colunas para trips
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trips' AND column_name='cte_date') THEN
    ALTER TABLE trips ADD COLUMN cte_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trips' AND column_name='trailer_id') THEN
    ALTER TABLE trips ADD COLUMN trailer_id UUID REFERENCES trucks(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trips' AND column_name='km_initial') THEN
    ALTER TABLE trips ADD COLUMN km_initial DECIMAL(12,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trips' AND column_name='km_final') THEN
    ALTER TABLE trips ADD COLUMN km_final DECIMAL(12,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trips' AND column_name='delivery_date') THEN
    ALTER TABLE trips ADD COLUMN delivery_date DATE;
  END IF;
END $$;`}
            </pre>
          </div>

          <button 
            onClick={() => setShowSetup(false)}
            className="w-full py-3 bg-brand-dark text-white rounded-xl font-bold text-xs uppercase tracking-widest"
          >
            Entendi
          </button>
        </div>
      </Modal>
    </div>
  );
}
