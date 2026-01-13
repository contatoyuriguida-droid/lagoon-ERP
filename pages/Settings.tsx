
import React, { useState } from 'react';
import { Printer as PrinterIcon, Wifi, Globe, ShieldCheck, Zap, Database, Server, RefreshCw, Plus, Trash2, Key, CheckCircle2 } from 'lucide-react';
import { Printer, Connection } from '../types.ts';

interface SettingsProps {
  printers: Printer[];
  setPrinters: React.Dispatch<React.SetStateAction<Printer[]>>;
  connections: Connection[];
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>>;
}

const Settings: React.FC<SettingsProps> = ({ printers, setPrinters, connections, setConnections }) => {
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [newPrinter, setNewPrinter] = useState<Partial<Printer>>({ type: 'COZINHA', status: 'ONLINE' });
  const [newConn, setNewConn] = useState<Partial<Connection>>({ type: 'IFOOD', status: 'CONNECTED' });

  const addPrinter = () => {
    if (!newPrinter.name || !newPrinter.ip) return;
    setPrinters([...printers, { ...newPrinter, id: Date.now().toString() } as Printer]);
    setShowPrinterModal(false);
    setNewPrinter({ type: 'COZINHA', status: 'ONLINE' });
  };

  const removePrinter = (id: string) => {
    setPrinters(printers.filter(p => p.id !== id));
  };

  const addConnection = () => {
    if (!newConn.provider) return;
    setConnections([...connections, { ...newConn, id: Date.now().toString() } as Connection]);
    setShowConnectionModal(false);
    setNewConn({ type: 'IFOOD', status: 'CONNECTED' });
  };

  return (
    <div className="space-y-12 pb-24 max-w-6xl mx-auto">
      {/* Seção de Periféricos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        <section className="bg-white rounded-[48px] p-10 border border-gray-100 shadow-2xl shadow-gray-100/30 space-y-8 relative overflow-hidden group">
           <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-5">
                 <div className="p-6 bg-red-600 text-white rounded-[32px] shadow-xl shadow-red-100 group-hover:rotate-6 transition-transform duration-500"><PrinterIcon size={32} /></div>
                 <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Rede de Impressão</h2>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest text-[10px]">Configurar Terminais Térmicos</p>
                 </div>
              </div>
              <button 
                onClick={() => setShowPrinterModal(true)}
                className="w-14 h-14 bg-red-50 text-red-600 rounded-[24px] flex items-center justify-center hover:bg-red-600 hover:text-white transition-all active:scale-90"
              >
                <Plus size={28} />
              </button>
           </div>

           <div className="space-y-4 relative z-10">
              {printers.length > 0 ? printers.map(p => (
                <div key={p.id} className="p-6 bg-gray-50 rounded-[32px] flex items-center justify-between border-2 border-transparent hover:border-red-100 transition-all group/item">
                   <div className="flex items-center gap-5">
                      <div className={`w-4 h-4 rounded-full border-4 border-white shadow-sm ${p.status === 'ONLINE' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                      <div>
                         <p className="font-black text-gray-800 text-lg leading-tight">{p.name}</p>
                         <p className="text-[10px] text-gray-400 font-black tracking-[0.2em] uppercase">{p.type} • IP: {p.ip}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <button onClick={() => removePrinter(p.id)} className="p-3 text-gray-300 hover:text-red-600 transition-colors"><Trash2 size={20} /></button>
                      <button className="px-5 py-2.5 bg-white text-gray-400 text-[10px] font-black rounded-xl border border-gray-100 hover:border-red-600 hover:text-red-600 shadow-sm uppercase tracking-widest">Testar</button>
                   </div>
                </div>
              )) : (
                <div className="py-10 text-center text-gray-300 space-y-2 opacity-50">
                  <PrinterIcon size={48} className="mx-auto mb-2" />
                  <p className="font-black text-sm uppercase tracking-widest">Nenhuma Impressora</p>
                </div>
              )}
           </div>
        </section>

        <section className="bg-white rounded-[48px] p-10 border border-gray-100 shadow-2xl shadow-gray-100/30 space-y-8 relative overflow-hidden group">
           <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-5">
                 <div className="p-6 bg-red-50 text-red-600 rounded-[32px] shadow-lg group-hover:-rotate-6 transition-transform duration-500"><Wifi size={32} /></div>
                 <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Integrações Cloud</h2>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest text-[10px]">IFood, Rappi e Fiscal</p>
                 </div>
              </div>
              <button 
                onClick={() => setShowConnectionModal(true)}
                className="w-14 h-14 bg-red-600 text-white rounded-[24px] flex items-center justify-center hover:bg-red-700 transition-all active:scale-90 shadow-xl shadow-red-100"
              >
                <Plus size={28} />
              </button>
           </div>

           <div className="space-y-4 relative z-10">
              {connections.map(c => (
                <div key={c.id} className="p-6 bg-gray-50 rounded-[32px] flex items-center justify-between border-2 border-transparent hover:border-red-100 transition-all">
                   <div className="flex items-center gap-5">
                      <div className={`p-4 rounded-2xl shadow-sm bg-white ${c.status === 'CONNECTED' ? 'text-red-600' : 'text-gray-300'}`}>
                         {c.type === 'IFOOD' ? <Zap size={24} /> : <ShieldCheck size={24} />}
                      </div>
                      <div>
                         <p className="font-black text-gray-800 text-lg leading-tight">{c.provider}</p>
                         <p className="text-[10px] text-gray-400 font-black tracking-widest uppercase">{c.type}</p>
                      </div>
                   </div>
                   <div className={`px-4 py-2 rounded-2xl text-[10px] font-black border-2 ${c.status === 'CONNECTED' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                      {c.status === 'CONNECTED' ? 'ATIVA' : 'FALHA'}
                   </div>
                </div>
              ))}
           </div>
        </section>
      </div>

      {/* Printer Modal */}
      {showPrinterModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-6">
           <div className="bg-white rounded-[60px] w-full max-w-md p-14 shadow-2xl animate-in zoom-in-95 duration-300 border-t-[12px] border-red-600">
              <h3 className="text-4xl font-black text-gray-900 mb-2 tracking-tighter">Instalar Impressora</h3>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-10 opacity-70">Cadastro de ponto de impressão</p>
              
              <div className="space-y-8">
                 <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Nome de Exibição</label>
                    <input type="text" value={newPrinter.name} onChange={e => setNewPrinter({...newPrinter, name: e.target.value})} placeholder="Ex: Térmica Cozinha" className="w-full p-6 bg-gray-50 rounded-[28px] border-none outline-none focus:ring-4 focus:ring-red-100 font-black text-xl tracking-tight" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Endereço IP (LAN)</label>
                    <input type="text" value={newPrinter.ip} onChange={e => setNewPrinter({...newPrinter, ip: e.target.value})} placeholder="192.168.1.XX" className="w-full p-6 bg-gray-50 rounded-[28px] border-none outline-none focus:ring-4 focus:ring-red-100 font-mono text-xl text-red-600 font-black" />
                 </div>
                 <div className="flex gap-3">
                    {['COZINHA', 'CAIXA', 'BAR'].map(type => (
                      <button key={type} onClick={() => setNewPrinter({...newPrinter, type: type as any})} className={`flex-1 py-4 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest ${newPrinter.type === type ? 'bg-red-600 text-white shadow-xl shadow-red-100' : 'bg-gray-50 text-gray-400 hover:bg-red-50'}`}>{type}</button>
                    ))}
                 </div>
              </div>
              <div className="flex gap-4 mt-12">
                 <button onClick={addPrinter} className="flex-1 py-6 bg-red-600 text-white font-black rounded-[28px] shadow-2xl shadow-red-100 hover:bg-red-700 transition-all uppercase tracking-[0.2em] active:scale-95">Salvar</button>
                 <button onClick={() => setShowPrinterModal(false)} className="flex-1 py-6 bg-gray-50 text-gray-400 font-black rounded-[28px] hover:bg-gray-100 transition-all uppercase tracking-[0.2em]">Sair</button>
              </div>
           </div>
        </div>
      )}

      {/* Connection Modal */}
      {showConnectionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-6">
           <div className="bg-white rounded-[60px] w-full max-w-md p-14 shadow-2xl animate-in zoom-in-95 duration-300 border-t-[12px] border-red-600">
              <h3 className="text-4xl font-black text-gray-900 mb-10 tracking-tighter">API & Integração</h3>
              <div className="space-y-8">
                 <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Provedor</label>
                    <input type="text" value={newConn.provider} onChange={e => setNewConn({...newConn, provider: e.target.value})} placeholder="Ex: iFood Marketplace" className="w-full p-6 bg-gray-50 rounded-[28px] border-none outline-none focus:ring-4 focus:ring-red-100 font-black text-xl" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Token de Acesso</label>
                    <div className="relative">
                      <Key className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={24} />
                      <input type="password" placeholder="••••••••••••••••" className="w-full pl-16 pr-6 py-6 bg-gray-50 rounded-[28px] border-none outline-none focus:ring-4 focus:ring-red-100 font-mono" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    {['IFOOD', 'FISCAL', 'RAPPI', 'BANK'].map(type => (
                      <button key={type} onClick={() => setNewConn({...newConn, type: type as any})} className={`py-4 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest ${newConn.type === type ? 'bg-red-600 text-white shadow-xl shadow-red-100' : 'bg-gray-50 text-gray-400'}`}>{type}</button>
                    ))}
                 </div>
              </div>
              <div className="flex gap-4 mt-12">
                 <button onClick={addConnection} className="flex-1 py-6 bg-red-600 text-white font-black rounded-[28px] shadow-2xl shadow-red-100 hover:bg-red-700 transition-all uppercase tracking-[0.2em]">Vincular</button>
                 <button onClick={() => setShowConnectionModal(false)} className="flex-1 py-6 bg-gray-50 text-gray-400 font-black rounded-[28px] hover:bg-gray-100 transition-all uppercase tracking-[0.2em]">Desistir</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
