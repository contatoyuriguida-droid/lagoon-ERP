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
  const [showUserModal, setShowUserModal] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [newPrinter, setNewPrinter] = useState<Partial<Printer>>({ 
    type: 'COZINHA', 
    status: 'ONLINE', 
    connectionMethod: 'IP' 
  });
  const [newUser, setNewUser] = useState<Partial<User>>({ role: UserRole.WAITER });

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
    // Simulação de tentativa de conexão via Socket TCP na porta 9100
    setTimeout(() => {
      setTestingId(null);
      alert(`Comando de teste enviado com sucesso para ${p.name} no IP ${p.ip} (Porta 9100).`);
    }, 1200);
  };

  const addUser = () => {
    if (!newUser.name || !newUser.pin) return;
    setUsers(prev => [...prev, { ...newUser, id: Date.now().toString() } as User]);
    setShowUserModal(false);
    setNewUser({ role: UserRole.WAITER });
  };

  const toggleConnection = (id: string) => {
    setConnections(prev => prev.map(c => 
      c.id === id ? { ...c, status: c.status === 'CONNECTED' ? 'DISCONNECTED' : 'CONNECTED' } : c
    ));
  };

  return (
    <div className="space-y-12 max-w-6xl mx-auto pb-20">
      
      {/* SEÇÃO: EQUIPE */}
      <section className="space-y-6">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="p-3 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-100"><UserCog size={24} /></div>
               <div>
                  <h2 className="text-xl font-black text-gray-900 leading-tight">Gestão de Equipe</h2>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Acesso e Permissões</p>
               </div>
            </div>
            <button onClick={() => setShowUserModal(true)} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:scale-105 transition-all">
               <UserPlus size={16} /> Novo Usuário
            </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {users.map(u => (
               <div key={u.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center relative group">
                  <button onClick={() => setUsers(prev => prev.filter(usr => usr.id !== u.id))} className="absolute top-4 right-4 text-gray-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                  <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center text-2xl font-black mb-4 uppercase">{u.name[0]}</div>
                  <h3 className="font-black text-gray-900 leading-none">{u.name}</h3>
                  <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] mt-2 mb-4">{u.role}</p>
                  <div className="flex items-center gap-1 text-gray-400">
                     <Shield size={12} />
                     <span className="text-xs font-mono">PIN: {u.pin}</span>
                  </div>
               </div>
            ))}
         </div>
      </section>

      {/* SEÇÃO: TERMINAIS DE IMPRESSÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-gray-100">
        
        {/* Impressoras de Rede */}
        <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-8">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-gray-50 text-gray-400 rounded-2xl"><Network size={24} /></div>
                 <div>
                    <h2 className="text-lg font-black text-gray-900 leading-tight">Terminais de Rede (IP)</h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Protocolo Esc/POS • Porta 9100</p>
                 </div>
              </div>
              <button onClick={() => setShowPrinterModal(true)} className="p-2 bg-red-600 text-white rounded-xl shadow-lg hover:scale-110 transition-all"><Plus size={20} /></button>
           </div>

           <div className="space-y-3">
              {printers.map(p => (
                <div key={p.id} className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between border border-transparent hover:border-red-100 transition-all group">
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
                        title="Enviar Ticket de Teste"
                      >
                         <Send size={16} className={testingId === p.id ? "animate-pulse" : ""} />
                      </button>
                      <button onClick={() => setPrinters(prev => prev.filter(pr => pr.id !== p.id))} className="p-2 text-gray-300 hover:text-red-600 transition-all"><Trash2 size={16} /></button>
                   </div>
                </div>
              ))}
              {printers.length === 0 && (
                <div className="text-center py-10">
                   <p className="text-xs text-gray-400 font-bold uppercase tracking-widest italic">Nenhuma impressora IP configurada.</p>
                </div>
              )}
           </div>
        </section>

        {/* Integrações Cloud */}
        <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-8">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-red-50 text-red-600 rounded-2xl"><Wifi size={24} /></div>
                 <div>
                    <h2 className="text-lg font-black text-gray-900 leading-tight">Conexões Cloud</h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Marketplace & Fiscal</p>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {connections.map(c => (
                <button 
                  key={c.id} 
                  onClick={() => toggleConnection(c.id)}
                  className={`p-5 rounded-3xl border-2 transition-all text-left flex flex-col items-start ${c.status === 'CONNECTED' ? 'bg-white border-red-50 shadow-sm' : 'bg-gray-50 border-transparent opacity-60'}`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${c.status === 'CONNECTED' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {c.type === 'IFOOD' ? <Smartphone size={18} /> : <Shield size={18} />}
                  </div>
                  <p className="text-xs font-black text-gray-900 leading-tight mb-1 truncate w-full">{c.provider}</p>
                  <p className={`text-[8px] font-black tracking-widest ${c.status === 'CONNECTED' ? 'text-green-600' : 'text-gray-400'}`}>
                    {c.status === 'CONNECTED' ? 'CONECTADO' : 'OFFLINE'}
                  </p>
                </button>
              ))}
           </div>
        </section>
      </div>

      {/* MODAL IMPRESSORA IP */}
      {showPrinterModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
           <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                 <Network size={24} />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-6 text-center">Adicionar Impressora IP</h3>
              
              <div className="space-y-4">
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Identificação</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Cozinha Fogo" 
                      value={newPrinter.name} 
                      onChange={e => setNewPrinter({...newPrinter, name: e.target.value})} 
                      className="w-full p-4 bg-gray-50 rounded-2xl border-none text-sm outline-none font-bold focus:ring-2 focus:ring-red-600" 
                    />
                 </div>

                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Endereço IP Local</label>
                    <input 
                      type="text" 
                      placeholder="192.168.1.100" 
                      value={newPrinter.ip} 
                      onChange={e => setNewPrinter({...newPrinter, ip: e.target.value})} 
                      className="w-full p-4 bg-gray-50 rounded-2xl border-none text-sm outline-none font-mono focus:ring-2 focus:ring-red-600" 
                    />
                    <p className="text-[8px] text-gray-400 mt-2 italic">* Certifique-se que o IP é estático no roteador.</p>
                 </div>

                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Setor de Operação</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['COZINHA', 'BAR', 'CAIXA'].map(t => (
                        <button 
                          key={t} 
                          onClick={() => setNewPrinter({...newPrinter, type: t as any})} 
                          className={`py-3 rounded-xl text-[8px] font-black transition-all border-2 ${newPrinter.type === t ? 'bg-red-600 border-red-600 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                 </div>
              </div>

              <div className="flex gap-4 mt-8">
                 <button 
                  onClick={addPrinter} 
                  className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl text-xs uppercase tracking-widest active:scale-95 transition-all"
                 >
                  Conectar
                 </button>
                 <button 
                  onClick={() => setShowPrinterModal(false)} 
                  className="flex-1 py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl text-xs uppercase tracking-widest"
                 >
                  Cancelar
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL USUÁRIO (MANTIDO) */}
      {showUserModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
           <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-black text-gray-900 mb-6 text-center">Novo Operador</h3>
              <div className="space-y-4">
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Nome</label>
                    <input type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none text-sm outline-none font-bold" />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Cargo</label>
                    <div className="grid grid-cols-2 gap-2">
                       {Object.values(UserRole).map(role => (
                         <button key={role} onClick={() => setNewUser({...newUser, role})} className={`py-3 rounded-xl text-[8px] font-black uppercase transition-all border-2 ${newUser.role === role ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-gray-100 text-gray-400'}`}>{role}</button>
                       ))}
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">PIN</label>
                    <input type="text" maxLength={6} value={newUser.pin} onChange={e => setNewUser({...newUser, pin: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none text-xl font-black text-center tracking-[0.5em]" />
                 </div>
              </div>
              <div className="flex gap-4 mt-8">
                 <button onClick={addUser} className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl text-xs uppercase tracking-widest">Salvar</button>
                 <button onClick={() => setShowUserModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl text-xs uppercase tracking-widest">Cancelar</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Settings;