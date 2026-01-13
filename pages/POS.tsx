
import React, { useState, useMemo } from 'react';
import { Users, Plus, X, DollarSign, ArrowLeftRight, CreditCard, Search, Smartphone, Banknote, ShoppingBag, Wallet, Printer as PrinterIcon } from 'lucide-react';
import { Table, TableStatus, Product, Customer, PaymentMethod } from '../types';

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
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isAddingItems, setIsAddingItems] = useState(false);
  const [isClosingBill, setIsClosingBill] = useState(false);
  const [payingItems, setPayingItems] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [transferModal, setTransferModal] = useState<{ isOpen: boolean; targetTableId: number | null }>({ isOpen: false, targetTableId: null });

  const currentTable = selectedTable ? tables.find(t => t.id === selectedTable.id) : null;

  const totalBill = useMemo(() => {
    if (!currentTable) return 0;
    const itemsToSum = payingItems.length > 0 ? currentTable.orderItems.filter(i => payingItems.includes(i.id)) : currentTable.orderItems;
    return itemsToSum.reduce((s, i) => s + (i.price * i.quantity), 0);
  }, [currentTable, payingItems]);

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
    setPayingItems([]);
    setIsClosingBill(false);
    setIsAddingItems(false);
    setPaymentMethod(null);
    setAmountReceived("");
  };

  const handleAddProduct = (p: Product) => {
    if (!currentTable) return;
    onAddItems(currentTable.id, p, 1);
  };

  const addNewTable = () => {
    const nextId = tables.length + 1;
    const newTable: Table = {
      id: nextId,
      status: TableStatus.AVAILABLE,
      orderItems: [],
      customerCount: 0,
      lastUpdate: Date.now()
    };
    setTables([...tables, newTable]);
  };

  const handleFinalize = () => {
    if (!currentTable || !paymentMethod) return;
    const itemIds = payingItems.length > 0 ? payingItems : currentTable.orderItems.map(i => i.id);
    const finalReceived = paymentMethod === PaymentMethod.CASH ? parseFloat(amountReceived) : totalBill;
    
    onFinalize(
      currentTable.id, 
      itemIds, 
      paymentMethod, 
      finalReceived, 
      changeValue,
      undefined
    );
    setSelectedTable(null);
  };

  const printBill = () => {
    alert(`Imprimindo pré-conta da Mesa ${currentTable?.id}...`);
  };

  return (
    <div className="h-full flex flex-col gap-6 relative">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {tables.map(table => (
          <button
            key={table.id}
            onClick={() => handleOpenTable(table)}
            className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 relative ${
              table.status === TableStatus.OCCUPIED ? 'border-red-200 bg-red-50 text-red-700 shadow-sm' : 'border-gray-100 bg-white hover:border-red-300'
            }`}
          >
            <span className="font-bold text-lg">Mesa {table.id}</span>
            <span className="text-xs opacity-70">
              {table.status === TableStatus.OCCUPIED 
                ? `R$ ${table.orderItems.reduce((s, i) => s + (i.price * i.quantity), 0).toFixed(2)}` 
                : 'Disponível'}
            </span>
          </button>
        ))}
        <button 
          onClick={addNewTable}
          className="p-6 rounded-2xl border-2 border-dashed border-gray-200 bg-transparent text-gray-400 hover:border-red-400 hover:text-red-400 transition-all flex flex-col items-center justify-center gap-1"
        >
          <Plus size={24} />
          <span className="text-xs font-bold uppercase">Nova Mesa</span>
        </button>
      </div>

      {selectedTable && currentTable && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
              <div>
                <h2 className="text-2xl font-bold">Mesa {currentTable.id}</h2>
                <span className="text-xs text-gray-400 uppercase font-bold tracking-widest">Painel de Atendimento</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={printBill} className="p-2 text-gray-400 hover:text-red-600 rounded-lg bg-gray-50">
                  <PrinterIcon size={20} />
                </button>
                <button onClick={() => setSelectedTable(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X /></button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              {isAddingItems ? (
                <div className="flex-1 flex flex-col bg-gray-50">
                  <div className="p-4 bg-white border-b">
                    <div className="relative">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                       <input type="text" placeholder="Pesquisar itens..." className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-red-500" />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3">
                    {products.map(p => (
                      <button 
                        key={p.id} 
                        onClick={() => handleAddProduct(p)}
                        className="p-4 bg-white border border-gray-100 rounded-2xl hover:border-red-500 hover:shadow-lg transition-all text-left group"
                      >
                        <p className="font-bold text-gray-800 group-hover:text-red-600 transition-colors">{p.name}</p>
                        <p className="text-red-600 font-bold text-sm mt-1">R$ {p.price.toFixed(2)}</p>
                      </button>
                    ))}
                  </div>
                  <div className="p-4 bg-white border-t">
                    <button onClick={() => setIsAddingItems(false)} className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl shadow-xl shadow-red-100">Confirmar Pedido</button>
                  </div>
                </div>
              ) : isClosingBill ? (
                <div className="flex-1 flex flex-col bg-gray-50 animate-in slide-in-from-bottom duration-300">
                  <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
                       <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Total a Pagar</p>
                       <p className="text-5xl font-black text-red-600">R$ {totalBill.toFixed(2)}</p>
                    </div>

                    <div className="space-y-4">
                      <p className="text-xs font-black text-gray-500 uppercase tracking-widest px-1">Método de Pagamento</p>
                      <div className="grid grid-cols-2 gap-3">
                        <PaymentMethodCard active={paymentMethod === PaymentMethod.PIX} onClick={() => setPaymentMethod(PaymentMethod.PIX)} label="PIX" icon={<Smartphone size={24} />} />
                        <PaymentMethodCard active={paymentMethod === PaymentMethod.CREDIT} onClick={() => setPaymentMethod(PaymentMethod.CREDIT)} label="Cartão" icon={<CreditCard size={24} />} />
                        <PaymentMethodCard active={paymentMethod === PaymentMethod.CASH} onClick={() => setPaymentMethod(PaymentMethod.CASH)} label="Dinheiro" icon={<Banknote size={24} />} />
                        <PaymentMethodCard active={paymentMethod === PaymentMethod.DEBIT} onClick={() => setPaymentMethod(PaymentMethod.DEBIT)} label="Débito" icon={<Wallet size={24} />} />
                      </div>
                    </div>

                    {paymentMethod === PaymentMethod.CASH && (
                      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4 animate-in fade-in slide-in-from-top-4">
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Valor Recebido</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-300 text-xl">R$</span>
                            <input type="number" value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} placeholder="0,00" className="w-full pl-12 pr-4 py-5 bg-gray-50 rounded-2xl text-3xl font-black outline-none border-2 border-transparent focus:border-red-500 transition-all" />
                          </div>
                        </div>
                        {parseFloat(amountReceived) >= totalBill && (
                          <div className="p-5 bg-green-50 border border-green-100 rounded-2xl flex justify-between items-center">
                            <div>
                               <span className="text-[10px] text-green-600 font-bold uppercase">Troco</span>
                               <span className="block text-3xl font-black text-green-700">R$ {changeValue.toFixed(2)}</span>
                            </div>
                            <div className="p-3 bg-green-600 text-white rounded-full"><Banknote /></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-6 bg-white border-t space-y-3">
                    <button 
                      disabled={!canFinalize}
                      onClick={handleFinalize}
                      className="w-full py-5 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-200 disabled:opacity-50 transition-all text-lg tracking-tight"
                    >
                      {paymentMethod === PaymentMethod.CASH && changeValue > 0 ? 'PAGAR E DAR TROCO' : 'EFETIVAR PAGAMENTO'}
                    </button>
                    <button onClick={() => { setIsClosingBill(false); setPaymentMethod(null); setAmountReceived(""); }} className="w-full py-2 text-gray-400 font-bold text-[10px] uppercase tracking-widest">Voltar</button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col bg-gray-50">
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {currentTable.orderItems.length > 0 ? (
                      currentTable.orderItems.map(item => (
                        <div key={item.id} className="p-4 bg-white rounded-2xl border border-gray-100 flex justify-between items-center shadow-sm hover:border-red-100 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center font-black text-xs">
                              {item.quantity}x
                            </div>
                            <div>
                              <p className="font-bold text-gray-800">{item.name}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{item.status}</p>
                            </div>
                          </div>
                          <span className="font-black text-gray-900">R$ {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-300">
                        <ShoppingBag size={64} strokeWidth={1} className="mb-4 opacity-20" />
                        <p className="font-bold">Mesa Sem Lançamentos</p>
                      </div>
                    )}
                  </div>

                  <div className="p-6 bg-white border-t border-gray-100 space-y-4">
                    <div className="flex justify-between items-center px-2">
                       <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Valor da Comanda</span>
                       <span className="text-3xl font-black text-gray-900">R$ {totalBill.toFixed(2)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setIsAddingItems(true)} className="flex items-center justify-center gap-2 py-5 bg-red-600 text-white rounded-2xl font-black shadow-lg shadow-red-100 hover:bg-red-700 transition-all">
                        <Plus size={20} /> ADICIONAR ITENS
                      </button>
                      <button 
                        disabled={currentTable.orderItems.length === 0}
                        onClick={() => setIsClosingBill(true)} 
                        className="flex items-center justify-center gap-2 py-5 bg-white border-2 border-red-600 text-red-600 rounded-2xl font-black hover:bg-red-50 transition-all disabled:opacity-20 disabled:border-gray-200"
                      >
                        <DollarSign size={20} /> FECHAR VENDA
                      </button>
                      <button onClick={() => setTransferModal({ isOpen: true, targetTableId: null })} className="col-span-2 py-2 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-red-600 transition-colors">
                        Mudar Mesa / Juntar Comanda
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {transferModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white p-8 rounded-[40px] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="text-center mb-8">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg"><ArrowLeftRight size={28} /></div>
                <h3 className="text-2xl font-black text-gray-900">Mover Mesa {currentTable?.id}</h3>
                <p className="text-gray-400 text-sm mt-1">Destino da transferência</p>
             </div>
             <div className="grid grid-cols-4 gap-3 mb-8 max-h-40 overflow-y-auto pr-2">
                {tables.filter(t => t.id !== currentTable?.id && t.status === TableStatus.AVAILABLE).map(t => (
                  <button key={t.id} onClick={() => setTransferModal({ ...transferModal, targetTableId: t.id })} className={`aspect-square rounded-2xl border-2 font-black transition-all text-lg ${transferModal.targetTableId === t.id ? 'border-red-600 bg-red-600 text-white shadow-xl shadow-red-200 scale-105' : 'border-gray-100 hover:border-red-200 text-gray-500'}`}>{t.id}</button>
                ))}
             </div>
             <button disabled={!transferModal.targetTableId} onClick={() => { onTransfer(currentTable!.id, transferModal.targetTableId!); setTransferModal({ isOpen: false, targetTableId: null }); setSelectedTable(null); }} className="w-full py-5 bg-red-600 text-white font-black rounded-2xl disabled:opacity-50 shadow-xl shadow-red-100 hover:bg-red-700 transition-all">TRANSFERIR TUDO</button>
             <button onClick={() => setTransferModal({ isOpen: false, targetTableId: null })} className="w-full py-3 mt-2 text-gray-400 font-bold text-[10px] uppercase">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};

const PaymentMethodCard = ({ active, onClick, label, icon }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border-2 transition-all ${active ? 'border-red-600 bg-red-600 text-white shadow-xl shadow-red-200 scale-105' : 'border-transparent bg-white text-gray-400 hover:border-red-50 shadow-sm'}`}>
    <div className={`${active ? 'text-white' : 'text-gray-300'}`}>{icon}</div>
    <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
  </button>
);

export default POS;
