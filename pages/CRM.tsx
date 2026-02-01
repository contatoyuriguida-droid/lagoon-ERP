
import React, { useState, useMemo } from 'react';
import { Gift, Heart, UserPlus, MessageSquare, Star, Search, X, Mail, Phone, User as UserIcon, Trash2, Building2, Map } from 'lucide-react';
import { Customer, CustomerType } from '../types.ts';

interface CRMProps {
  customers: Customer[];
  onSaveCustomer: (c: Customer) => Promise<void>;
  onDeleteCustomer: (id: string) => Promise<void>;
}

const CRM: React.FC<CRMProps> = ({ customers, onSaveCustomer, onDeleteCustomer }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newCust, setNewCust] = useState({ 
    name: '', 
    phone: '', 
    email: '', 
    prefs: '',
    type: CustomerType.INDIVIDUAL
  });

  const metrics = useMemo(() => {
    const totalPoints = customers.reduce((s, c) => s + (c.points || 0), 0);
    const totalSpent = customers.reduce((s, c) => s + (c.spent || 0), 0);
    const ltv = customers.length > 0 ? totalSpent / customers.length : 0;
    
    return {
      totalPoints,
      activeCount: customers.length,
      ltv: `R$ ${ltv.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.id && c.id.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [customers, searchTerm]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCust.name) return;

    const customer: Customer = {
      id: `cus-${Date.now()}`,
      name: newCust.name,
      type: newCust.type,
      spent: 0,
      points: 0,
      lastVisit: new Date().toLocaleDateString('pt-BR'),
      prefs: newCust.prefs.split(',').map(p => p.trim()).filter(p => p !== ""),
      phone: newCust.phone,
      email: newCust.email
    };

    await onSaveCustomer(customer);
    setShowAddModal(false);
    setNewCust({ name: '', phone: '', email: '', prefs: '', type: CustomerType.INDIVIDUAL });
  };

  const deleteCustomer = async (id: string) => {
    if (confirm("Deseja realmente remover este cliente do sistema?")) {
      await onDeleteCustomer(id);
    }
  };

  const getTypeBadge = (type: CustomerType) => {
    switch (type) {
      case CustomerType.HOTEL: 
        return <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1"><Building2 size={8} /> HOTEL</span>;
      case CustomerType.OPERATOR: 
        return <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1"><Map size={8} /> OPERADORA</span>;
      default: 
        return <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1"><UserIcon size={8} /> INDIVIDUAL</span>;
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
         <div className="flex items-center gap-3">
            <div className="p-3 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-100"><Heart size={24} /></div>
            <div>
               <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none">Fidelidade Lagoon</h2>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-2">Marketing & Relacionamento</p>
            </div>
         </div>
         <button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-100 hover:scale-105 active:scale-95 transition-all">
           <UserPlus size={18} /> Cadastrar Parceiro/Cliente
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 group hover:border-red-100 transition-all">
           <div className="p-4 bg-red-50 text-red-600 rounded-2xl transition-transform group-hover:scale-110"><Gift size={24} /></div>
           <div><p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">TOTAL PONTOS</p><p className="text-2xl font-black text-gray-900">{metrics.totalPoints}</p></div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 group hover:border-red-100 transition-all">
           <div className="p-4 bg-red-50 text-red-600 rounded-2xl transition-transform group-hover:scale-110"><Heart size={24} /></div>
           <div><p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">PARCEIROS/CLIENTES</p><p className="text-2xl font-black text-gray-900">{metrics.activeCount}</p></div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 group hover:border-red-100 transition-all">
           <div className="p-4 bg-red-50 text-red-600 rounded-2xl transition-transform group-hover:scale-110"><Star size={24} /></div>
           <div><p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">LTV MÉDIO</p><p className="text-2xl font-black text-gray-900">{metrics.ltv}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
           <div className="relative w-full sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nome ou ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl border-none font-bold text-xs outline-none focus:ring-2 focus:ring-red-600"
              />
           </div>
           <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
              {filteredCustomers.length} Registros Exibidos
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] text-gray-400 font-black uppercase tracking-[0.15em]">
                <tr>
                  <th className="px-8 py-5">Nome / Origem</th>
                  <th className="px-8 py-5">Gasto Acumulado</th>
                  <th className="px-8 py-5">Tipo</th>
                  <th className="px-8 py-5">Pontos</th>
                  <th className="px-8 py-5 text-center">Ações</th>
                </tr>
            </thead>
            <tbody className="text-xs divide-y divide-gray-50">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-red-50/30 transition-colors group">
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gray-100 text-gray-400 rounded-xl flex items-center justify-center font-black uppercase text-sm group-hover:bg-red-600 group-hover:text-white transition-all">{c.name ? c.name[0] : 'C'}</div>
                          <div>
                             <p className="font-black text-gray-800 text-sm leading-none uppercase mb-1">{c.name || "Sem Nome"}</p>
                             <p className="text-[10px] text-gray-400 font-bold tracking-tight">Visto em {c.lastVisit}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-5 font-black text-gray-900">R$ {c.spent.toFixed(2)}</td>
                    <td className="px-8 py-5">
                       {getTypeBadge(c.type)}
                    </td>
                    <td className="px-8 py-5">
                       <span className="px-3 py-1.5 bg-red-100 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                          {c.points} PTS
                       </span>
                    </td>
                    <td className="px-8 py-5">
                        <div className="flex items-center justify-center gap-3">
                           <button className="text-red-600 font-black text-[10px] uppercase tracking-widest hover:underline">Histórico</button>
                           <button onClick={() => deleteCustomer(c.id)} className="p-2 text-gray-200 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                        </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-md p-6">
          <div className="bg-white rounded-[40px] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Novo Cadastro</h3>
               <button onClick={() => setShowAddModal(false)} className="p-2 bg-gray-50 rounded-xl text-gray-400"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleAdd} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Parceiro / Cliente</label>
                <div className="grid grid-cols-3 gap-2">
                   {[
                     { id: CustomerType.INDIVIDUAL, label: 'CLIENTE', icon: <UserIcon size={14} /> },
                     { id: CustomerType.HOTEL, label: 'HOTEL', icon: <Building2 size={14} /> },
                     { id: CustomerType.OPERATOR, label: 'OPERADORA', icon: <Map size={14} /> }
                   ].map(t => (
                     <button 
                       key={t.id}
                       type="button"
                       onClick={() => setNewCust({...newCust, type: t.id})}
                       className={`flex flex-col items-center justify-center py-4 rounded-2xl border-2 transition-all ${newCust.type === t.id ? 'bg-red-600 border-red-600 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400'}`}
                     >
                       {t.icon}
                       <span className="text-[8px] font-black mt-2 uppercase">{t.label}</span>
                     </button>
                   ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome Completo / Razão</label>
                <div className="relative">
                   <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                   <input required type="text" value={newCust.name} onChange={e => setNewCust({...newCust, name: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none text-sm outline-none font-bold focus:ring-2 focus:ring-red-600" placeholder="Ex: Hotel Grand Lagoon" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Telefone</label>
                  <input type="tel" value={newCust.phone} onChange={e => setNewCust({...newCust, phone: e.target.value})} className="w-full px-4 py-4 bg-gray-50 rounded-2xl border-none text-sm outline-none font-bold" placeholder="(00) 00000-0000" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail</label>
                  <input type="email" value={newCust.email} onChange={e => setNewCust({...newCust, email: e.target.value})} className="w-full px-4 py-4 bg-gray-50 rounded-2xl border-none text-sm outline-none font-bold" placeholder="contato@email.com" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Observações / Tags</label>
                <input type="text" value={newCust.prefs} onChange={e => setNewCust({...newCust, prefs: e.target.value})} className="w-full px-4 py-4 bg-gray-50 rounded-2xl border-none text-sm outline-none font-bold" placeholder="Vip, Frequente, Comissionado..." />
              </div>

              <button type="submit" className="w-full py-5 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-100 uppercase text-xs tracking-[0.2em] active:scale-95 transition-all mt-4">
                SALVAR CADASTRO
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRM;
