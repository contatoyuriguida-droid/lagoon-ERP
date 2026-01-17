
import React, { useState } from 'react';
import { UserCog, UserPlus, Shield, Trash2, Key, User as UserIcon, X, Check, ShieldCheck, ShieldAlert, Star, Users as UsersIcon } from 'lucide-react';
import { User, UserRole } from '../types.ts';

interface UsersPageProps {
  users: User[];
  onSaveUsers: (users: User[]) => Promise<void>;
}

const UsersPage: React.FC<UsersPageProps> = ({ users, onSaveUsers }) => {
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({ role: UserRole.WAITER });
  const [isSaving, setIsSaving] = useState(false);

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.pin) {
      alert("Por favor, preencha o nome e o PIN de acesso.");
      return;
    }
    
    setIsSaving(true);
    try {
      const userToAdd: User = {
        id: `usr-${Date.now()}`,
        name: newUser.name,
        role: newUser.role as UserRole,
        pin: newUser.pin,
        avatar: newUser.name[0].toUpperCase()
      };
      
      await onSaveUsers([...users, userToAdd]);
      setShowModal(false);
      setNewUser({ role: UserRole.WAITER });
    } catch (e) {
      alert("Erro ao salvar usuário.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (users.length <= 1) {
      alert("O sistema precisa de pelo menos um administrador.");
      return;
    }
    
    if (confirm("Deseja realmente remover este colaborador da equipe?")) {
      await onSaveUsers(users.filter(u => u.id !== id));
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return <span className="px-3 py-1 bg-red-600 text-white rounded-full text-[8px] font-black uppercase tracking-widest">ADMIN</span>;
      case UserRole.MANAGER: return <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-[8px] font-black uppercase tracking-widest">GERENTE</span>;
      case UserRole.WAITER: return <span className="px-3 py-1 bg-green-600 text-white rounded-full text-[8px] font-black uppercase tracking-widest">GARÇOM</span>;
      case UserRole.CHEF: return <span className="px-3 py-1 bg-orange-600 text-white rounded-full text-[8px] font-black uppercase tracking-widest">CHEF</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-red-600 text-white rounded-[24px] shadow-xl shadow-red-100">
            <UsersIcon size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none uppercase">Equipe Lagoon</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-2">Gestão de Acessos e Operadores</p>
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto px-8 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-100 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <UserPlus size={18} /> Novo Colaborador
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {users.map((u) => (
          <div key={u.id} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm relative group hover:border-red-200 transition-all text-center flex flex-col items-center">
            <button 
              onClick={() => handleDeleteUser(u.id)}
              className="absolute top-6 right-6 p-2 text-gray-200 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 size={18} />
            </button>
            
            <div className="w-20 h-20 bg-gray-50 rounded-[24px] flex items-center justify-center text-3xl font-black text-gray-800 mb-4 group-hover:bg-red-600 group-hover:text-white transition-all shadow-inner">
              {u.avatar || u.name[0]}
            </div>
            
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight leading-none mb-2">{u.name}</h3>
            <div className="mb-6">{getRoleBadge(u.role)}</div>
            
            <div className="w-full pt-6 border-t border-gray-50 flex items-center justify-center gap-2 text-gray-400">
              <Key size={14} />
              <span className="text-xs font-mono font-bold tracking-[0.3em]">PIN: ****</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-xl p-6">
          <div className="bg-white rounded-[40px] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                 <div className="p-3 bg-red-600 text-white rounded-2xl"><UserPlus size={20} /></div>
                 <h3 className="text-xl font-black text-gray-900 uppercase">Novo Acesso</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 bg-gray-50 text-gray-400 rounded-xl"><X size={20} /></button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Operador</label>
                <input 
                  type="text" 
                  value={newUser.name || ''} 
                  onChange={e => setNewUser({...newUser, name: e.target.value})}
                  className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-red-600 shadow-sm"
                  placeholder="Ex: Pedro Silva"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cargo / Permissões</label>
                <div className="grid grid-cols-2 gap-2">
                  {[UserRole.ADMIN, UserRole.MANAGER, UserRole.WAITER, UserRole.CHEF].map(role => (
                    <button 
                      key={role}
                      onClick={() => setNewUser({...newUser, role})}
                      className={`py-3 rounded-xl text-[8px] font-black uppercase transition-all border-2 ${newUser.role === role ? 'bg-red-600 border-red-600 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400'}`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">PIN de Acesso (4-6 dígitos)</label>
                <input 
                  type="password" 
                  maxLength={6}
                  value={newUser.pin || ''} 
                  onChange={e => setNewUser({...newUser, pin: e.target.value})}
                  className="w-full p-5 bg-gray-900 text-white text-3xl font-black rounded-2xl border-none outline-none text-center tracking-[0.5em] shadow-xl"
                  placeholder="****"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={handleAddUser}
                  disabled={isSaving}
                  className="flex-1 py-5 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-100 uppercase text-xs tracking-widest active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSaving ? 'SALVANDO...' : 'CRIAR ACESSO'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
