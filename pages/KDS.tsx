import React, { useState } from 'react';
import { Clock, CheckCircle2, AlertTriangle, ChefHat, History } from 'lucide-react';
import { Table, OrderStatus } from '../types.ts';

interface KDSProps {
  tables: Table[];
  setTables: React.Dispatch<React.SetStateAction<Table[]>>;
}

const KDS: React.FC<KDSProps> = ({ tables, setTables }) => {
  const [showHistory, setShowHistory] = useState(false);

  const activeItems = tables.flatMap(t => 
    t.orderItems
      .filter(i => i.status === OrderStatus.PENDING || i.status === OrderStatus.PREPARING)
      .map(i => ({ ...i, tableId: t.id }))
  ).sort((a, b) => a.timestamp - b.timestamp);

  const recentFinished = tables.flatMap(t => 
    t.orderItems
      .filter(i => i.status === OrderStatus.READY)
      .map(i => ({ ...i, tableId: t.id }))
  ).sort((a, b) => b.timestamp - a.timestamp).slice(0, 8);

  const markAsReady = (tableId: number, itemId: string) => {
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          orderItems: t.orderItems.map(oi => 
            oi.id === itemId ? { ...oi, status: OrderStatus.READY } : oi
          )
        };
      }
      return t;
    }));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-100"><ChefHat /></div>
           <div>
              <h2 className="text-xl font-black text-gray-900 leading-none">Monitor de Fogo</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">{activeItems.length} Pedidos em Aberto</p>
           </div>
        </div>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase transition-all ${showHistory ? 'bg-red-600 text-white' : 'bg-white border border-gray-100 text-gray-400'}`}
        >
          <History size={16} /> {showHistory ? 'Ocultar Saídos' : 'Ver Histórico'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {activeItems.map((item) => {
          const minutesElapsed = Math.floor((Date.now() - item.timestamp) / 60000);
          const isLate = minutesElapsed > 12;

          return (
            <div key={item.id} className={`bg-white rounded-3xl border-2 transition-all flex flex-col overflow-hidden shadow-sm ${isLate ? 'border-red-600' : 'border-gray-50'}`}>
              <div className={`p-4 flex items-center justify-between ${isLate ? 'bg-red-50' : 'bg-gray-50'}`}>
                <div>
                  <h3 className="font-black text-gray-900 text-sm">Mesa {item.tableId}</h3>
                  <span className="text-[9px] font-black text-gray-400 uppercase">Ticket #{item.id.split('-')[2]}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-[10px] font-black ${isLate ? 'text-red-600 animate-pulse' : 'text-gray-500'}`}>
                    {minutesElapsed} MIN
                  </span>
                  {isLate && <AlertTriangle size={12} className="text-red-600" />}
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="flex items-start gap-4">
                  <span className="text-2xl font-black text-red-600 leading-none">{item.quantity}x</span>
                  <p className="font-black text-gray-800 text-lg leading-tight uppercase">{item.name}</p>
                </div>
                
                <button 
                  onClick={() => markAsReady(item.tableId, item.id)}
                  className="w-full py-4 bg-gray-50 hover:bg-green-600 hover:text-white text-gray-400 rounded-2xl transition-all flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest"
                >
                  <CheckCircle2 size={16} /> Concluir
                </button>
              </div>
            </div>
          );
        })}

        {activeItems.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-4 opacity-20">
             <ChefHat size={64} className="mx-auto" />
             <p className="font-black uppercase tracking-widest text-sm">Cozinha Limpa. Bom trabalho!</p>
          </div>
        )}
      </div>

      {showHistory && recentFinished.length > 0 && (
        <div className="pt-8 border-t border-gray-100 animate-in slide-in-from-bottom-4">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Saíram recentemente</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
             {recentFinished.map(i => (
               <div key={i.id} className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between opacity-60">
                  <div className="truncate">
                    <p className="text-[10px] font-black text-gray-800 truncate">{i.name}</p>
                    <p className="text-[8px] font-bold text-gray-400 uppercase">Mesa {i.tableId}</p>
                  </div>
                  <CheckCircle2 size={14} className="text-green-500 shrink-0" />
               </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default KDS;