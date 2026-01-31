
import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Clock, Printer, Wifi, ShieldCheck, Zap, Activity, AlertCircle, CheckCircle2, ArrowRight, Calendar, X, Loader2, Package, CloudLightning, RefreshCw, Building2, Map, Users } from 'lucide-react';
import { Transaction, Product, Printer as PrinterType, Customer, CustomerType } from '../types.ts';

interface DashboardProps {
  transactions: Transaction[];
  products: Product[];
  printers: PrinterType[];
  customers: Customer[];
  onUpdateProduct: (product: Product) => Promise<void>;
  onMigrateAll: () => Promise<void>;
}

type Period = 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'ALL';

const Dashboard: React.FC<DashboardProps> = ({ transactions, products, printers, customers, onUpdateProduct, onMigrateAll }) => {
  const [period, setPeriod] = useState<Period>('TODAY');
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [isProcessingRestock, setIsProcessingRestock] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [restockQty, setRestockQty] = useState<number>(0);

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    return transactions.filter(t => {
      const txTime = t.timestamp;
      
      switch (period) {
        case 'TODAY':
          return txTime >= startOfDay;
        case 'YESTERDAY':
          const yesterdayStart = startOfDay - (24 * 60 * 60 * 1000);
          return txTime >= yesterdayStart && txTime < startOfDay;
        case 'WEEK':
          return txTime >= (now.getTime() - (7 * 24 * 60 * 60 * 1000));
        case 'MONTH':
          return txTime >= (now.getTime() - (30 * 24 * 60 * 60 * 1000));
        case 'ALL':
          return true;
        default:
          return true;
      }
    });
  }, [transactions, period]);

  // Lógica do Fechamento de Caixa Segmentado
  const cashierSummary = useMemo(() => {
    const totals = {
      overall: 0,
      individual: 0,
      hotel: 0,
      operator: 0
    };

    filteredTransactions.forEach(t => {
      totals.overall += t.amount;
      
      if (t.customerType === CustomerType.HOTEL) {
        totals.hotel += t.amount;
      } else if (t.customerType === CustomerType.OPERATOR) {
        totals.operator += t.amount;
      } else {
        totals.individual += t.amount;
      }
    });

    return totals;
  }, [filteredTransactions]);

  const metrics = useMemo(() => {
    const totalSales = cashierSummary.overall;
    const avgTicket = filteredTransactions.length > 0 ? totalSales / filteredTransactions.length : 0;
    
    return {
      sales: `R$ ${totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      ticket: `R$ ${avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      count: filteredTransactions.length
    };
  }, [cashierSummary, filteredTransactions]);

  const chartData = useMemo(() => {
    if (period === 'TODAY' || period === 'YESTERDAY') {
      const hours = Array.from({ length: 24 }, (_, i) => ({ name: `${i}h`, v: 0 }));
      filteredTransactions.forEach(t => {
        const hour = new Date(t.timestamp).getHours();
        hours[hour].v += t.amount;
      });
      return hours.filter((h, i) => i >= 8 && i <= 23);
    } else {
      const days: Record<string, number> = {};
      filteredTransactions.forEach(t => {
        const date = new Date(t.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        days[date] = (days[date] || 0) + t.amount;
      });
      return Object.entries(days).map(([name, v]) => ({ name, v })).reverse();
    }
  }, [filteredTransactions, period]);

  const needsRescue = products.length < 10 && products.length > 0;

  const lowStockItems = useMemo(() => {
    return products
      .filter(p => p.stock < 15)
      .sort((a, b) => a.stock - b.stock);
  }, [products]);

  const mainAlert = lowStockItems[0];

  const handleRestock = async () => {
    if (!mainAlert || restockQty <= 0) return;
    setIsProcessingRestock(true);
    try {
      const updatedProduct: Product = {
        ...mainAlert,
        stock: mainAlert.stock + restockQty
      };
      await onUpdateProduct(updatedProduct);
      setShowRestockModal(false);
      setRestockQty(0);
    } catch (e) {
      console.error("Erro na reposição:", e);
    } finally {
      setIsProcessingRestock(false);
    }
  };

  const triggerRescue = async () => {
    setIsMigrating(true);
    try {
      await onMigrateAll();
    } catch (e) {
      alert("Erro ao recuperar.");
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {needsRescue && (
        <div className="bg-red-600 p-6 rounded-[32px] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-red-200 animate-in slide-in-from-top-4 duration-500">
           <div className="flex items-center gap-5 text-center md:text-left">
              <div className="p-4 bg-white/20 rounded-2xl"><CloudLightning size={28} className="animate-pulse" /></div>
              <div>
                 <h3 className="text-lg font-black uppercase tracking-tight leading-none mb-1">Resgate de Cardápio Necessário</h3>
                 <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Detectamos que seu estoque em nuvem está incompleto.</p>
              </div>
           </div>
           <button 
            onClick={triggerRescue}
            disabled={isMigrating}
            className="w-full md:w-auto px-10 py-4 bg-white text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3"
           >
             {isMigrating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
             RECUPERAR MIX COMPLETO AGORA
           </button>
        </div>
      )}

      {/* FECHAMENTO DE CAIXA EXECUTIVO */}
      <div className="bg-gray-900 rounded-[40px] p-8 lg:p-12 text-white shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-10"><Zap size={140} /></div>
         
         <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
               <div>
                  <div className="flex items-center gap-3 mb-4">
                     <span className="px-3 py-1 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full">Financeiro</span>
                     <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Resumo de {period}</span>
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">VGV (Volume Geral de Vendas)</p>
                  <h1 className="text-5xl lg:text-7xl font-black tracking-tighter">
                     R$ {cashierSummary.overall.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h1>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-8 border-l-0 lg:border-l border-white/10 lg:pl-12">
                  <BreakdownItem 
                    label="BALCÃO / SISTEMA GERAL" 
                    value={cashierSummary.individual} 
                    icon={<Users size={16} />} 
                    color="text-white" 
                  />
                  <BreakdownItem 
                    label="HOTELARIA / PARCEIROS" 
                    value={cashierSummary.hotel} 
                    icon={<Building2 size={16} />} 
                    color="text-blue-400" 
                  />
                  <BreakdownItem 
                    label="OPERADORAS / AGÊNCIAS" 
                    value={cashierSummary.operator} 
                    icon={<Map size={16} />} 
                    color="text-purple-400" 
                  />
               </div>
            </div>
         </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 ml-2">
          <Calendar size={18} className="text-red-600" />
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-500">Análise de Tendência</h2>
        </div>
        <div className="flex bg-gray-50 p-1 rounded-2xl w-full sm:w-auto">
          {[
            { id: 'TODAY', label: 'Hoje' },
            { id: 'YESTERDAY', label: 'Ontem' },
            { id: 'WEEK', label: '7 Dias' },
            { id: 'MONTH', label: '30 Dias' },
            { id: 'ALL', label: 'Tudo' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id as Period)}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${
                period === p.id ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-red-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
           <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-black">Fluxo Financeiro</h2>
              <span className="text-[10px] font-black uppercase text-red-600 bg-red-50 px-3 py-1 rounded-full">Gráfico de Performance</span>
           </div>
           <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <Area type="monotone" dataKey="v" stroke="#dc2626" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#9ca3af'}} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 800, fontSize: '12px' }}
                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Vendas']}
                  />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="space-y-4">
           <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-red-50 text-red-600 rounded-xl"><TrendingUp size={18} /></div>
                 <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Ticket Médio</p>
                    <p className="text-lg font-black text-gray-900">{metrics.ticket}</p>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-gray-50 text-gray-400 rounded-xl"><Activity size={18} /></div>
                 <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Qtd. Transações</p>
                    <p className="text-lg font-black text-gray-900">{metrics.count}</p>
                 </div>
              </div>
           </div>

           <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-4 flex items-center gap-2">
                 <Printer size={14} className="text-red-600" /> Saúde da Rede IP
              </h3>
              <div className="space-y-3">
                 {printers.map(p => (
                   <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                      <span className="text-[10px] font-black text-gray-700 uppercase">{p.name}</span>
                      <div className="flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full ${p.status === 'ONLINE' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const BreakdownItem = ({ label, value, icon, color }: any) => (
  <div className="flex flex-col">
    <div className={`flex items-center gap-2 mb-2 ${color}`}>
       {icon}
       <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <p className="text-2xl font-black">
      R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
    </p>
  </div>
);

export default Dashboard;
