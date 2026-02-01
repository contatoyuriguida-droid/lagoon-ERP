
import React, { useState, useMemo } from 'react';
import { Search, Calendar, User as UserIcon, ReceiptText, DollarSign, Filter, CreditCard, Banknote, Smartphone, Wallet, ArrowRight } from 'lucide-react';
import { Transaction, User, PaymentMethod } from '../types.ts';

interface TransactionsPageProps {
  transactions: Transaction[];
  users: User[];
}

const TransactionsPage: React.FC<TransactionsPageProps> = ({ transactions, users }) => {
  const [dateStart, setDateStart] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dateEnd, setDateEnd] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedUser, setSelectedUser] = useState<string>('ALL');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const txDate = new Date(t.timestamp);
      txDate.setHours(0, 0, 0, 0);
      
      const start = new Date(dateStart);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(dateEnd);
      end.setHours(23, 59, 59, 999);

      const matchesDate = txDate >= start && txDate <= end;
      const matchesUser = selectedUser === 'ALL' || t.userId === selectedUser;

      return matchesDate && matchesUser;
    });
  }, [transactions, dateStart, dateEnd, selectedUser]);

  const totalSum = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  const getMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CASH: return <Banknote size={14} />;
      case PaymentMethod.PIX: return <Smartphone size={14} />;
      case PaymentMethod.CREDIT: return <CreditCard size={14} />;
      case PaymentMethod.DEBIT: return <Wallet size={14} />;
      default: return <DollarSign size={14} />;
    }
  };

  const getMethodBadge = (method: PaymentMethod) => {
    const baseClass = "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ";
    switch (method) {
      case PaymentMethod.CASH: return <span className={baseClass + "bg-green-100 text-green-700"}>{getMethodIcon(method)} Dinheiro</span>;
      case PaymentMethod.PIX: return <span className={baseClass + "bg-blue-100 text-blue-700"}>{getMethodIcon(method)} Pix</span>;
      case PaymentMethod.CREDIT: return <span className={baseClass + "bg-purple-100 text-purple-700"}>{getMethodIcon(method)} Crédito</span>;
      case PaymentMethod.DEBIT: return <span className={baseClass + "bg-orange-100 text-orange-700"}>{getMethodIcon(method)} Débito</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-8 pb-32 relative">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-red-600 text-white rounded-3xl shadow-xl shadow-red-100">
            <ReceiptText size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none uppercase">Auditoria de Caixa</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-2">Histórico detalhado de vendas</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center bg-white p-2 rounded-2xl border border-gray-100 shadow-sm gap-2">
            <Calendar size={16} className="text-red-600 ml-2" />
            <input 
              type="date" 
              value={dateStart} 
              onChange={(e) => setDateStart(e.target.value)}
              className="bg-transparent border-none outline-none font-black text-[10px] uppercase"
            />
            <ArrowRight size={14} className="text-gray-300" />
            <input 
              type="date" 
              value={dateEnd} 
              onChange={(e) => setDateEnd(e.target.value)}
              className="bg-transparent border-none outline-none font-black text-[10px] uppercase"
            />
          </div>

          <div className="flex items-center bg-white p-2 rounded-2xl border border-gray-100 shadow-sm gap-2">
            <UserIcon size={16} className="text-red-600 ml-2" />
            <select 
              value={selectedUser} 
              onChange={(e) => setSelectedUser(e.target.value)}
              className="bg-transparent border-none outline-none font-black text-[10px] uppercase min-w-[120px]"
            >
              <option value="ALL">TODOS OPERADORES</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-8 py-6">Data/Hora</th>
                <th className="px-8 py-6">Mesa/Comanda</th>
                <th className="px-8 py-6">Operador</th>
                <th className="px-8 py-6">Pagamento</th>
                <th className="px-8 py-6 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-red-50/30 transition-colors">
                  <td className="px-8 py-5">
                    <p className="text-xs font-black text-gray-800">{new Date(tx.timestamp).toLocaleDateString()}</p>
                    <p className="text-[10px] text-gray-400 font-bold">{new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-[11px] font-black text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">
                      {tx.tableId === 0 ? 'BALCÃO' : `MESA ${tx.tableId}`}
                    </span>
                    <p className="text-[9px] text-gray-400 font-bold mt-1 ml-1 uppercase">#{tx.comandaId}</p>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center text-white text-[10px] font-black">
                        {tx.userName[0]}
                      </div>
                      <span className="text-xs font-black text-gray-700 uppercase">{tx.userName}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    {getMethodBadge(tx.paymentMethod)}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className="text-sm font-black text-gray-900">R$ {tx.amount.toFixed(2)}</span>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center opacity-20">
                    <ReceiptText size={64} className="mx-auto mb-4" />
                    <p className="font-black text-sm uppercase tracking-widest">Nenhuma transação no período</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RODAPÉ DE TOTALIZAÇÃO */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-50">
        <div className="bg-gray-900 text-white p-6 rounded-3xl shadow-2xl flex items-center justify-between border-4 border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-red-600 rounded-2xl">
                <DollarSign size={24} />
             </div>
             <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total do Período Filtrado</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{filteredTransactions.length} Vendas Realizadas</p>
             </div>
          </div>
          <div className="text-right">
             <h2 className="text-4xl font-black tracking-tighter">
                R$ {totalSum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
             </h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;
