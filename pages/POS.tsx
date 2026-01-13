
import React, { useState, useMemo } from 'react';
import { Users, Plus, X, DollarSign, ArrowLeftRight, CreditCard, Search, Smartphone, Banknote, ShoppingBag, Wallet, Printer as PrinterIcon, ReceiptText, LayoutGrid, List } from 'lucide-react';
import { Table, TableStatus, Product, Customer, PaymentMethod, OrderStatus } from '../types.ts';

interface POSProps {
  tables: Table[];
  setTables: React.Dispatch<React.SetStateAction<Table[]>>;
  products: Product[];
  customers: Customer[];
  onAddItems: (tableId: number, product: Product, quantity: number) => void;
  onFinalize: (tableId: number, itemIds: string[], method: PaymentMethod, amountPaid: number, change: number, customerId?: string) => void;
  onTransfer: (from: number, to: number) => void;
}

const POS: React.FC<POSProps> = ({ tables, setTables, products, onAddItems, onFinalize, onTransfer, customers }) => {
  const [activeTab, setActiveTab] = useState<'TABLES' | 'COMANDAS'>('TABLES');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isAddingItems, setIsAddingItems] = useState(false);
  const [isClosingBill, setIsClosingBill] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [transferModal, setTransferModal] = useState<{ isOpen: boolean; targetTableId: number | null }>({ isOpen: false, targetTableId: null });

  const currentTable = selectedTable ? tables.find(t => t.id === selectedTable.id) : null;

  const totalBill = useMemo(() => {
    if (!currentTable) return 0;
    return currentTable.orderItems.reduce((s, i) => s + (i.price * i.quantity), 0);
  }, [currentTable]);

  const changeValue = useMemo(() => {
    const received = parseFloat(amountReceived) || 0;
    return Math.max(0, received - totalBill);
  }, [amountReceived, totalBill]);

  const canFinalize = useMemo(() => {
    if (!paymentMethod) return false;
    if (paymentMethod === PaymentMethod.CASH) {
      return (parseFloat(amountReceived) || 0) >= totalBill;
    }
    return true;
  }, [paymentMethod, amountReceived, totalBill]);

  const handleOpenTable = (table: Table) => {
    setSelectedTable(table);
    setIsClosingBill(false);
    setIsAddingItems(false);
    setPaymentMethod(null);
    setAmountReceived("");
  };

  const handleAddProduct = (p: Product) => {
    if (!currentTable) return;
    onAddItems(currentTable.id, p, 1);
  };

  const handleFinalize = () => {
    if (!currentTable || !paymentMethod) return;
    const itemIds = currentTable.orderItems.map(i => i.id);
    const finalReceived = paymentMethod === PaymentMethod.CASH ? parseFloat(amountReceived) : totalBill;
    
    onFinalize(currentTable.id, itemIds, paymentMethod, finalReceived, changeValue);
    setSelectedTable(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Tabs Compact */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
          <button 
            onClick={() => setActiveTab('TABLES')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wide transition-all ${activeTab === 'TABLES' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-400 hover:text-red-600'}`}
          >
            <LayoutGrid size={14} /> Mapa de Mesas
          </button>
          <button 
            onClick={() => setActiveTab('COMANDAS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wide transition-all ${activeTab === 'COMANDAS' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-400 hover:text-red-600'}`}
          >
            <List size={14} /> Comandas Ativas
          </button>
        </div>
        <button 
          onClick={() => alert('Nova mesa disponível apenas via Gestor')}
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-500 font-bold text-[10px] uppercase hover:border-red-500 hover:text-red-600 transition-all"
        >
          <Plus size={14} /> Nova Mesa
        </button>
      </div>

      {/* Grid Mesas Profissional */}
      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-3 lg:gap-4">
        {tables.filter(t => activeTab === 'TABLES' || t.status === TableStatus.OCCUPIED).map(table => (
          <button
            key={table.id}
            onClick={() => handleOpenTable(table)}
            className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 group relative ${
              table.status === TableStatus.OCCUPIED 
                ? 'border-red-600 bg-red-50 text-red-700 shadow-md ring-2 ring-red-100 ring-offset-2' 
                : 'border-white bg-white hover:border-red-200 shadow-sm hover:shadow-md'
            }`}
          >
            <span className="font-bold text-base sm:text-lg tracking-tight">#{table.id}</span>
            <div className="h-1.5 w-1.5 rounded-full bg-current opacity-30 mb-1" />
            <span className="text-[9px] font-bold opacity-70 uppercase tracking-widest truncate max-w-full">
              {table.status === TableStatus.OCCUPIED 
                ? `R$ ${table.orderItems.reduce((s, i) => s + (i.price * i.quantity), 0).toFixed(0)}` 
                : 'Livre'}
            </span>
          </button>
        ))}
      </div>

      {/* Drawer Responsivo */}
      {selectedTable && currentTable && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedTable(null)} />
          
          <div className="relative w-full max-w-md lg:max-w-lg bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-20">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-red-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
                  {currentTable.id}
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 leading-none">Mesa {currentTable.id}</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Comanda #{currentTable.comandaId || 'NOVA'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => alert('Imprimindo...')} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all"><PrinterIcon size={18} /></button>
                <button onClick={() => setSelectedTable(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"><X size={20} /></button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto bg-gray-50/50">
              {isAddingItems ? (
                /* Cardápio Compacto */
                <div className="p-4 space-y-4">
                   <div className="relative mb-6">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                      <input type="text" placeholder="Buscar no cardápio..." className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-red-500 outline-none" />
                   </div>
                   <div className="grid grid-cols-1 gap-2">
                     {products.map(p => (
                       <button key={p.id} onClick={() => handleAddProduct(p)} className="p-4 bg-white border border-gray-100 rounded-xl hover:border-red-300 transition-all text-left flex justify-between items-center group">
                         <div>
                            <p className="font-bold text-sm text-gray-800 leading-tight mb-1">{p.name}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">{p.category}</p>
                         </div>
                         <p className="text-red-600 font-bold text-sm">R$ {p.price.toFixed(2)}</p>
                       </button>
                     ))}
                   </div>
                </div>
              ) : isClosingBill ? (
                /* Checkout Refinado */
                <div className="p-6 space-y-6">
                  <div className="bg-red-600 p-8 rounded-2xl shadow-lg text-white text-center relative overflow-hidden">
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-80 mb-2">Total a Pagar</p>
                    <p className="text-4xl font-bold tracking-tight">R$ {totalBill.toFixed(2)}</p>
                    <DollarSign size={80} className="absolute -right-4 -bottom-4 opacity-10" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <PaymentBtnCompact active={paymentMethod === PaymentMethod.PIX} onClick={() => setPaymentMethod(PaymentMethod.PIX)} label="PIX" icon={<Smartphone size={18} />} />
                    <PaymentBtnCompact active={paymentMethod === PaymentMethod.CREDIT} onClick={() => setPaymentMethod(PaymentMethod.CREDIT)} label="CRÉDITO" icon={<CreditCard size={18} />} />
                    <PaymentBtnCompact active={paymentMethod === PaymentMethod.DEBIT} onClick={() => setPaymentMethod(PaymentMethod.DEBIT)} label="DÉBITO" icon={<Wallet size={18} />} />
                    <PaymentBtnCompact active={paymentMethod === PaymentMethod.CASH} onClick={() => setPaymentMethod(PaymentMethod.CASH)} label="DINHEIRO" icon={<Banknote size={18} />} />
                  </div>

                  {paymentMethod === PaymentMethod.CASH && (
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-4 animate-in zoom-in-95">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase block">Valor Recebido (R$)</label>
                        <input type="number" value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl text-2xl font-bold border-2 border-transparent focus:border-red-500 outline-none transition-all text-center" placeholder="0,00" />
                      </div>
                      {parseFloat(amountReceived) >= totalBill && (
                        <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-center">
                           <span className="text-[10px] text-green-600 font-bold uppercase block mb-1">Troco</span>
                           <span className="text-2xl font-bold text-green-700">R$ {changeValue.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Itens da Comanda */
                <div className="p-4 space-y-2">
                   {currentTable.orderItems.map(item => (
                     <div key={item.id} className="p-3 bg-white rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-3">
                           <span className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 rounded-lg text-xs font-bold">{item.quantity}x</span>
                           <div>
                              <p className="font-bold text-xs text-gray-800">{item.name}</p>
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{item.status}</span>
                           </div>
                        </div>
                        <p className="font-bold text-xs text-gray-900">R$ {(item.price * item.quantity).toFixed(2)}</p>
                     </div>
                   ))}
                   {currentTable.orderItems.length === 0 && (
                     <div className="py-20 text-center opacity-20 flex flex-col items-center">
                       <ShoppingBag size={48} strokeWidth={1} />
                       <p className="text-xs font-bold uppercase mt-2">Sem pedidos</p>
                     </div>
                   )}
                </div>
              )}
            </div>

            {/* Drawer Footer Fixed */}
            <div className="p-6 bg-white border-t border-gray-100 space-y-3 z-30">
               {isAddingItems ? (
                 <button onClick={() => setIsAddingItems(false)} className="w-full py-4 bg-red-600 text-white font-bold rounded-xl shadow-lg text-sm uppercase tracking-widest transition-all active:scale-95">LANÇAR PEDIDO</button>
               ) : isClosingBill ? (
                 <div className="space-y-2">
                    <button disabled={!canFinalize} onClick={handleFinalize} className="w-full py-4 bg-red-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-40 text-sm uppercase tracking-widest">FECHAR CONTA</button>
                    <button onClick={() => { setIsClosingBill(false); setPaymentMethod(null); }} className="w-full py-2 text-gray-400 text-[10px] font-bold uppercase tracking-widest">Voltar</button>
                 </div>
               ) : (
                 <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                       <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Subtotal</span>
                       <span className="text-2xl font-bold text-gray-900 tracking-tight">R$ {totalBill.toFixed(2)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setIsAddingItems(true)} className="flex items-center justify-center gap-2 py-4 bg-red-600 text-white rounded-xl font-bold text-xs shadow-md hover:bg-red-700 active:scale-95 transition-all">
                        <Plus size={16} /> NOVO ITEM
                      </button>
                      <button disabled={totalBill === 0} onClick={() => setIsClosingBill(true)} className="flex items-center justify-center gap-2 py-4 bg-white border-2 border-red-600 text-red-600 rounded-xl font-bold text-xs hover:bg-red-50 disabled:opacity-20 active:scale-95 transition-all">
                        <DollarSign size={16} /> RECEBER
                      </button>
                    </div>
                    <button onClick={() => setTransferModal({ isOpen: true, targetTableId: null })} className="w-full py-2 text-gray-400 text-[9px] font-bold uppercase tracking-[0.2em] text-center hover:text-red-600 transition-colors">Transferir p/ Mesa</button>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Transferência Compacto */}
      {transferModal.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95">
             <div className="text-center mb-6">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mx-auto mb-3"><ArrowLeftRight size={20} /></div>
                <h3 className="text-lg font-bold text-gray-900">Transferir Mesa</h3>
                <p className="text-xs text-gray-400 font-medium">Mover pedidos da Mesa {currentTable?.id}</p>
             </div>
             <div className="grid grid-cols-4 gap-2 mb-6 max-h-40 overflow-y-auto p-1">
                {tables.filter(t => t.id !== currentTable?.id && t.status === TableStatus.AVAILABLE).map(t => (
                  <button key={t.id} onClick={() => setTransferModal({ ...transferModal, targetTableId: t.id })} className={`aspect-square rounded-lg border font-bold text-sm transition-all ${transferModal.targetTableId === t.id ? 'border-red-600 bg-red-600 text-white' : 'border-gray-200 bg-gray-50 text-gray-400 hover:border-red-400'}`}>{t.id}</button>
                ))}
             </div>
             <div className="grid grid-cols-2 gap-3">
                <button disabled={!transferModal.targetTableId} onClick={() => { onTransfer(currentTable!.id, transferModal.targetTableId!); setTransferModal({ isOpen: false, targetTableId: null }); setSelectedTable(null); }} className="py-3 bg-red-600 text-white font-bold rounded-xl shadow-md text-xs uppercase disabled:opacity-40">Confirmar</button>
                <button onClick={() => setTransferModal({ isOpen: false, targetTableId: null })} className="py-3 bg-gray-100 text-gray-500 font-bold rounded-xl text-xs uppercase">Sair</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PaymentBtnCompact = ({ active, onClick, label, icon }: any) => (
  <button onClick={onClick} className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all active:scale-95 ${active ? 'border-red-600 bg-red-600 text-white shadow-md scale-[1.02]' : 'border-gray-100 bg-white text-gray-400 hover:border-red-100'}`}>
    <div className={active ? 'text-white' : 'text-red-500'}>{icon}</div>
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
  </button>
);

export default POS;
