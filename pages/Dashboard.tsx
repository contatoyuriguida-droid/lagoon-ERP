
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, DollarSign, Clock, Printer, Wifi, ShieldCheck, Zap } from 'lucide-react';
import { Transaction, Product } from '../types';

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
      sales: `R$ ${totalSales.toFixed(2)}`,
      ticket: `R$ ${avgTicket.toFixed(2)}`,
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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Faturamento Hoje" value={metrics.sales} change="+12.5%" isPositive={true} icon={<DollarSign size={20} />} />
        <MetricCard label="Ticket Médio" value={metrics.ticket} change="+5.2%" isPositive={true} icon={<TrendingUp size={20} />} />
        <MetricCard label="Comandas Pagas" value={metrics.count} change="Tempo Real" isPositive={true} icon={<Clock size={20} />} />
        <MetricCard label="Giro de Estoque" value={metrics.volume} change="Alto" isPositive={true} icon={<Zap size={20} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-gray-900">Performance de Vendas</h2>
              <p className="text-sm text-gray-400">Fluxo financeiro consolidado por hora</p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase">Live</span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 600, fill: '#9ca3af'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 600, fill: '#9ca3af'}} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#dc2626" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Status Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <h2 className="font-black text-gray-900 mb-6 flex items-center gap-2">
              <ShieldCheck className="text-red-600" size={20} /> Status do Sistema
            </h2>
            <div className="space-y-4">
              <StatusRow label="Servidor Cloud" status="Online" icon={<Wifi size={16} />} color="text-green-500" />
              <StatusRow label="Cozinha (Term." status="Ativo" icon={<Printer size={16} />} color="text-green-500" />
              <StatusRow label="SAT / NFC-e" status="Homolog." icon={<Zap size={16} />} color="text-red-500" />
            </div>
            <button className="w-full mt-6 py-3 bg-gray-50 text-gray-400 text-[10px] font-black uppercase rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors">Ver Configurações</button>
          </div>

          <div className="bg-red-600 p-8 rounded-[32px] shadow-xl shadow-red-100 text-white relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="font-black text-xl mb-1">Top Item</h3>
              <p className="text-red-100 text-xs font-bold uppercase mb-4 opacity-80">Mais vendido hoje</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black">Lagoon Burger</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-black">124 unid.</span>
              </div>
            </div>
            <TrendingUp size={120} className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-700" />
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, change, isPositive, icon }: any) => (
  <div className="bg-white p-7 rounded-[28px] border border-gray-100 shadow-sm group hover:border-red-500 transition-all cursor-default">
    <div className="flex items-center justify-between mb-5">
      <div className="p-3 bg-red-50 text-red-600 rounded-2xl group-hover:bg-red-600 group-hover:text-white transition-colors">{icon}</div>
      <div className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{change}</div>
    </div>
    <p className="text-gray-400 text-xs font-black uppercase tracking-widest">{label}</p>
    <p className="text-3xl font-black text-gray-900 mt-2 tracking-tighter">{value}</p>
  </div>
);

const StatusRow = ({ label, status, icon, color }: any) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
    <div className="flex items-center gap-3 text-gray-500 font-bold text-xs uppercase">
      {icon} <span>{label}</span>
    </div>
    <span className={`${color} text-[10px] font-black uppercase tracking-widest`}>{status}</span>
  </div>
);

export default Dashboard;
