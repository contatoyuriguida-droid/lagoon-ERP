
import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, ChefHat } from 'lucide-react';
import { Table, OrderStatus } from '../types';

interface KDSProps {
  tables: Table[];
  setTables: React.Dispatch<React.SetStateAction<Table[]>>;
}

const KDS: React.FC<KDSProps> = ({ tables, setTables }) => {
  // Extract all pending/preparing items from all tables
  const kdsItems = tables.flatMap(t => 
    t.orderItems
      .filter(i => i.status === OrderStatus.PENDING || i.status === OrderStatus.PREPARING)
      .map(i => ({ ...i, tableId: t.id }))
  ).sort((a, b) => a.timestamp - b.timestamp);

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
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChefHat className="text-red-600" />
          <h2 className="text-xl font-bold text-gray-800">Monitor de Preparo</h2>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-red-600" />
            <span className="text-gray-600 font-medium">Atrasado (+15min)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-orange-400" />
            <span className="text-gray-600 font-medium">Em Preparo</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {kdsItems.length > 0 ? kdsItems.map((item) => {
          const minutesElapsed = Math.floor((Date.now() - item.timestamp) / 60000);
          const isLate = minutesElapsed > 15;

          return (
            <div 
              key={`${item.tableId}-${item.id}`} 
              className={`bg-white rounded-2xl border-l-8 shadow-sm flex flex-col h-48 ${
                isLate ? 'border-red-600' : 'border-orange-400'
              }`}
            >
              <div className="p-4 flex items-center justify-between border-b border-gray-50">
                <div>
                  <h3 className="font-bold text-gray-800">Mesa {item.tableId}</h3>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                    <Clock size={10} /> {minutesElapsed}m atrás
                  </div>
                </div>
                {isLate && <AlertTriangle className="text-red-600 animate-pulse" size={20} />}
              </div>
              
              <div className="flex-1 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-red-600">{item.quantity}x</span>
                    <span className="text-lg font-medium text-gray-700">{item.name}</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => markAsReady(item.tableId, item.id)}
                  className="w-full py-2 bg-gray-50 hover:bg-green-50 text-gray-400 hover:text-green-600 rounded-xl transition-all flex items-center justify-center gap-2 font-bold"
                >
                  <CheckCircle2 size={18} /> CONCLUIR
                </button>
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full h-64 flex flex-col items-center justify-center text-gray-400">
             <ChefHat size={64} strokeWidth={1} className="mb-4 opacity-20" />
             <p className="text-xl font-medium">Cozinha tranquila por enquanto...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KDS;
