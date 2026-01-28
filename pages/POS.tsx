
import React, { useState, useMemo, useEffect } from 'react';
import { Users, Plus, X, DollarSign, ArrowLeftRight, CreditCard, Search, Smartphone, Banknote, ShoppingBag, Wallet, Printer as PrinterIcon, LayoutGrid, List, ChevronRight, CheckCircle2, Trash2, UserPlus, UserCheck, Minus, Hash } from 'lucide-react';
import { Table, TableStatus, Product, Customer, PaymentMethod, User, UserRole } from '../types.ts';

interface POSProps {
  currentUser: User;
  tables: Table[];
  products: Product[];
  customers: Customer[];
  onAddItems: (tableId: number, product: Product, quantity: number) => void;
  onRemoveItem: (tableId: number, itemId: string) => void;
  onFinalize: (tableId: number, itemIds: string[], method: PaymentMethod, amountPaid: number, change: number) => void;
  onAddTable: () => void;
  onAssignCustomer: (tableId: number, customerId: string | undefined) => void;
}

interface Toast {
  id: string;
  message: string;
}

const POS: React.FC<POSProps> = ({ currentUser, tables, products, customers, onAddItems, onRemoveItem, onFinalize, onAddTable, onAssignCustomer }) => {
  const [activeTab, setActiveTab] = useState<'TABLES' | 'COMANDAS'>('TABLES');
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [isAddingItems, setIsAddingItems] = useState(false);
  const [isClosingBill, setIsClosingBill] = useState(false);
  const [isSelectingCustomer, setIsSelectingCustomer] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [custSearchTerm, setCustSearchTerm] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Estados para Quantidade
  const [qtySelector, setQtySelector] = useState<{ product: Product } | null>(null);
  const [selectedQty, setSelectedQty] = useState(1);

  const currentTable = useMemo(() => tables.find(t => t.id === selectedTableId), [tables, selectedTableId]);
  const linkedCustomer = useMemo(() => customers.find(c => c.id === currentTable?.customerId), [customers, currentTable]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [products, searchTerm]);

  const filteredCustomers = useMemo(() => {
    if (!custSearchTerm) return customers.slice(0, 5);
    return customers.filter(c => c.name.toLowerCase().includes(custSearchTerm.toLowerCase())).slice(0, 10);
  }, [customers, custSearchTerm]);

  const totalBill = useMemo(() => {
    if (!currentTable) return 0;
    return currentTable.orderItems.reduce((s, i) => s + (i.price * i.quantity), 0);
  }, [currentTable]);

  const changeValue = useMemo(() => {
    const received = parseFloat(amountReceived) || 0;
    return Math.max(0, received - totalBill);
  }, [amountReceived, totalBill]);

  const showToast = (message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2000);
  };

  const handleQuickAdd = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita abrir o seletor de quantidade
    if (!selectedTableId) return;
    onAddItems(selectedTableId, product, 1);
    showToast(`+1 ${product.name}`);
  };

  const handleOpenQtySelector = (product: Product) => {
    setQtySelector({ product });
    setSelectedQty(1);
  };

  const confirmAddWithQty = () => {
    if (!selectedTableId || !qtySelector) return;
    onAddItems(selectedTableId, qtySelector.product, selectedQty);
    showToast(`+${selectedQty} ${qtySelector.product.name}`);
    setQtySelector(null);
  };

  const handleFinalize = () => {
    if (!currentTable || !paymentMethod) return;
    const itemIds = currentTable.orderItems.map(i => i.id);
    const finalReceived = paymentMethod === PaymentMethod.CASH ? parseFloat(amountReceived) : totalBill;
    onFinalize(currentTable.id, itemIds, paymentMethod, finalReceived, changeValue);
    setSelectedTableId(null);
    setIsClosingBill(false);
    setPaymentMethod(null);
    setAmountReceived("");
  };

  return (
    <div className="flex flex-col h-full space-y-4 lg:space-y-6 relative">
      
      {/* Toast Notifications Layer */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="bg-red-600 text-white px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl shadow-red-200 animate-in fade-in slide-in-from-top-4 duration-300 flex items-center gap-2">
            <CheckCircle2 size={16} /> {t.message}
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 w-full sm:w-auto">
          <button onClick={() => setActiveTab('TABLES')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all ${activeTab === 'TABLES' ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'text-gray-400'}`}>
            <LayoutGrid size={14} /> Mapa
          </button>
          <button onClick={() => setActiveTab('COMANDAS')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all ${activeTab === 'COMANDAS' ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'text-gray-400'}`}>
            <List size={14} /> Ativas
          </button>
        </div>
        {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER) && (
          <button onClick={onAddTable} className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-red-600 border-2 border-red-50 rounded-2xl font-black text-[10px] uppercase shadow-sm active:scale-95 transition-all">
            <Plus size={16} /> Nova Mesa
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2 lg:gap-3">
        {tables.filter(t => activeTab === 'TABLES' || t.status === TableStatus.OCCUPIED).map(table => (
          <button
            key={table.id}
            onClick={() => setSelectedTableId(table.id)}
            className={`aspect-square rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 group relative ${
              table.status === TableStatus.OCCUPIED 
                ? 'border-red-600 bg-red-600 text-white shadow-lg shadow-red-200 ring-4 ring-red-50' 
                : 'border-white bg-white hover:border-red-100 shadow-sm text-gray-400'
            }`}
          >
            <span className={`font-black ${table.id > 99 ? 'text-sm' : 'text-lg'} tracking-tighter`}>{table.id}</span>
            <span className="text-[8px] font-black uppercase opacity-80 truncate max-w-[80%]">
              {table.status === TableStatus.OCCUPIED 
                ? `R$ ${table.orderItems.reduce((s, i) => s + (i.price * i.quantity), 0).toFixed(0)}` 
                : 'Livre'}
            </span>
          </button>
        ))}
      </div>

      {currentTable && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { if(!isAddingItems && !isSelectingCustomer) setSelectedTableId(null); }} />
          <div className="relative w-full max-w-lg bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-red-100">{currentTable.id}</div>
                <div>
                  <h2 className="text-lg font-black text-gray-900 leading-tight">Mesa {currentTable.id}</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">#{currentTable.comandaId || 'Aguardando'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedTableId(null)} className="p-3 bg-gray-50 hover:bg-red-50 hover:text-red-600 rounded-xl text-gray-400 transition-all"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50/30">
              {isAddingItems ? (
                <div className="p-4 space-y-4">
                   <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        autoFocus
                        type="text" 
                        placeholder="Buscar produto..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border-none shadow-sm font-bold text-sm outline-none focus:ring-2 focus:ring-red-600"
                      />
                   </div>
                   <div className="grid grid-cols-1 gap-2">
                     {filteredProducts.map(p => (
                       <button 
                         key={p.id} 
                         onClick={() => handleOpenQtySelector(p)} 
                         className="w-full bg-white border border-gray-100 rounded-2xl hover:border-red-300 active:scale-[0.99] flex justify-between items-center text-left shadow-sm transition-all group overflow-hidden"
                       >
                         <div className="flex items-center gap-4 p-4 flex-1">
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-red-600 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                               <Hash size={18} />
                            </div>
                            <div>
                               <p className="font-black text-sm text-gray-800 leading-tight uppercase">{p.name}</p>
                               <div className="flex items-center gap-2">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{p.category}</p>
                                  <span className="text-[10px] text-red-600 font-black">R$ {p.price.toFixed(2)}</span>
                               </div>
                            </div>
                         </div>
                         
                         {/* Botão de Adição Rápida (+1) */}
                         <div 
                           onClick={(e) => handleQuickAdd(p, e)}
                           className="h-full px-6 py-6 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center border-l border-gray-50"
                         >
                            <Plus size={20} strokeWidth={3} />
                         </div>
                       </button>
                     ))}
                   </div>
                </div>
              ) : isSelectingCustomer ? (
                <div className="p-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                   <div className="flex items-center justify-between px-2">
                      <h3 className="font-black uppercase text-[10px] tracking-widest text-gray-400">Vincular para Fidelidade</h3>
                      <button onClick={() => setIsSelectingCustomer(false)} className="text-gray-400"><X size={16} /></button>
                   </div>
                   <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        autoFocus
                        type="text" 
                        placeholder="Buscar cliente..." 
                        value={custSearchTerm}
                        onChange={(e) => setCustSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border-none shadow-sm font-bold text-sm outline-none focus:ring-2 focus:ring-red-600"
                      />
                   </div>
                   <div className="space-y-2">
                      {filteredCustomers.map(c => (
                        <button key={c.id} onClick={() => { onAssignCustomer(currentTable.id, c.id); setIsSelectingCustomer(false); showToast(`Vinculado: ${c.name}`); }} className="w-full p-4 bg-white border border-gray-100 rounded-2xl flex items-center gap-4 hover:border-red-600 transition-all text-left group">
                           <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center font-black">{c.name[0]}</div>
                           <div className="flex-1">
                              <p className="font-black text-sm text-gray-800 uppercase leading-none mb-1">{c.name}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{c.points} PONTOS</p>
                           </div>
                           <ChevronRight size={16} className="text-gray-200 group-hover:text-red-600" />
                        </button>
                      ))}
                      {filteredCustomers.length === 0 && (
                        <div className="py-10 text-center text-gray-400 italic text-xs">Nenhum cliente encontrado.</div>
                      )}
                   </div>
                </div>
              ) : isClosingBill ? (
                <div className="p-6 space-y-6">
                  <div className="bg-red-600 p-10 rounded-3xl shadow-xl shadow-red-100 text-white text-center relative overflow-hidden">
                    <div className="relative z-10">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Total do Fechamento</p>
                      <p className="text-5xl font-black">R$ {totalBill.toFixed(2)}</p>
                      {linkedCustomer && <p className="text-[10px] font-black uppercase mt-4 tracking-widest bg-white/20 px-3 py-1 rounded-full inline-block">+{Math.floor(totalBill / 10)} PONTOS PARA {linkedCustomer.name}</p>}
                    </div>
                    <div className="absolute -right-6 -bottom-6 opacity-10 rotate-12"><DollarSign size={120} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <PaymentBtnLarge active={paymentMethod === PaymentMethod.PIX} onClick={() => setPaymentMethod(PaymentMethod.PIX)} label="PIX" icon={<Smartphone size={24} />} />
                    <PaymentBtnLarge active={paymentMethod === PaymentMethod.CREDIT} onClick={() => setPaymentMethod(PaymentMethod.CREDIT)} label="CRÉDITO" icon={<CreditCard size={24} />} />
                    <PaymentBtnLarge active={paymentMethod === PaymentMethod.DEBIT} onClick={() => setPaymentMethod(PaymentMethod.DEBIT)} label="DÉBITO" icon={<Wallet size={24} />} />
                    <PaymentBtnLarge active={paymentMethod === PaymentMethod.CASH} onClick={() => setPaymentMethod(PaymentMethod.CASH)} label="DINHEIRO" icon={<Banknote size={24} />} />
                  </div>
                  {paymentMethod === PaymentMethod.CASH && (
                    <div className="space-y-4 animate-in slide-in-from-top-4">
                      <input type="number" inputMode="decimal" value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} className="w-full p-5 bg-white rounded-2xl text-3xl font-black border-4 border-red-100 outline-none text-center shadow-inner" placeholder="Quanto recebeu?" />
                      {parseFloat(amountReceived) >= totalBill && (
                        <div className="p-5 bg-green-50 border-2 border-green-100 rounded-2xl text-center">
                           <span className="text-[12px] text-green-700 font-black uppercase tracking-widest block mb-1">Troco para Cliente</span>
                           <span className="text-2xl font-black text-green-600">R$ {changeValue.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 space-y-4">
                   {/* Vínculo Opcional de Cliente */}
                   <div className="px-1">
                      {linkedCustomer ? (
                        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-2">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-red-600 text-white rounded-xl flex items-center justify-center"><UserCheck size={16} /></div>
                              <div>
                                 <p className="text-[11px] font-black text-red-600 uppercase tracking-widest">{linkedCustomer.name}</p>
                                 <p className="text-[9px] text-red-400 font-bold uppercase tracking-tighter">Acumulando Fidelidade</p>
                              </div>
                           </div>
                           <button onClick={() => onAssignCustomer(currentTable.id, undefined)} className="text-red-300 hover:text-red-600"><X size={16} /></button>
                        </div>
                      ) : (
                        <button onClick={() => setIsSelectingCustomer(true)} className="w-full p-3 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-2 text-gray-400 hover:border-red-200 hover:text-red-600 transition-all">
                           <UserPlus size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Vincular Cliente (Opcional)</span>
                        </button>
                      )}
                   </div>

                   <div className="space-y-3">
                     {currentTable.orderItems.map(item => (
                       <div key={item.id} className="p-4 bg-white rounded-2xl border border-gray-100 flex justify-between items-center shadow-sm relative overflow-hidden group animate-in fade-in slide-in-from-left-2">
                          {item.status === 'READY' && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-green-500" />}
                          <div className="flex items-center gap-4">
                             <span className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 rounded-xl text-xs font-black">{item.quantity}x</span>
                             <div>
                                <p className="font-black text-[13px] text-gray-800 uppercase leading-none mb-1">{item.name}</p>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${item.status === 'READY' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                    {item.status === 'READY' ? 'PRONTO' : 'NA BRASA'}
                                  </span>
                                  <span className="text-[9px] text-gray-300 font-bold">{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                             </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="font-black text-sm text-gray-900">R$ {(item.price * item.quantity).toFixed(2)}</p>
                            <button 
                              onClick={() => {
                                onRemoveItem(currentTable.id, item.id);
                                showToast(`Removido: ${item.name}`);
                              }} 
                              className="p-2 text-gray-300 hover:text-red-600 active:scale-90 transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                       </div>
                     ))}
                     {currentTable.orderItems.length === 0 && (
                       <div className="py-20 flex flex-col items-center opacity-20">
                          <ShoppingBag size={64} className="mb-4" />
                          <p className="font-black uppercase tracking-widest text-xs italic">A mesa está vazia</p>
                       </div>
                     )}
                   </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-white border-t border-gray-100 space-y-3 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] sticky bottom-0">
               {isAddingItems ? (
                 <button onClick={() => {setIsAddingItems(false); setSearchTerm("");}} className="w-full py-5 bg-red-600 text-white font-black rounded-2xl uppercase text-xs tracking-[0.2em] shadow-xl shadow-red-200 active:scale-95 transition-all">CONCLUIR LANÇAMENTO</button>
               ) : isSelectingCustomer ? (
                 <button onClick={() => setIsSelectingCustomer(false)} className="w-full py-5 bg-gray-100 text-gray-400 font-black rounded-2xl uppercase text-xs tracking-[0.2em] active:scale-95 transition-all">VOLTAR PARA RESUMO</button>
               ) : isClosingBill ? (
                 <div className="flex gap-3">
                    <button onClick={() => setIsClosingBill(false)} className="px-6 py-5 bg-gray-50 text-gray-400 font-black rounded-2xl uppercase text-xs active:scale-95 transition-all"><ArrowLeftRight size={18} /></button>
                    <button disabled={!paymentMethod || (paymentMethod === PaymentMethod.CASH && parseFloat(amountReceived) < totalBill)} onClick={handleFinalize} className="flex-1 py-5 bg-red-600 text-white font-black rounded-2xl uppercase text-xs tracking-[0.2em] shadow-xl shadow-red-200 disabled:opacity-30 active:scale-95 transition-all">FINALIZAR E RECEBER</button>
                 </div>
               ) : (
                 <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setIsAddingItems(true)} className="py-5 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-200 active:scale-95 transition-all flex items-center justify-center gap-2">
                       <Plus size={18} /> ADICIONAR
                    </button>
                    <button disabled={totalBill === 0} onClick={() => setIsClosingBill(true)} className="py-5 bg-white border-2 border-red-600 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-50 disabled:opacity-30 active:scale-95 transition-all flex items-center justify-center gap-2">
                       <DollarSign size={18} /> FECHAR
                    </button>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* SELETOR DE QUANTIDADE EXPRESSO (MODAL OVERLAY) */}
      {qtySelector && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setQtySelector(null)} />
           <div className="relative bg-white rounded-[40px] w-full max-w-sm p-10 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Definir Quantidade</p>
              <h3 className="text-xl font-black text-gray-900 uppercase leading-tight mb-8">{qtySelector.product.name}</h3>
              
              <div className="bg-gray-50 p-8 rounded-[32px] mb-8">
                 <div className="flex items-center justify-center gap-8 mb-8">
                    <button 
                      onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))}
                      className="w-12 h-12 bg-white text-gray-400 rounded-2xl flex items-center justify-center shadow-sm active:scale-90 transition-all"
                    >
                      <Minus size={24} />
                    </button>
                    <span className="text-5xl font-black text-red-600 w-20">{selectedQty}</span>
                    <button 
                      onClick={() => setSelectedQty(selectedQty + 1)}
                      className="w-12 h-12 bg-white text-red-600 rounded-2xl flex items-center justify-center shadow-sm active:scale-90 transition-all"
                    >
                      <Plus size={24} />
                    </button>
                 </div>

                 {/* Botões de Atalho de Quantidade */}
                 <div className="grid grid-cols-4 gap-2">
                    {[2, 3, 4, 5, 6, 8, 10, 12].map(num => (
                      <button 
                        key={num} 
                        onClick={() => setSelectedQty(num)}
                        className={`py-3 rounded-xl font-black text-[11px] transition-all ${selectedQty === num ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-100'}`}
                      >
                        {num}
                      </button>
                    ))}
                 </div>
              </div>

              <div className="flex gap-3">
                 <button 
                   onClick={confirmAddWithQty}
                   className="flex-1 py-5 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-100 uppercase text-xs tracking-widest active:scale-95 transition-all"
                 >
                   LANÇAR AGORA
                 </button>
                 <button 
                   onClick={() => setQtySelector(null)}
                   className="px-6 py-5 bg-gray-100 text-gray-400 font-bold rounded-2xl text-[10px] uppercase"
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

const PaymentBtnLarge = ({ active, onClick, label, icon }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border-2 transition-all ${active ? 'border-red-600 bg-red-600 text-white shadow-xl shadow-red-100 scale-105 z-10' : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-red-100'}`}>
    <div className={`p-3 rounded-2xl ${active ? 'bg-white/20' : 'bg-white'}`}>{icon}</div>
    <span className="text-[11px] font-black uppercase tracking-widest leading-none">{label}</span>
  </button>
);

export default POS;
