
import React from 'react';
import { Printer as PrinterIcon, Wifi, Globe, ShieldCheck, Zap, Database, Server, RefreshCw } from 'lucide-react';
import { Printer, Connection } from '../types';

interface SettingsProps {
  printers: Printer[];
  setPrinters: React.Dispatch<React.SetStateAction<Printer[]>>;
  connections: Connection[];
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>>;
}

const Settings: React.FC<SettingsProps> = ({ printers, setPrinters, connections, setConnections }) => {
  return (
    <div className="space-y-8 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Printer Management */}
        <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="p-3 bg-red-50 text-red-600 rounded-2xl"><PrinterIcon size={24} /></div>
                 <div>
                    <h2 className="text-xl font-black text-gray-900">Impressoras</h2>
                    <p className="text-xs text-gray-400">Gerenciamento de rede térmica</p>
                 </div>
              </div>
              <button className="px-4 py-2 bg-red-600 text-white text-xs font-black rounded-xl shadow-lg shadow-red-100">CADASTRAR</button>
           </div>

           <div className="space-y-3">
              {printers.map(p => (
                <div key={p.id} className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between border border-transparent hover:border-red-100 transition-all">
                   <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${p.status === 'ONLINE' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                      <div>
                         <p className="font-bold text-gray-800">{p.name}</p>
                         <p className="text-[10px] text-gray-400 font-mono">{p.ip} • {p.type}</p>
                      </div>
                   </div>
                   <button className="text-[10px] font-black text-red-600 bg-white px-3 py-1.5 rounded-lg border border-red-50">TESTAR</button>
                </div>
              ))}
           </div>
        </section>

        {/* Connections & Integrations */}
        <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="p-3 bg-red-50 text-red-600 rounded-2xl"><Wifi size={24} /></div>
                 <div>
                    <h2 className="text-xl font-black text-gray-900">Conexões & APIs</h2>
                    <p className="text-xs text-gray-400">Hub de integrações externas</p>
                 </div>
              </div>
              <button className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:text-red-600 transition-colors"><RefreshCw size={18} /></button>
           </div>

           <div className="space-y-3">
              {connections.map(c => (
                <div key={c.id} className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="p-2 bg-white rounded-xl shadow-sm">
                         {c.type === 'IFOOD' ? <Zap size={16} className="text-red-500" /> : <ShieldCheck size={16} className="text-blue-500" />}
                      </div>
                      <div>
                         <p className="font-bold text-gray-800">{c.provider}</p>
                         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{c.status}</p>
                      </div>
                   </div>
                   <div className={`px-3 py-1 rounded-full text-[10px] font-black ${c.status === 'CONNECTED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {c.status === 'CONNECTED' ? 'ATIVO' : 'DESCONECTADO'}
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* Global ERP Settings */}
        <section className="lg:col-span-2 bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm space-y-8">
           <div className="flex items-center gap-4">
              <div className="p-4 bg-red-600 text-white rounded-3xl shadow-xl shadow-red-200"><Server size={32} /></div>
              <div>
                 <h2 className="text-3xl font-black text-gray-900">Configuração do Sistema</h2>
                 <p className="text-gray-400 font-medium">Parâmetros globais do Lagoon GastroBar</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
              <div className="space-y-4 p-6 bg-gray-50 rounded-3xl border border-transparent hover:border-red-100 transition-all cursor-pointer group">
                 <div className="p-3 bg-white text-gray-400 group-hover:text-red-600 rounded-2xl w-fit transition-colors"><Database size={24} /></div>
                 <div>
                    <h3 className="font-black text-gray-800">Backup Automático</h3>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">Sincronização na nuvem a cada 5 minutos com cópia offline local.</p>
                 </div>
              </div>
              
              <div className="space-y-4 p-6 bg-gray-50 rounded-3xl border border-transparent hover:border-red-100 transition-all cursor-pointer group">
                 <div className="p-3 bg-white text-gray-400 group-hover:text-red-600 rounded-2xl w-fit transition-colors"><Globe size={24} /></div>
                 <div>
                    <h3 className="font-black text-gray-800">Cardápio Digital</h3>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">Gerencie o link do seu QR Code e ative/desative o autoatendimento.</p>
                 </div>
              </div>

              <div className="space-y-4 p-6 bg-gray-50 rounded-3xl border border-transparent hover:border-red-100 transition-all cursor-pointer group">
                 <div className="p-3 bg-white text-gray-400 group-hover:text-red-600 rounded-2xl w-fit transition-colors"><ShieldCheck size={24} /></div>
                 <div>
                    <h3 className="font-black text-gray-800">Fiscal & Tributário</h3>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">Configuração de impostos, alíquotas de ICMS e certificados A1/A3.</p>
                 </div>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
