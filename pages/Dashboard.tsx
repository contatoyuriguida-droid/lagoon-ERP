
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, DollarSign, Clock, Printer, Wifi, ShieldCheck, Zap } from 'lucide-react';
import { Transaction, Product } from '../types.ts';

interface DashboardProps {
  transactions: Transaction[];
  products: Product[];
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, products }) => {
  const metrics = useMemo(() => {
    const totalSales = transactions.reduce((sum, t) => sum + t.amount, 0);
    const avgTicket = transactions.length > 0 ? totalSales / transactions.length : 0;
    const itemsSold = products.reduce((sum, p) => sum + (p.salesVolume || 0), 0);
    
    return {
      sales: `R$ ${totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      ticket: `R$ ${avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      volume: itemsSold,
      count: transactions.length
    };
  }, [transactions, products]);

  const chartData = useMemo(() => {
    return [
      { name: '10h', value: 0 },
      { name: '12h', value: 1200 },
      { name: '14h', value: 800 },
      { name: '18h', value: 2400 },
      { name: '20h', value: 3800 },
      { name: '22h', value: 3100 },
    ];
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        <MetricCard label="Faturamento Hoje" value={metrics.sales} change="+12%" isPositive={true} icon={<DollarSign size={18} />} />
        <MetricCard label="Ticket Médio" value={metrics.ticket} change="+5%" isPositive={true} icon={<TrendingUp size={18} />} />
        <MetricCard label="Vendas" value={metrics.count} change="Live" isPositive={true} icon={<Clock size={18} />} />
        <MetricCard label="Giro Estoque" value={metrics.volume} change="Alto" isPositive={true} icon={<Zap size={18} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Container */}
        <div className="lg:col-span-2 bg-white p-5 lg:p-8 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Performance de Vendas</h2>
              <p className="text-xs text-gray-400">Fluxo consolidado por hora</p>
            </div>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-red-50 text-red-600 rounded text-[9px] font-bold uppercase border border-red-100 tracking-wider">Tempo Real</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="value" stroke="#dc2626" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="font-bold text-sm text-gray-900 mb-6 flex items-center gap-2">
              <ShieldCheck className="text-red-600" size={16} /> Status Operacional
            </h2>
            <div className="space-y-4">
              <StatusRow label="Servidor Cloud" status="Online" icon={<Wifi size={14} />} color="text-green-500" />
              <StatusRow label="Cozinha (KDS)" status="Ativo" icon={<Printer size={14} />} color="text-green-500" />
              <StatusRow label="Fiscal SAT" status="Sincron." icon={<Zap size={14} />} color="text-red-500" />
            </div>
          </div>

          <div className="bg-red-600 p-6 rounded-2xl shadow-lg shadow-red-100 text-white relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-red-100 text-[9px] font-bold uppercase tracking-widest mb-1 opacity-80">Prato Mais Vendido</p>
              <h3 className="font-bold text-xl mb-3">Lagoon Burger</h3>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium opacity-90">Meta atingida</span>
                <span className="bg-white/20 px-2.5 py-1 rounded-lg text-[10px] font-bold">124 unid.</span>
              </div>
            </div>
            <TrendingUp size={80} className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, change, isPositive, icon }: any) => (
  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm group hover:border-red-400 transition-all">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2.5 bg-red-50 text-red-600 rounded-xl group-hover:bg-red-600 group-hover:text-white transition-colors">{icon}</div>
      <div className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{change}</div>
    </div>
    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">{label}</p>
    <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
  </div>
);

const StatusRow = ({ label, status, icon, color }: any) => (
  <div className="flex items-center justify-between py-1.5">
    <div className="flex items-center gap-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wide">
      {icon} <span>{label}</span>
    </div>
    <span className={`${color} text-[10px] font-bold uppercase tracking-wider`}>{status}</span>
  </div>
);

export default Dashboard;
