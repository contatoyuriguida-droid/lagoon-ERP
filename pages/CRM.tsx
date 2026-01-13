
import React from 'react';
import { Gift, Heart, UserPlus, MessageSquare, Star, Search } from 'lucide-react';
import { Customer } from '../types.ts';

interface CRMProps {
  customers: Customer[];
}

const CRM: React.FC<CRMProps> = ({ customers }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-bold">Fidelidade Lagoon</h2>
         <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm">
           <UserPlus size={18} /> Cadastrar Cliente
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
           <div className="p-3 bg-red-50 text-red-600 rounded-xl"><Gift /></div>
           <div><p className="text-xs text-gray-400 font-bold">TOTAL PONTOS</p><p className="text-2xl font-bold">{customers.reduce((s,c)=>s+c.points,0)}</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
           <div className="p-3 bg-red-50 text-red-600 rounded-xl"><Heart /></div>
           <div><p className="text-xs text-gray-400 font-bold">CLIENTES ATIVOS</p><p className="text-2xl font-bold">{customers.length}</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
           <div className="p-3 bg-red-50 text-red-600 rounded-xl"><Star /></div>
           <div><p className="text-xs text-gray-400 font-bold">LTV MÉDIO</p><p className="text-2xl font-bold">R$ {(customers.reduce((s,c)=>s+c.spent,0)/customers.length).toFixed(0)}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
           <thead className="bg-gray-50 text-xs text-gray-400 font-bold uppercase">
              <tr>
                 <th className="px-6 py-4">Cliente</th>
                 <th className="px-6 py-4">Consumo Total</th>
                 <th className="px-6 py-4">Pontos Atuais</th>
                 <th className="px-6 py-4">Preferências</th>
                 <th className="px-6 py-4">Ação</th>
              </tr>
           </thead>
           <tbody className="text-sm divide-y divide-gray-50">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                   <td className="px-6 py-4 font-bold">{c.name}</td>
                   <td className="px-6 py-4">R$ {c.spent.toFixed(2)}</td>
                   <td className="px-6 py-4"><span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold">{c.points} pts</span></td>
                   <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {c.prefs.map(p => <span key={p} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500">{p}</span>)}
                      </div>
                   </td>
                   <td className="px-6 py-4">
                      <button className="text-red-600 font-bold text-xs">Histórico</button>
                   </td>
                </tr>
              ))}
           </tbody>
        </table>
      </div>
    </div>
  );
};

export default CRM;
