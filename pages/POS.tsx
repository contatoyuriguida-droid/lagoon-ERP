
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

  return (
    <div className="h-full flex flex-col gap-6 relative max-w-[1400px] mx-auto">
      {/* PDV Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button 
            onClick={() => setActiveTab('TABLES')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'TABLES' ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'text-gray-400 hover:text-red-600'}`}
          >
            <LayoutGrid size={16} /> Mapa de Mesas
          </button>
          <button 
            onClick={() => setActiveTab('COMANDAS')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'COMANDAS' ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'text-gray-400 hover:text-red-600'}`}
          >
            <List size={16} /> Comandas Ativas
          </button>
        </div>
        <button 
          onClick={addNewTable}
          className="bg-white px-6 py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 font-black text-xs uppercase hover:border-red-500 hover:text-red-600 transition-all flex items-center gap-2"
        >
          <Plus size={18} /> Cadastrar Nova Mesa
        </button>
      </div>

      {/* Grid de Atendimento */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {tables.filter(t => activeTab === 'TABLES' || t.status === TableStatus.OCCUPIED).map(table => (
          <button
            key={table.id}
            onClick={() => handleOpenTable(table)}
            className={`p-6 rounded-[32px] border-2 transition-all flex flex-col items-center gap-2 relative ${
              table.status === TableStatus.OCCUPIED 
                ? 'border-red-600 bg-red-50 text-red-700 shadow-xl shadow-red-100 scale-105 z-10' 
                : 'border-white bg-white hover:border-red-200 shadow-sm'
            }`}
          >
            <span className="font-black text-2xl tracking-tighter">{activeTab === 'TABLES' ? 'Mesa' : 'CMD'} {table.id}</span>
            {table.comandaId && (
              <span className="text-[9px] bg-red-600 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">
                #{table.comandaId}
              </span>
            )}
            <span className="text-[10px] font-black opacity-60 uppercase tracking-widest">
              {table.status === TableStatus.OCCUPIED 
                ? `R$ ${table.orderItems.reduce((s, i) => s + (i.price * i.quantity), 0).toFixed(0)}` 
                : 'Livre'}
            </span>
          </button>
        ))}
      </div>

      {/* Painel Lateral de Atendimento */}
      {selectedTable && currentTable && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-xl bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-20">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-red-600 text-white rounded-3xl flex items-center justify-center font-black text-3xl shadow-2xl shadow-red-200 rotate-2">
                  {currentTable.id}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-1">
                    {activeTab === 'TABLES' ? 'Mesa' : 'Comanda'} {currentTable.id}
                  </h2>
                  <div className="flex items-center gap-2 text-red-600 font-black text-[10px] uppercase tracking-widest">
                    <ReceiptText size={12} /> <span>Vinculada #{currentTable.comandaId || 'NOVA'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => alert('Imprimindo Pré-Conta...')} className="p-4 text-gray-400 hover:text-red-600 rounded-2xl bg-gray-50 hover:bg-red-50 transition-all">
                  <PrinterIcon size={24} />
                </button>
                <button onClick={() => setSelectedTable(null)} className="p-4 hover:bg-gray-100 rounded-full transition-colors text-gray-400"><X size={24} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col relative bg-gray-50/50">
              {isAddingItems ? (
                /* Aba: Adicionar Produtos */
                <div className="flex-1 flex flex-col animate-in fade-in duration-200">
                  <div className="p-6 bg-white border-b shadow-sm">
                    <div className="relative">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                       <input type="text" placeholder="Filtrar cardápio..." className="w-full pl-12 pr-4 py-5 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-red-500 outline-none text-lg font-bold" />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4">
                    {products.map(p => (
                      <button 
                        key={p.id} 
                        onClick={() => handleAddProduct(p)}
                        className="p-6 bg-white border border-transparent rounded-[32px] hover:border-red-500 hover:shadow-2xl hover:-translate-y-1 transition-all text-left group"
                      >
                        <p className="font-black text-gray-800 group-hover:text-red-600 transition-colors line-clamp-2 mb-2 leading-tight">{p.name}</p>
                        <p className="text-red-600 font-black text-xl tracking-tighter">R$ {p.price.toFixed(2)}</p>
                      </button>
                    ))}
                  </div>
                  <div className="p-8 bg-white border-t border-gray-100">
                    <button onClick={() => setIsAddingItems(false)} className="w-full py-6 bg-red-600 text-white font-black rounded-3xl shadow-2xl shadow-red-200 text-xl active:scale-95 transition-transform">LANÇAR NO PEDIDO</button>
                  </div>
                </div>
              ) : isClosingBill ? (
                /* Aba: Pagamento Consolidado */
                <div className="flex-1 flex flex-col animate-in slide-in-from-bottom duration-500">
                  <div className="p-8 space-y-8 flex-1 overflow-y-auto">
                    <div className="bg-red-600 p-12 rounded-[48px] shadow-2xl shadow-red-200 text-white relative overflow-hidden">
                       <p className="text-red-100 text-xs font-black uppercase tracking-[0.4em] mb-3 opacity-80">Total Final</p>
                       <p className="text-7xl font-black tracking-tighter">R$ {totalBill.toFixed(2)}</p>
                       <DollarSign size={200} className="absolute -right-12 -bottom-12 opacity-10 rotate-12" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <PaymentBtn active={paymentMethod === PaymentMethod.PIX} onClick={() => setPaymentMethod(PaymentMethod.PIX)} label="PIX Instantâneo" icon={<Smartphone size={32} />} />
                      <PaymentBtn active={paymentMethod === PaymentMethod.CREDIT} onClick={() => setPaymentMethod(PaymentMethod.CREDIT)} label="Cartão Crédito" icon={<CreditCard size={32} />} />
                      <PaymentBtn active={paymentMethod === PaymentMethod.DEBIT} onClick={() => setPaymentMethod(PaymentMethod.DEBIT)} label="Cartão Débito" icon={<Wallet size={32} />} />
                      <PaymentBtn active={paymentMethod === PaymentMethod.CASH} onClick={() => setPaymentMethod(PaymentMethod.CASH)} label="Dinheiro (Troco)" icon={<Banknote size={32} />} />
                    </div>

                    {paymentMethod === PaymentMethod.CASH && (
                      <div className="bg-white p-10 rounded-[48px] shadow-xl border border-gray-100 space-y-6 animate-in zoom-in-95">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block text-center">Valor Recebido do Cliente</label>
                          <div className="relative">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-200 text-4xl">R$</span>
                            <input type="number" value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} placeholder="0,00" className="w-full pl-20 pr-6 py-8 bg-gray-50 rounded-[32px] text-5xl font-black outline-none border-4 border-transparent focus:border-red-500 transition-all text-center" />
                          </div>
                        </div>
                        {parseFloat(amountReceived) >= totalBill && (
                          <div className="p-8 bg-green-50 border-2 border-green-100 rounded-[32px] flex flex-col items-center gap-2">
                               <span className="text-[11px] text-green-600 font-black uppercase tracking-[0.3em]">Troco Disponível</span>
                               <span className="text-6xl font-black text-green-700 tracking-tighter">R$ {changeValue.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-8 bg-white border-t border-gray-100 space-y-4">
                    <button 
                      disabled={!canFinalize}
                      onClick={handleFinalize}
                      className="w-full py-7 bg-red-600 text-white font-black rounded-[32px] shadow-2xl shadow-red-200 disabled:opacity-40 transition-all text-2xl tracking-tight active:scale-95"
                    >
                      {paymentMethod === PaymentMethod.CASH && changeValue > 0 ? 'CONCLUIR COM TROCO' : 'FECHAR VENDA AGORA'}
                    </button>
                    <button onClick={() => { setIsClosingBill(false); setPaymentMethod(null); setAmountReceived(""); }} className="w-full py-2 text-gray-400 font-black text-[11px] uppercase tracking-[0.5em] hover:text-red-600 transition-colors">Voltar</button>
                  </div>
                </div>
              ) : (
                /* Aba: Itens da Comanda */
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto p-8 space-y-4">
                    {currentTable.orderItems.length > 0 ? (
                      currentTable.orderItems.map(item => (
                        <div key={item.id} className="p-6 bg-white rounded-3xl border border-gray-100 flex justify-between items-center shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                          <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center font-black text-xl">
                              {item.quantity}
                            </div>
                            <div>
                              <p className="font-black text-gray-800 text-xl leading-none mb-2">{item.name}</p>
                              <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <span className={`w-2 h-2 rounded-full ${item.status === OrderStatus.READY ? 'bg-green-500' : 'bg-orange-400'}`} />
                                {item.status}
                              </div>
                            </div>
                          </div>
                          <span className="font-black text-2xl text-gray-900 tracking-tighter">R$ {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-300 opacity-20">
                        <ShoppingBag size={120} strokeWidth={1} />
                        <p className="font-black text-3xl uppercase tracking-tighter mt-4">Comanda Vazia</p>
                      </div>
                    )}
                  </div>

                  <div className="p-10 bg-white border-t border-gray-100 space-y-8 shadow-[0_-20px_50px_rgba(0,0,0,0.05)]">
                    <div className="flex justify-between items-end">
                       <span className="text-gray-400 font-black uppercase text-xs tracking-[0.5em]">Total Acumulado</span>
                       <span className="text-6xl font-black text-gray-900 tracking-tighter">R$ {totalBill.toFixed(2)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setIsAddingItems(true)} className="flex items-center justify-center gap-3 py-7 bg-red-600 text-white rounded-[32px] font-black shadow-2xl shadow-red-200 hover:bg-red-700 transition-all text-xl active:scale-95">
                        <Plus size={24} /> NOVO ITEM
                      </button>
                      <button 
                        disabled={currentTable.orderItems.length === 0}
                        onClick={() => setIsClosingBill(true)} 
                        className="flex items-center justify-center gap-3 py-7 bg-white border-4 border-red-600 text-red-600 rounded-[32px] font-black hover:bg-red-50 transition-all disabled:opacity-20 text-xl active:scale-95"
                      >
                        <DollarSign size={24} /> RECEBER
                      </button>
                      <button onClick={() => setTransferModal({ isOpen: true, targetTableId: null })} className="col-span-2 py-3 text-gray-400 font-black text-[11px] uppercase tracking-[0.6em] hover:text-red-600 transition-colors text-center">
                        Mudar Mesa ou Juntar Comandas
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transferência */}
      {transferModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
          <div className="bg-white p-12 rounded-[60px] w-full max-w-md shadow-2xl animate-in zoom-in-95 border-t-8 border-red-600">
             <div className="text-center mb-10">
                <div className="w-24 h-24 bg-red-50 text-red-600 rounded-[40px] flex items-center justify-center mx-auto mb-6 shadow-2xl -rotate-6"><ArrowLeftRight size={40} /></div>
                <h3 className="text-4xl font-black text-gray-900 tracking-tighter">Mudar Mesa</h3>
                <p className="text-gray-400 font-bold mt-2">Transfira a Comanda #{currentTable?.comandaId}</p>
             </div>
             <div className="grid grid-cols-4 gap-4 mb-10 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
                {tables.filter(t => t.id !== currentTable?.id && t.status === TableStatus.AVAILABLE).map(t => (
                  <button key={t.id} onClick={() => setTransferModal({ ...transferModal, targetTableId: t.id })} className={`aspect-square rounded-[30px] border-2 font-black transition-all text-2xl flex items-center justify-center shadow-sm ${transferModal.targetTableId === t.id ? 'border-red-600 bg-red-600 text-white shadow-red-200 scale-110' : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-red-200'}`}>{t.id}</button>
                ))}
             </div>
             <div className="flex flex-col gap-3">
                <button disabled={!transferModal.targetTableId} onClick={() => { onTransfer(currentTable!.id, transferModal.targetTableId!); setTransferModal({ isOpen: false, targetTableId: null }); setSelectedTable(null); }} className="w-full py-6 bg-red-600 text-white font-black rounded-3xl shadow-2xl shadow-red-100 text-xl tracking-widest active:scale-95 transition-all">EFETIVAR MUDANÇA</button>
                <button onClick={() => setTransferModal({ isOpen: false, targetTableId: null })} className="w-full py-3 text-gray-400 font-black text-[11px] uppercase tracking-widest text-center">Cancelar</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PaymentBtn = ({ active, onClick, label, icon }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center gap-4 p-8 rounded-[40px] border-4 transition-all active:scale-95 ${active ? 'border-red-600 bg-red-600 text-white shadow-2xl shadow-red-200 scale-105 z-10' : 'border-transparent bg-white text-gray-400 hover:border-red-100 shadow-sm'}`}>
    <div className={`${active ? 'text-white scale-125' : 'text-gray-200'} transition-transform duration-300`}>{icon}</div>
    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-center leading-tight">{label}</span>
  </button>
);

export default POS;
