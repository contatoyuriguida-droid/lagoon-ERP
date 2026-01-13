
import React, { useState, useMemo } from 'react';
import { Users, Plus, X, DollarSign, ArrowLeftRight, CreditCard, Search, Smartphone, Banknote, ShoppingBag, Wallet, Printer as PrinterIcon, ReceiptText } from 'lucide-react';
// Added OrderStatus to the imports from '../types'
import { Table, TableStatus, Product, Customer, PaymentMethod, OrderStatus } from '../types';

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
    alert(`Imprimindo pré-conta da Mesa ${currentTable?.id} (Comanda #${currentTable?.comandaId})...`);
  };

  return (
    <div className="h-full flex flex-col gap-6 relative">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {tables.map(table => (
          <button
            key={table.id}
            onClick={() => handleOpenTable(table)}
            className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 relative ${
              table.status === TableStatus.OCCUPIED 
                ? 'border-red-600 bg-red-50 text-red-700 shadow-xl shadow-red-100 scale-105 z-10' 
                : 'border-gray-100 bg-white hover:border-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-black text-xl">Mesa {table.id}</span>
            </div>
            {table.comandaId && (
              <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">
                CMD #{table.comandaId}
              </span>
            )}
            <span className="text-xs font-bold opacity-70">
              {table.status === TableStatus.OCCUPIED 
                ? `R$ ${table.orderItems.reduce((s, i) => s + (i.price * i.quantity), 0).toFixed(2)}` 
                : 'Livre'}
            </span>
          </button>
        ))}
        <button 
          onClick={addNewTable}
          className="p-6 rounded-3xl border-2 border-dashed border-gray-200 bg-transparent text-gray-400 hover:border-red-400 hover:text-red-400 transition-all flex flex-col items-center justify-center gap-1 group"
        >
          <Plus size={32} className="group-hover:scale-110 transition-transform" />
          <span className="text-xs font-black uppercase">Nova Mesa</span>
        </button>
      </div>

      {selectedTable && currentTable && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-xl bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 ease-out">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-red-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-red-200">
                  {currentTable.id}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 leading-tight">Mesa {currentTable.id}</h2>
                  {currentTable.comandaId ? (
                    <div className="flex items-center gap-2 text-red-600 font-bold text-xs">
                      <ReceiptText size={14} /> <span>COMANDA #{currentTable.comandaId}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Aguardando Pedido</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={printBill} className="p-3 text-gray-400 hover:text-red-600 rounded-2xl bg-gray-50 hover:bg-red-50 transition-all">
                  <PrinterIcon size={24} />
                </button>
                <button onClick={() => setSelectedTable(null)} className="p-3 hover:bg-gray-100 rounded-full transition-colors text-gray-400"><X size={24} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col relative">
              {isAddingItems ? (
                <div className="flex-1 flex flex-col bg-gray-50 animate-in fade-in duration-200">
                  <div className="p-6 bg-white border-b shadow-sm">
                    <div className="relative">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                       <input type="text" placeholder="Buscar no cardápio..." className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-red-500 outline-none text-lg font-medium" />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4">
                    {products.map(p => (
                      <button 
                        key={p.id} 
                        onClick={() => handleAddProduct(p)}
                        className="p-5 bg-white border border-transparent rounded-3xl hover:border-red-500 hover:shadow-2xl hover:-translate-y-1 transition-all text-left group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-black text-gray-800 group-hover:text-red-600 transition-colors line-clamp-2">{p.name}</p>
                        </div>
                        <p className="text-red-600 font-black text-lg">R$ {p.price.toFixed(2)}</p>
                      </button>
                    ))}
                  </div>
                  <div className="p-6 bg-white border-t border-gray-100">
                    <button onClick={() => setIsAddingItems(false)} className="w-full py-5 bg-red-600 text-white font-black rounded-3xl shadow-2xl shadow-red-200 text-xl active:scale-95 transition-transform">LANÇAR ITENS</button>
                  </div>
                </div>
              ) : isClosingBill ? (
                <div className="flex-1 flex flex-col bg-gray-50 animate-in slide-in-from-bottom duration-500">
                  <div className="p-8 space-y-8 flex-1 overflow-y-auto">
                    <div className="bg-red-600 p-10 rounded-[40px] shadow-2xl shadow-red-200 text-white relative overflow-hidden group">
                       <div className="relative z-10">
                          <p className="text-red-100 text-xs font-black uppercase tracking-[0.2em] mb-2 opacity-80">Total da Comanda</p>
                          <p className="text-6xl font-black tracking-tighter">R$ {totalBill.toFixed(2)}</p>
                       </div>
                       <DollarSign size={160} className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-700" />
                    </div>

                    <div className="space-y-4">
                      <p className="text-xs font-black text-gray-500 uppercase tracking-widest px-1">Selecione o Pagamento</p>
                      <div className="grid grid-cols-2 gap-4">
                        <PaymentMethodCard active={paymentMethod === PaymentMethod.PIX} onClick={() => setPaymentMethod(PaymentMethod.PIX)} label="PIX / QR CODE" icon={<Smartphone size={32} />} />
                        <PaymentMethodCard active={paymentMethod === PaymentMethod.CREDIT} onClick={() => setPaymentMethod(PaymentMethod.CREDIT)} label="CARTÃO CRÉDITO" icon={<CreditCard size={32} />} />
                        <PaymentMethodCard active={paymentMethod === PaymentMethod.DEBIT} onClick={() => setPaymentMethod(PaymentMethod.DEBIT)} label="CARTÃO DÉBITO" icon={<Wallet size={32} />} />
                        <PaymentMethodCard active={paymentMethod === PaymentMethod.CASH} onClick={() => setPaymentMethod(PaymentMethod.CASH)} label="DINHEIRO VIVO" icon={<Banknote size={32} />} />
                      </div>
                    </div>

                    {paymentMethod === PaymentMethod.CASH && (
                      <div className="bg-white p-8 rounded-[40px] shadow-xl border border-gray-100 space-y-6 animate-in zoom-in-95">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 text-center">Quanto o cliente pagou em mãos?</label>
                          <div className="relative">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-200 text-3xl italic">R$</span>
                            <input type="number" value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} placeholder="0,00" className="w-full pl-20 pr-6 py-8 bg-gray-50 rounded-3xl text-5xl font-black outline-none border-4 border-transparent focus:border-red-500 transition-all text-center" />
                          </div>
                        </div>
                        {parseFloat(amountReceived) >= totalBill && (
                          <div className="p-6 bg-green-50 border-2 border-green-100 rounded-3xl flex flex-col items-center gap-1">
                               <span className="text-[10px] text-green-600 font-black uppercase tracking-widest">Troco Obrigatório</span>
                               <span className="text-5xl font-black text-green-700 tracking-tighter">R$ {changeValue.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-8 bg-white border-t border-gray-100 space-y-4 shadow-[0_-20px_50px_rgba(0,0,0,0.05)]">
                    <button 
                      disabled={!canFinalize}
                      onClick={handleFinalize}
                      className="w-full py-6 bg-red-600 text-white font-black rounded-3xl shadow-2xl shadow-red-200 disabled:opacity-50 transition-all text-2xl tracking-tight active:scale-95"
                    >
                      {paymentMethod === PaymentMethod.CASH && changeValue > 0 ? 'CONCLUIR E DAR TROCO' : 'CONFIRMAR PAGAMENTO'}
                    </button>
                    <button onClick={() => { setIsClosingBill(false); setPaymentMethod(null); setAmountReceived(""); }} className="w-full py-2 text-gray-400 font-bold text-xs uppercase tracking-[0.3em] hover:text-red-600 transition-colors">Abortar Pagamento</button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col bg-gray-50">
                  <div className="flex-1 overflow-y-auto p-8 space-y-4">
                    {currentTable.orderItems.length > 0 ? (
                      currentTable.orderItems.map(item => (
                        <div key={item.id} className="p-5 bg-white rounded-3xl border border-gray-100 flex justify-between items-center shadow-sm hover:shadow-xl hover:border-red-200 transition-all group">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform">
                              {item.quantity}x
                            </div>
                            <div>
                              <p className="font-black text-gray-800 text-lg leading-none mb-1">{item.name}</p>
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${item.status === OrderStatus.READY ? 'bg-green-500' : 'bg-orange-400'}`} />
                                <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{item.status}</span>
                              </div>
                            </div>
                          </div>
                          <span className="font-black text-xl text-gray-900">R$ {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-300 opacity-40">
                        <ShoppingBag size={100} strokeWidth={1} className="mb-6 animate-bounce duration-[3000ms]" />
                        <p className="font-black text-2xl uppercase tracking-widest">Nada por enquanto</p>
                      </div>
                    )}
                  </div>

                  <div className="p-8 bg-white border-t border-gray-100 space-y-6 shadow-[0_-20px_50px_rgba(0,0,0,0.05)]">
                    <div className="flex justify-between items-end px-2">
                       <span className="text-gray-400 font-black uppercase text-xs tracking-[0.3em] mb-1">Subtotal Acumulado</span>
                       <span className="text-5xl font-black text-gray-900 tracking-tighter">R$ {totalBill.toFixed(2)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setIsAddingItems(true)} className="flex items-center justify-center gap-3 py-6 bg-red-600 text-white rounded-3xl font-black shadow-2xl shadow-red-200 hover:bg-red-700 transition-all text-lg active:scale-95">
                        <Plus size={24} /> LANÇAR PEDIDO
                      </button>
                      <button 
                        disabled={currentTable.orderItems.length === 0}
                        onClick={() => setIsClosingBill(true)} 
                        className="flex items-center justify-center gap-3 py-6 bg-white border-4 border-red-600 text-red-600 rounded-3xl font-black hover:bg-red-50 transition-all disabled:opacity-20 disabled:border-gray-200 text-lg active:scale-95"
                      >
                        <DollarSign size={24} /> FECHAR CONTA
                      </button>
                      <button onClick={() => setTransferModal({ isOpen: true, targetTableId: null })} className="col-span-2 py-2 text-gray-400 font-black text-[10px] uppercase tracking-[0.4em] hover:text-red-600 transition-colors text-center">
                        Mudar Mesa • Mesclar Comandas
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transfer UI */}
      {transferModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-xl p-4">
          <div className="bg-white p-10 rounded-[50px] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300 border-t-8 border-red-600">
             <div className="text-center mb-10">
                <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[30px] flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-2xl rotate-12 group hover:rotate-0 transition-transform"><ArrowLeftRight size={32} /></div>
                <h3 className="text-3xl font-black text-gray-900 tracking-tight">Mover Mesa {currentTable?.id}</h3>
                <p className="text-gray-400 font-medium mt-2">Selecione o destino da Comanda #{currentTable?.comandaId}</p>
             </div>
             <div className="grid grid-cols-4 gap-4 mb-10 max-h-60 overflow-y-auto p-2 scroll-smooth">
                {tables.filter(t => t.id !== currentTable?.id && t.status === TableStatus.AVAILABLE).map(t => (
                  <button key={t.id} onClick={() => setTransferModal({ ...transferModal, targetTableId: t.id })} className={`aspect-square rounded-[25px] border-2 font-black transition-all text-xl flex items-center justify-center shadow-sm ${transferModal.targetTableId === t.id ? 'border-red-600 bg-red-600 text-white shadow-red-200 scale-110' : 'border-gray-100 hover:border-red-200 text-gray-500 bg-gray-50'}`}>{t.id}</button>
                ))}
             </div>
             <div className="flex flex-col gap-3">
                <button disabled={!transferModal.targetTableId} onClick={() => { onTransfer(currentTable!.id, transferModal.targetTableId!); setTransferModal({ isOpen: false, targetTableId: null }); setSelectedTable(null); }} className="w-full py-5 bg-red-600 text-white font-black rounded-3xl disabled:opacity-50 shadow-2xl shadow-red-100 hover:bg-red-700 transition-all text-lg uppercase tracking-widest">EFETUAR TRANSFERÊNCIA</button>
                <button onClick={() => setTransferModal({ isOpen: false, targetTableId: null })} className="w-full py-3 text-gray-400 font-bold text-xs uppercase tracking-widest text-center">Cancelar</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PaymentMethodCard = ({ active, onClick, label, icon }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center gap-4 p-8 rounded-[40px] border-4 transition-all active:scale-95 ${active ? 'border-red-600 bg-red-600 text-white shadow-2xl shadow-red-200 scale-105 z-10' : 'border-transparent bg-white text-gray-400 hover:border-red-100 shadow-sm'}`}>
    <div className={`${active ? 'text-white scale-125' : 'text-gray-200'} transition-transform duration-300`}>{icon}</div>
    <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">{label}</span>
  </button>
);

export default POS;
