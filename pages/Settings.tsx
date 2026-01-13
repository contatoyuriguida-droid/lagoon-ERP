
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
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Terminal Section */}
        <section className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-6">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-red-600 text-white rounded-xl"><PrinterIcon size={20} /></div>
                 <div>
                    <h2 className="text-base font-bold text-gray-900 leading-tight">Terminais de Impressão</h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Rede Local (TCP/IP)</p>
                 </div>
              </div>
              <button onClick={() => setShowPrinterModal(true)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"><Plus size={18} /></button>
           </div>

           <div className="space-y-3">
              {printers.map(p => (
                <div key={p.id} className="p-4 bg-gray-50 rounded-xl flex items-center justify-between border border-transparent hover:border-red-200 group">
                   <div className="flex items-center gap-4">
                      <div className={`w-2.5 h-2.5 rounded-full ${p.status === 'ONLINE' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                      <div>
                         <p className="font-bold text-gray-800 text-sm leading-tight">{p.name}</p>
                         <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">IP: {p.ip} • {p.type}</p>
                      </div>
                   </div>
                   <button onClick={() => removePrinter(p.id)} className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-600 transition-all"><Trash2 size={16} /></button>
                </div>
              ))}
           </div>
        </section>

        {/* Connections Section */}
        <section className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-6">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-red-50 text-red-600 rounded-xl"><Wifi size={20} /></div>
                 <div>
                    <h2 className="text-base font-bold text-gray-900 leading-tight">Integrações Digitais</h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Delivery & Fiscal</p>
                 </div>
              </div>
              <button onClick={() => setShowConnectionModal(true)} className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-sm"><Plus size={18} /></button>
           </div>

           <div className="space-y-3">
              {connections.map(c => (
                <div key={c.id} className="p-4 bg-gray-50 rounded-xl flex items-center justify-between border border-transparent hover:border-red-200">
                   <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg bg-white border border-gray-100 ${c.status === 'CONNECTED' ? 'text-red-600' : 'text-gray-300'}`}>
                         {c.type === 'IFOOD' ? <Zap size={16} /> : <ShieldCheck size={16} />}
                      </div>
                      <div>
                         <p className="font-bold text-gray-800 text-sm leading-tight">{c.provider}</p>
                         <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{c.type}</p>
                      </div>
                   </div>
                   <div className={`px-2 py-1 rounded text-[9px] font-bold border ${c.status === 'CONNECTED' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                      {c.status === 'CONNECTED' ? 'ATIVA' : 'FALHA'}
                   </div>
                </div>
              ))}
           </div>
        </section>
      </div>

      {/* Printer Modal Refined */}
      {showPrinterModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-white rounded-2xl w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Cadastrar Impressora</h3>
              <div className="space-y-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Nome Amigável</label>
                    <input type="text" value={newPrinter.name} onChange={e => setNewPrinter({...newPrinter, name: e.target.value})} placeholder="Cozinha Central" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-red-500 outline-none" />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">IP na Rede Local</label>
                    <input type="text" value={newPrinter.ip} onChange={e => setNewPrinter({...newPrinter, ip: e.target.value})} placeholder="192.168.1.100" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-red-500 outline-none font-mono" />
                 </div>
                 <div className="flex gap-2">
                    {['COZINHA', 'CAIXA', 'BAR'].map(type => (
                      <button key={type} onClick={() => setNewPrinter({...newPrinter, type: type as any})} className={`flex-1 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border ${newPrinter.type === type ? 'bg-red-600 text-white border-red-600 shadow-md' : 'bg-white text-gray-400 border-gray-200 hover:border-red-300'}`}>{type}</button>
                    ))}
                 </div>
              </div>
              <div className="flex gap-3 mt-8">
                 <button onClick={addPrinter} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-md hover:bg-red-700 active:scale-95 transition-all text-xs uppercase tracking-widest">Salvar</button>
                 <button onClick={() => setShowPrinterModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl text-xs uppercase tracking-widest">Cancelar</button>
              </div>
           </div>
        </div>
      )}

      {/* Connection Modal Refined */}
      {showConnectionModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-white rounded-2xl w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Nova Integração</h3>
              <div className="space-y-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Provedor</label>
                    <input type="text" value={newConn.provider} onChange={e => setNewConn({...newConn, provider: e.target.value})} placeholder="iFood Marketplace" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-red-500" />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Chave de API / Token</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                      <input type="password" placeholder="••••••••••••••••" className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm outline-none" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    {['IFOOD', 'FISCAL', 'RAPPI', 'BANK'].map(type => (
                      <button key={type} onClick={() => setNewConn({...newConn, type: type as any})} className={`py-2 rounded-lg text-[9px] font-bold uppercase transition-all border ${newConn.type === type ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-400 border-gray-200'}`}>{type}</button>
                    ))}
                 </div>
              </div>
              <div className="flex gap-3 mt-8">
                 <button onClick={addConnection} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-md text-xs uppercase tracking-widest">Vincular</button>
                 <button onClick={() => setShowConnectionModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl text-xs uppercase tracking-widest">Sair</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
