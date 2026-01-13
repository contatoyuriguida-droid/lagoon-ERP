
import React, { useState } from 'react';
import { Printer as PrinterIcon, Wifi, Globe, ShieldCheck, Zap, Database, Server, RefreshCw, Plus, Trash2, Check, X, Key } from 'lucide-react';
import { Printer, Connection } from '../types';

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Impressoras */}
        <section className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-2xl shadow-gray-100/50 space-y-8 relative overflow-hidden">
           <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-5">
                 <div className="p-5 bg-red-600 text-white rounded-3xl shadow-xl shadow-red-100 rotate-3 group hover:rotate-0 transition-transform"><PrinterIcon size={32} /></div>
                 <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Impressoras</h2>
                    <p className="text-sm text-gray-400 font-medium">Pontos de impressão térmica</p>
                 </div>
              </div>
              <button 
                onClick={() => setShowPrinterModal(true)}
                className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-90"
              >
                <Plus size={24} />
              </button>
           </div>

           <div className="space-y-4 relative z-10">
              {printers.map(p => (
                <div key={p.id} className="p-6 bg-gray-50 rounded-3xl flex items-center justify-between border-2 border-transparent hover:border-red-100 transition-all group">
                   <div className="flex items-center gap-5">
                      <div className={`w-4 h-4 rounded-full border-4 border-white shadow-sm ${p.status === 'ONLINE' ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <div>
                         <p className="font-black text-gray-800 text-lg leading-tight">{p.name}</p>
                         <p className="text-[10px] text-gray-400 font-black tracking-widest uppercase">{p.type} • IP: {p.ip}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => removePrinter(p.id)} className="p-2 text-gray-300 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                      <button className="px-4 py-2 bg-white text-gray-400 text-[10px] font-black rounded-xl border border-gray-100 hover:border-red-600 hover:text-red-600 shadow-sm transition-all uppercase tracking-widest">Teste</button>
                   </div>
                </div>
              ))}
           </div>
           <div className="absolute top-0 right-0 opacity-[0.03] translate-x-1/4 -translate-y-1/4">
             <PrinterIcon size={300} />
           </div>
        </section>

        {/* Integrações */}
        <section className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-2xl shadow-gray-100/50 space-y-8 relative overflow-hidden">
           <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-5">
                 <div className="p-5 bg-red-50 text-red-600 rounded-3xl shadow-lg -rotate-3"><Wifi size={32} /></div>
                 <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Conexões & APIs</h2>
                    <p className="text-sm text-gray-400 font-medium">Integração com ecossistema externo</p>
                 </div>
              </div>
              <button 
                onClick={() => setShowConnectionModal(true)}
                className="w-12 h-12 bg-red-600 text-white rounded-2xl flex items-center justify-center hover:bg-red-700 transition-all shadow-xl shadow-red-100 active:scale-90"
              >
                <Plus size={24} />
              </button>
           </div>

           <div className="space-y-4 relative z-10">
              {connections.map(c => (
                <div key={c.id} className="p-6 bg-gray-50 rounded-3xl flex items-center justify-between border-2 border-transparent hover:border-red-100 transition-all">
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
                      {c.status === 'CONNECTED' ? 'LINK ATIVO' : 'ERRO CONEXÃO'}
                   </div>
                </div>
              ))}
           </div>
           <div className="absolute bottom-0 right-0 opacity-[0.03] translate-x-1/4 translate-y-1/4">
             <Wifi size={300} />
           </div>
        </section>

        {/* Global ERP Settings */}
        <section className="lg:col-span-2 bg-gray-900 rounded-[50px] p-12 text-white shadow-2xl shadow-red-100/20 relative overflow-hidden group">
           <div className="flex items-center gap-6 relative z-10 mb-12">
              <div className="p-6 bg-red-600 text-white rounded-[35px] shadow-2xl shadow-red-600/50 group-hover:scale-110 transition-transform duration-500"><Server size={40} /></div>
              <div>
                 <h2 className="text-4xl font-black tracking-tight">Sincronização Lagoon</h2>
                 <p className="text-red-400 font-bold uppercase tracking-[0.3em] text-xs">Administração Central de Dados</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
              <SettingCard icon={<Database size={24} />} title="Backup Automático" desc="Sua base de dados é salva localmente e na nuvem a cada fechamento de comanda." />
              <SettingCard icon={<Globe size={24} />} title="Cloud Dashboard" desc="Acesso remoto ao seu restaurante de qualquer lugar do mundo via Lagoon Link." />
              <SettingCard icon={<ShieldCheck size={24} />} title="Segurança & LGPD" desc="Criptografia de ponta a ponta para dados de clientes e funcionários." />
           </div>

           <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-red-600/10 to-transparent pointer-events-none" />
        </section>
      </div>

      {/* Printer Modal */}
      {showPrinterModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-6">
           <div className="bg-white rounded-[50px] w-full max-w-md p-12 shadow-2xl animate-in zoom-in-95 duration-300">
              <h3 className="text-3xl font-black text-gray-900 mb-8 tracking-tight">Configurar Impressora</h3>
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Identificação</label>
                    <input type="text" value={newPrinter.name} onChange={e => setNewPrinter({...newPrinter, name: e.target.value})} placeholder="Ex: Impressora Balcão" className="w-full p-5 bg-gray-50 rounded-3xl border-none outline-none focus:ring-2 focus:ring-red-500 font-bold text-lg" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Endereço IP da Rede</label>
                    <input type="text" value={newPrinter.ip} onChange={e => setNewPrinter({...newPrinter, ip: e.target.value})} placeholder="192.168.1.XX" className="w-full p-5 bg-gray-50 rounded-3xl border-none outline-none focus:ring-2 focus:ring-red-500 font-mono text-lg" />
                 </div>
                 <div className="grid grid-cols-3 gap-2">
                    {['COZINHA', 'CAIXA', 'BAR'].map(type => (
                      <button key={type} onClick={() => setNewPrinter({...newPrinter, type: type as any})} className={`py-3 rounded-2xl text-[10px] font-black transition-all ${newPrinter.type === type ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400'}`}>{type}</button>
                    ))}
                 </div>
              </div>
              <div className="flex gap-4 mt-10">
                 <button onClick={addPrinter} className="flex-1 py-5 bg-red-600 text-white font-black rounded-3xl shadow-xl shadow-red-100 hover:bg-red-700 transition-all uppercase tracking-widest">Salvar</button>
                 <button onClick={() => setShowPrinterModal(false)} className="flex-1 py-5 bg-gray-50 text-gray-400 font-black rounded-3xl hover:bg-gray-100 transition-all uppercase tracking-widest">Desistir</button>
              </div>
           </div>
        </div>
      )}

      {/* Connection Modal */}
      {showConnectionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-6">
           <div className="bg-white rounded-[50px] w-full max-w-md p-12 shadow-2xl animate-in zoom-in-95 duration-300">
              <h3 className="text-3xl font-black text-gray-900 mb-8 tracking-tight">Nova Integração</h3>
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Provedor de Serviço</label>
                    <input type="text" value={newConn.provider} onChange={e => setNewConn({...newConn, provider: e.target.value})} placeholder="Ex: iFood, Rappi, Stone..." className="w-full p-5 bg-gray-50 rounded-3xl border-none outline-none focus:ring-2 focus:ring-red-500 font-bold text-lg" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Chave API / Token</label>
                    <div className="relative">
                      <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                      <input type="password" placeholder="••••••••••••••••" className="w-full pl-14 pr-5 py-5 bg-gray-50 rounded-3xl border-none outline-none focus:ring-2 focus:ring-red-500 font-mono" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    {['IFOOD', 'FISCAL', 'RAPPI', 'BANK'].map(type => (
                      <button key={type} onClick={() => setNewConn({...newConn, type: type as any})} className={`py-3 rounded-2xl text-[10px] font-black transition-all ${newConn.type === type ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400'}`}>{type}</button>
                    ))}
                 </div>
              </div>
              <div className="flex gap-4 mt-10">
                 <button onClick={addConnection} className="flex-1 py-5 bg-red-600 text-white font-black rounded-3xl shadow-xl shadow-red-100 hover:bg-red-700 transition-all uppercase tracking-widest">CONECTAR</button>
                 <button onClick={() => setShowConnectionModal(false)} className="flex-1 py-5 bg-gray-50 text-gray-400 font-black rounded-3xl hover:bg-gray-100 transition-all uppercase tracking-widest">CANCELAR</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const SettingCard = ({ icon, title, desc }: any) => (
  <div className="p-8 bg-white/5 rounded-[40px] border border-white/10 hover:bg-white/10 transition-all cursor-pointer group">
    <div className="p-4 bg-white/5 text-red-500 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform duration-500">{icon}</div>
    <h3 className="text-xl font-black mb-2 group-hover:text-red-500 transition-colors">{title}</h3>
    <p className="text-sm text-gray-400 leading-relaxed font-medium">{desc}</p>
  </div>
);

export default Settings;
