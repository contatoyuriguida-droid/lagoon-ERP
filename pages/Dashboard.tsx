import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Clock, Printer, Wifi, ShieldCheck, Zap, Activity } from 'lucide-react';
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
          
          <div className="bg-red-600 p-6 rounded-3xl text-white shadow-xl shadow-red-100 relative overflow-hidden">
             <div className="relative z-10">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-80">Alerta de Estoque</p>
                <h4 className="text-xl font-black mt-1">Negroni Lagoon</h4>
                <p className="text-xs mt-2 font-medium">Abaixo de 15% (8 doses restantes)</p>
             </div>
             <Zap size={60} className="absolute -right-4 -bottom-4 opacity-20" />
          </div>
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