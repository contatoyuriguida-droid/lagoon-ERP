
import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// Added RefreshCw to imports
import { TrendingUp, DollarSign, Clock, Printer, Wifi, ShieldCheck, Zap, Activity, AlertCircle, CheckCircle2, ArrowRight, Calendar, X, Loader2, Package, CloudLightning, RefreshCw } from 'lucide-react';
import { Transaction, Product, Printer as PrinterType } from '../types.ts';

interface DashboardProps {
  transactions: Transaction[];
  products: Product[];
  printers: PrinterType[];
  onUpdateProduct: (product: Product) => Promise<void>;
  onMigrateAll: () => Promise<void>;
}

type Period = 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'ALL';

const Dashboard: React.FC<DashboardProps> = ({ transactions, products, printers, onUpdateProduct, onMigrateAll }) => {
  const [period, setPeriod] = useState<Period>('TODAY');
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [isProcessingRestock, setIsProcessingRestock] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [restockQty, setRestockQty] = useState<number>(0);

  // Lógica de Filtragem de Transações
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

  const metrics = useMemo(() => {
    const totalSales = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
    const avgTicket = filteredTransactions.length > 0 ? totalSales / filteredTransactions.length : 0;
    
    return {
      sales: `R$ ${totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      ticket: `R$ ${avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      count: filteredTransactions.length
    };
  }, [filteredTransactions]);

  // Preparação de dados para o gráfico baseado no filtro
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

  // ALERTA DE RESGATE: Se tiver menos de 10 itens, o cardápio sumiu.
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
      alert("Cardápio recuperado com sucesso!");
    } catch (e) {
      alert("Erro ao recuperar.");
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ALERTA DE RESGATE DE CARDÁPIO (BOTÃO DE EMERGÊNCIA) */}
      {needsRescue && (
        <div className="bg-red-600 p-6 rounded-[32px] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-red-200 animate-in slide-in-from-top-4 duration-500">
           <div className="flex items-center gap-5 text-center md:text-left">
              <div className="p-4 bg-white/20 rounded-2xl"><CloudLightning size={28} className="animate-pulse" /></div>
              <div>
                 <h3 className="text-lg font-black uppercase tracking-tight leading-none mb-1">Resgate de Cardápio Necessário</h3>
                 <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Detectamos que seu estoque em nuvem está incompleto (Apenas {products.length} itens).</p>
              </div>
           </div>
           <button 
            onClick={triggerRescue}
            disabled={isMigrating}
            className="w-full md:w-auto px-10 py-4 bg-white text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3"
           >
             {isMigrating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
             {isMigrating ? 'RECUPERANDO...' : 'RECUPERAR MIX COMPLETO AGORA'}
           </button>
        </div>
      )}

      {/* Filtro de Período */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 ml-2">
          <Calendar size={18} className="text-red-600" />
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-500">Período de Análise</h2>
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
                period === p.id ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'text-gray-400 hover:text-red-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard label="Faturamento" value={metrics.sales} change={period === 'TODAY' ? "Hoje" : "Período"} isPositive={true} icon={<DollarSign size={18} />} />
        <MetricCard label="Ticket Médio" value={metrics.ticket} change="Média" isPositive={true} icon={<TrendingUp size={18} />} />
        <MetricCard label="Vendas Total" value={metrics.count} change="Qtd" isPositive={true} icon={<Activity size={18} />} />
        <MetricCard label="Atendimento" value="18 min" change="Média" isPositive={true} icon={<Clock size={18} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
           <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-black">Fluxo Financeiro</h2>
              <span className="text-[10px] font-black uppercase text-red-600 bg-red-50 px-3 py-1 rounded-full">Visualização: {period}</span>
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

                  <button 
                    onClick={() => setShowRestockModal(true)}
                    className="mt-6 w-full py-3 bg-white text-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-lg active:scale-95"
                  >
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

      {/* MODAL DE REPOSIÇÃO RÁPIDA */}
      {showRestockModal && mainAlert && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
           <div className="bg-white rounded-[40px] w-full max-sm p-10 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                 <Package size={32} />
              </div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Reposição Expressa</h3>
              <h2 className="text-2xl font-black text-gray-900 uppercase leading-none mb-6">{mainAlert.name}</h2>
              
              <div className="bg-gray-50 p-6 rounded-3xl mb-8">
                 <p className="text-[10px] font-black text-gray-400 uppercase mb-4">Quantidade a Adicionar</p>
                 <div className="flex items-center justify-center gap-6">
                    <button 
                      onClick={() => setRestockQty(Math.max(0, restockQty - 1))}
                      className="w-10 h-10 bg-white border border-gray-100 text-gray-400 rounded-xl font-black text-xl hover:text-red-600 transition-colors"
                    >
                      -
                    </button>
                    <input 
                      autoFocus
                      type="number" 
                      value={restockQty} 
                      onChange={(e) => setRestockQty(Number(e.target.value))}
                      className="bg-transparent text-3xl font-black text-red-600 text-center w-20 outline-none" 
                    />
                    <button 
                      onClick={() => setRestockQty(restockQty + 1)}
                      className="w-10 h-10 bg-white border border-gray-100 text-gray-400 rounded-xl font-black text-xl hover:text-red-600 transition-colors"
                    >
                      +
                    </button>
                 </div>
              </div>

              <div className="flex gap-4">
                 <button 
                  onClick={handleRestock}
                  disabled={isProcessingRestock || restockQty <= 0}
                  className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-100 text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                 >
                   {isProcessingRestock ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                   {isProcessingRestock ? 'PROCESSANDO...' : 'CONFIRMAR'}
                 </button>
                 <button 
                  onClick={() => { setShowRestockModal(false); setRestockQty(0); }}
                  className="px-6 py-4 bg-gray-100 text-gray-400 font-bold rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                 >
                   CANCELAR
                 </button>
              </div>
           </div>
        </div>
      )}
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
