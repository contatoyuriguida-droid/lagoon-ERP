import React, { useState, useMemo } from 'react';
import { Users, Plus, X, DollarSign, ArrowLeftRight, CreditCard, Search, Smartphone, Banknote, ShoppingBag, Wallet, Printer as PrinterIcon, LayoutGrid, List } from 'lucide-react';
import { Table, TableStatus, Product, Customer, PaymentMethod, User, UserRole } from '../types.ts';

interface POSProps {
  currentUser: User;
  tables: Table[];
  products: Product[];
  onAddItems: (tableId: number, product: Product, quantity: number) => void;
  onFinalize: (tableId: number, itemIds: string[], method: PaymentMethod, amountPaid: number, change: number) => void;
  onAddTable: () => void;
}

const POS: React.FC<POSProps> = ({ currentUser, tables, products, onAddItems, onFinalize, onAddTable }) => {
  const [activeTab, setActiveTab] = useState<'TABLES' | 'COMANDAS'>('TABLES');
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [isAddingItems, setIsAddingItems] = useState(false);
  const [isClosingBill, setIsClosingBill] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [amountReceived, setAmountReceived] = useState<string>("");

  const currentTable = useMemo(() => tables.find(t => t.id === selectedTableId), [tables, selectedTableId]);

  const totalBill = useMemo(() => {
    if (!currentTable) return 0;
    return currentTable.orderItems.reduce((s, i) => s + (i.price * i.quantity), 0);
  }, [currentTable]);

  const changeValue = useMemo(() => {
    const received = parseFloat(amountReceived) || 0;
    return Math.max(0, received - totalBill);
  }, [amountReceived, totalBill]);

  const handleFinalize = () => {
    if (!currentTable || !paymentMethod) return;
    const itemIds = currentTable.orderItems.map(i => i.id);
    const finalReceived = paymentMethod === PaymentMethod.CASH ? parseFloat(amountReceived) : totalBill;
    
    onFinalize(currentTable.id, itemIds, paymentMethod, finalReceived, changeValue);
    
    // Reset local UI
    setSelectedTableId(null);
    setIsClosingBill(false);
    setPaymentMethod(null);
    setAmountReceived("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
          <button onClick={() => setActiveTab('TABLES')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs uppercase transition-all ${activeTab === 'TABLES' ? 'bg-red-600 text-white' : 'text-gray-400'}`}>
            <LayoutGrid size={14} /> Mapa de Mesas
          </button>
          <button onClick={() => setActiveTab('COMANDAS')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs uppercase transition-all ${activeTab === 'COMANDAS' ? 'bg-red-600 text-white' : 'text-gray-400'}`}>
            <List size={14} /> Comandas Ativas
          </button>
        </div>
        {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER) && (
          <button onClick={onAddTable} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-[10px] uppercase shadow-lg hover:scale-105 transition-all">
            <Plus size={14} /> Nova Mesa
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-3">
        {tables.filter(t => activeTab === 'TABLES' || t.status === TableStatus.OCCUPIED).map(table => (
          <button
            key={table.id}
            onClick={() => setSelectedTableId(table.id)}
            className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 group relative ${
              table.status === TableStatus.OCCUPIED 
                ? 'border-red-600 bg-red-50 text-red-700 shadow-md ring-2 ring-red-100 ring-offset-2' 
                : 'border-white bg-white hover:border-red-200 shadow-sm'
            }`}
          >
            <span className="font-bold text-lg tracking-tight">#{table.id}</span>
            <div className="h-1.5 w-1.5 rounded-full bg-current opacity-30 mb-1" />
            <span className="text-[9px] font-bold opacity-70 uppercase truncate max-w-full">
              {table.status === TableStatus.OCCUPIED 
                ? `R$ ${table.orderItems.reduce((s, i) => s + (i.price * i.quantity), 0).toFixed(0)}` 
                : 'Livre'}
            </span>
          </button>
        ))}
      </div>

      {currentTable && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedTableId(null)} />
          <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-red-600 text-white rounded-xl flex items-center justify-center font-bold text-lg">{currentTable.id}</div>
                <div>
                  <h2 className="text-base font-bold">Mesa {currentTable.id}</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Comanda #{currentTable.comandaId || 'NOVA'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedTableId(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50/50">
              {isAddingItems ? (
                <div className="p-4 space-y-2">
                   {products.map(p => (
                     <button key={p.id} onClick={() => onAddItems(currentTable.id, p, 1)} className="w-full p-4 bg-white border border-gray-100 rounded-xl hover:border-red-300 flex justify-between items-center text-left">
                       <div>
                          <p className="font-bold text-sm text-gray-800 leading-tight">{p.name}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">{p.category}</p>
                       </div>
                       <p className="text-red-600 font-bold text-sm">R$ {p.price.toFixed(2)}</p>
                     </button>
                   ))}
                </div>
              ) : isClosingBill ? (
                <div className="p-6 space-y-6">
                  <div className="bg-red-600 p-8 rounded-2xl shadow-lg text-white text-center">
                    <p className="text-[9px] font-bold uppercase opacity-80 mb-2">Total a Pagar</p>
                    <p className="text-4xl font-bold">R$ {totalBill.toFixed(2)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <PaymentBtnCompact active={paymentMethod === PaymentMethod.PIX} onClick={() => setPaymentMethod(PaymentMethod.PIX)} label="PIX" icon={<Smartphone size={18} />} />
                    <PaymentBtnCompact active={paymentMethod === PaymentMethod.CREDIT} onClick={() => setPaymentMethod(PaymentMethod.CREDIT)} label="CRÉDITO" icon={<CreditCard size={18} />} />
                    <PaymentBtnCompact active={paymentMethod === PaymentMethod.DEBIT} onClick={() => setPaymentMethod(PaymentMethod.DEBIT)} label="DÉBITO" icon={<Wallet size={18} />} />
                    <PaymentBtnCompact active={paymentMethod === PaymentMethod.CASH} onClick={() => setPaymentMethod(PaymentMethod.CASH)} label="DINHEIRO" icon={<Banknote size={18} />} />
                  </div>
                  {paymentMethod === PaymentMethod.CASH && (
                    <div className="space-y-4">
                      <input type="number" value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} className="w-full p-4 bg-white rounded-xl text-2xl font-bold border-2 border-red-500 outline-none text-center" placeholder="Valor Pago" />
                      {parseFloat(amountReceived) >= totalBill && (
                        <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-center">
                           <span className="text-[10px] text-green-600 font-bold uppercase block">Troco: R$ {changeValue.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 space-y-2">
                   {currentTable.orderItems.map(item => (
                     <div key={item.id} className="p-3 bg-white rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-3">
                           <span className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 rounded-lg text-xs font-bold">{item.quantity}x</span>
                           <p className="font-bold text-xs text-gray-800">{item.name} {item.status === 'READY' && '✅'}</p>
                        </div>
                        <p className="font-bold text-xs text-gray-900">R$ {(item.price * item.quantity).toFixed(2)}</p>
                     </div>
                   ))}
                   {currentTable.orderItems.length === 0 && <p className="text-center text-gray-400 py-10 text-xs italic">Nenhum item lançado.</p>}
                </div>
              )}
            </div>

            <div className="p-6 bg-white border-t border-gray-100 space-y-3">
               {isAddingItems ? (
                 <button onClick={() => setIsAddingItems(false)} className="w-full py-4 bg-red-600 text-white font-bold rounded-xl uppercase text-xs">LANÇAR PEDIDO</button>
               ) : isClosingBill ? (
                 <button disabled={!paymentMethod} onClick={handleFinalize} className="w-full py-4 bg-red-600 text-white font-bold rounded-xl uppercase text-xs disabled:opacity-40">FECHAR CONTA</button>
               ) : (
                 <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setIsAddingItems(true)} className="py-4 bg-red-600 text-white rounded-xl font-bold text-xs shadow-md"><Plus className="inline mr-1" size={14} /> ITEM</button>
                    <button disabled={totalBill === 0} onClick={() => setIsClosingBill(true)} className="py-4 bg-white border-2 border-red-600 text-red-600 rounded-xl font-bold text-xs disabled:opacity-30">RECEBER</button>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PaymentBtnCompact = ({ active, onClick, label, icon }: any) => (
  <button onClick={onClick} className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${active ? 'border-red-600 bg-red-600 text-white' : 'border-gray-100 bg-white text-gray-400'}`}>
    {icon}
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
  </button>
);

export default POS;