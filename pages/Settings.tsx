
import React, { useState } from 'react';
import { Printer as PrinterIcon, Wifi, Plus, Trash2, UserCog, UserPlus, Shield, Smartphone, Send, Laptop, Cable, Network } from 'lucide-react';
import { Printer, Connection, User, UserRole } from '../types.ts';

interface SettingsProps {
  printers: Printer[];
  setPrinters: React.Dispatch<React.SetStateAction<Printer[]>>;
  connections: Connection[];
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const Settings: React.FC<SettingsProps> = ({ printers, setPrinters, connections, setConnections, users, setUsers }) => {
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [newPrinter, setNewPrinter] = useState<Partial<Printer>>({ 
    type: 'COZINHA', 
    status: 'ONLINE', 
    connectionMethod: 'IP' 
  });

  const addPrinter = () => {
    if (!newPrinter.name || !newPrinter.ip) return;
    
    setPrinters(prev => [...prev, { 
      ...newPrinter, 
      id: Date.now().toString(), 
      status: 'ONLINE',
      connectionMethod: 'IP'
    } as Printer]);
    setShowPrinterModal(false);
    setNewPrinter({ type: 'COZINHA', status: 'ONLINE', connectionMethod: 'IP' });
  };

  const testPrinter = (p: Printer) => {
    setTestingId(p.id);
    setTimeout(() => {
      setTestingId(null);
      alert(`Comando de teste enviado com sucesso para ${p.name} no IP ${p.ip} (Porta 9100).`);
    }, 1200);
  };

  const toggleConnection = (id: string) => {
    setConnections(prev => prev.map(c => 
      c.id === id ? { ...c, status: c.status === 'CONNECTED' ? 'DISCONNECTED' : 'CONNECTED' } : c
    ));
  };

  return (
    <div className="space-y-12 max-w-6xl mx-auto pb-20">
      
      {/* SEÇÃO: CONFIGURAÇÕES DE SISTEMA */}
      <section className="space-y-6">
         <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="p-3 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-100"><Network size={24} /></div>
            <div>
               <h2 className="text-xl font-black text-gray-900 leading-tight">Configurações de Hardware</h2>
               <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Impressoras e Rede Local</p>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Impressoras de Rede */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-8">
               <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Terminais IP</h3>
                  <button onClick={() => setShowPrinterModal(true)} className="p-2 bg-red-600 text-white rounded-xl shadow-lg hover:scale-110 transition-all"><Plus size={20} /></button>
               </div>

               <div className="space-y-3">
                  {printers.map(p => (
                    <div key={p.id} className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between group">
                       <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-red-100 text-red-600">
                             <Wifi size={18} />
                          </div>
                          <div>
                             <p className="font-black text-gray-800 text-sm leading-tight">{p.name}</p>
                             <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                                IP: {p.ip} • <span className="text-red-600 font-black">{p.type}</span>
                             </p>
                          </div>
                       </div>
                       <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => testPrinter(p)} 
                            className={`p-2 rounded-lg ${testingId === p.id ? 'bg-orange-100 text-orange-600' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
                          >
                             <Send size={16} className={testingId === p.id ? "animate-pulse" : ""} />
                          </button>
                          <button onClick={() => setPrinters(prev => prev.filter(pr => pr.id !== p.id))} className="p-2 text-gray-300 hover:text-red-600"><Trash2 size={16} /></button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Integrações Cloud */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-8">
               <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Conexões Externas</h3>
               <div className="grid grid-cols-2 gap-4">
                  {connections.map(c => (
                    <button 
                      key={c.id} 
                      onClick={() => toggleConnection(c.id)}
                      className={`p-5 rounded-3xl border-2 transition-all text-left flex flex-col items-start ${c.status === 'CONNECTED' ? 'bg-white border-red-50 shadow-sm' : 'bg-gray-50 border-transparent opacity-60'}`}
                    >
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${c.status === 'CONNECTED' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                        {c.type === 'IFOOD' ? <Smartphone size={18} /> : <Shield size={18} />}
                      </div>
                      <p className="text-[10px] font-black text-gray-900 leading-tight mb-1">{c.provider}</p>
                      <p className={`text-[8px] font-black tracking-widest ${c.status === 'CONNECTED' ? 'text-green-600' : 'text-gray-400'}`}>
                        {c.status === 'CONNECTED' ? 'ON' : 'OFF'}
                      </p>
                    </button>
                  ))}
               </div>
            </div>
         </div>
      </section>

      {/* MODAL IMPRESSORA IP */}
      {showPrinterModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
           <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                 <Network size={24} />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-6 text-center">Adicionar Impressora</h3>
              
              <div className="space-y-4">
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Nome</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Cozinha" 
                      value={newPrinter.name} 
                      onChange={e => setNewPrinter({...newPrinter, name: e.target.value})} 
                      className="w-full p-4 bg-gray-50 rounded-2xl border-none text-sm outline-none font-bold" 
                    />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">IP Local</label>
                    <input 
                      type="text" 
                      placeholder="192.168.1.100" 
                      value={newPrinter.ip} 
                      onChange={e => setNewPrinter({...newPrinter, ip: e.target.value})} 
                      className="w-full p-4 bg-gray-50 rounded-2xl border-none text-sm outline-none font-mono" 
                    />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Setor</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['COZINHA', 'BAR', 'CAIXA'].map(t => (
                        <button 
                          key={t} 
                          onClick={() => setNewPrinter({...newPrinter, type: t as any})} 
                          className={`py-3 rounded-xl text-[8px] font-black transition-all border-2 ${newPrinter.type === t ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-gray-100 text-gray-400'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                 </div>
              </div>

              <div className="flex gap-4 mt-8">
                 <button onClick={addPrinter} className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl text-xs uppercase tracking-widest">Conectar</button>
                 <button onClick={() => setShowPrinterModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl text-xs uppercase tracking-widest">Sair</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
