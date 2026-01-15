import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Clock, Printer, Wifi, ShieldCheck, Zap, Activity, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Transaction, Product, Printer as PrinterType } from '../types.ts';

interface DashboardProps {
  transactions: Transaction[];
  products: Product[];
  printers: PrinterType[];
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, products, printers }) => {
  const metrics = useMemo(() => {
    const totalSales = transactions.reduce((sum, t) => sum + t.amount, 0);
    const avgTicket = transactions.length > 0 ? totalSales / transactions.length : 0;
    
    return {
      sales: `R$ ${totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      ticket: `R$ ${avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      count: transactions.length
    };
  }, [transactions]);

  // Lógica de Inteligência de Estoque
  const lowStockItems = useMemo(() => {
    return products
      .filter(p => p.stock < 15) // Limite configurado para alerta
      .sort((a, b) => a.stock - b.stock);
  }, [products]);

  const mainAlert = lowStockItems[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard label="Faturamento Hoje" value={metrics.sales} change="+12%" isPositive={true} icon={<DollarSign size={18} />} />
        <MetricCard label="Ticket Médio" value={metrics.ticket} change="+5%" isPositive={true} icon={<TrendingUp size={18} />} />
        <MetricCard label="Vendas Total" value={metrics.count} change="Live" isPositive={true} icon={<Activity size={18} />} />
        <MetricCard label="Atendimento" value="18 min" change="-2m" isPositive={true} icon={<Clock size={18} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
           <h2 className="text-lg font-black mb-8">Fluxo Financeiro</h2>
           <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{n: '12h', v: 400}, {n: '14h', v: 900}, {n: '18h', v: 2200}, {n: '20h', v: 3800}]}>
                  <Area type="monotone" dataKey="v" stroke="#dc2626" fill="#fef2f2" strokeWidth={3} />
                  <XAxis dataKey="n" hide />
                  <YAxis hide />
                  <Tooltip />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
             <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-4 flex items-center gap-2">
                <Printer size={14} className="text-red-600" /> Saúde da Rede IP
             </h3>
             <div className="space-y-3">
                {printers.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                     <span className="text-[10px] font-black text-gray-700 uppercase">{p.name}</span>
                     <div className="flex items-center gap-2">
                        <span className="text-[8px] font-mono text-gray-400">{p.ip}</span>
                        <div className={`w-2 h-2 rounded-full ${p.status === 'ONLINE' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
                     </div>
                  </div>
                ))}
                {printers.length === 0 && <p className="text-[10px] text-center text-gray-400 py-4 italic">Nenhum terminal IP configurado.</p>}
             </div>
          </div>
          
          {/* DINAMIC STOCK ALERT SYSTEM */}
          {mainAlert ? (
            <div className="bg-red-600 p-6 rounded-3xl text-white shadow-xl shadow-red-100 relative overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle size={14} className="animate-pulse" />
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-80">Ruptura de Estoque Detectada</p>
                  </div>
                  
                  <h4 className="text-xl font-black mt-1 uppercase tracking-tighter">{mainAlert.name}</h4>
                  <p className="text-xs mt-1 font-bold opacity-90">Apenas {mainAlert.stock} unidades em estoque</p>
                  
                  {lowStockItems.length > 1 && (
                    <div className="mt-6 pt-4 border-t border-white/20 space-y-2">
                       <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Outros itens críticos:</p>
                       {lowStockItems.slice(1, 3).map(item => (
                         <div key={item.id} className="flex justify-between items-center text-[10px] font-bold">
                            <span className="uppercase opacity-80">{item.name}</span>
                            <span className="bg-white/20 px-2 py-0.5 rounded-lg">{item.stock} un</span>
                         </div>
                       ))}
                    </div>
                  )}

                  <button className="mt-6 w-full py-3 bg-white text-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-lg">
                    Repor agora <ArrowRight size={12} />
                  </button>
               </div>
               <Zap size={100} className="absolute -right-8 -bottom-8 opacity-10 rotate-12" />
            </div>
          ) : (
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center py-10 animate-in fade-in duration-700">
               <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mb-4">
                  <CheckCircle2 size={24} />
               </div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status de Inventário</p>
               <h4 className="text-sm font-black text-gray-900 mt-2">ESTOQUE EM CONFORMIDADE</h4>
               <p className="text-[9px] text-gray-400 mt-1 uppercase">Tudo pronto para o serviço</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, change, isPositive, icon }: any) => (
  <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:border-red-600 transition-all cursor-default">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">{icon}</div>
      <span className="text-[9px] font-black bg-green-50 text-green-600 px-2 py-0.5 rounded-lg">{change}</span>
    </div>
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{label}</p>
    <p className="text-2xl font-black text-gray-900 mt-2">{value}</p>
  </div>
);

export default Dashboard;