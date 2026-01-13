
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, DollarSign, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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
    // Basic aggregation by time bucket (mocking for history)
    return [
      { name: '10h', value: 0 },
      { name: '12h', value: transactions.filter(t => new Date(t.timestamp).getHours() <= 12).length * 40 },
      { name: '14h', value: transactions.filter(t => new Date(t.timestamp).getHours() <= 14).length * 60 },
      { name: '18h', value: transactions.reduce((s,t) => s + t.amount, 0) / 10 },
      { name: '20h', value: metrics.count * 100 },
    ];
  }, [transactions, metrics]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Vendas Realizadas" value={metrics.sales} change="+Real" isPositive={true} icon={<DollarSign className="text-red-600" />} />
        <MetricCard label="Ticket Médio" value={metrics.ticket} change="Tempo Real" isPositive={true} icon={<TrendingUp className="text-red-600" />} />
        <MetricCard label="Giro de Mesa" value={`${(transactions.length / 12).toFixed(1)}x`} change="Total" isPositive={true} icon={<Clock className="text-red-600" />} />
        <MetricCard label="Itens Saídos" value={metrics.volume} change="Total" isPositive={true} icon={<Users className="text-red-600" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-6">Volume de Vendas (Sincronizado)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#dc2626" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <h2 className="font-bold text-gray-800 mb-6">Ranking Real de Itens</h2>
          <div className="space-y-4">
            {products
              .sort((a, b) => (b.salesVolume || 0) - (a.salesVolume || 0))
              .slice(0, 5)
              .map((item, i) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400">#{i + 1}</span>
                    <span className="text-sm font-semibold text-gray-700">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold bg-red-50 text-red-600 px-2 py-1 rounded-lg">{item.salesVolume || 0} vend.</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, change, isPositive, icon }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 bg-red-50 rounded-xl">{icon}</div>
      <div className={`text-xs font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>{change}</div>
    </div>
    <p className="text-gray-400 text-sm font-medium">{label}</p>
    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
  </div>
);

export default Dashboard;
