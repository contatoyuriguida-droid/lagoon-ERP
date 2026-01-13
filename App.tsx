
import React, { useState } from 'react';
import { Bell, Search, Menu, User, LogOut } from 'lucide-react';
import { AppSection, Table, TableStatus, OrderStatus, Product, Transaction, Customer, OrderItem, PaymentMethod, Printer, Connection } from './types';
import { NAVIGATION_ITEMS, MOCK_PRODUCTS } from './constants';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import KDS from './pages/KDS';
import Inventory from './pages/Inventory';
import CRM from './pages/CRM';
import Settings from './pages/Settings';
import ArchitectInfo from './pages/ArchitectInfo';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([
    { id: '1', name: 'Ricardo Silva', spent: 1240, points: 1240, lastVisit: '2 dias atrás', prefs: ['IPAs', 'Burgers'] },
    { id: '2', name: 'Amanda Oliveira', spent: 890, points: 890, lastVisit: 'Hoje', prefs: ['Vinhos', 'Saladas'] }
  ]);
  
  const [tables, setTables] = useState<Table[]>(
    Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      status: TableStatus.AVAILABLE,
      orderItems: [],
      customerCount: 0,
      lastUpdate: Date.now()
    }))
  );

  const [printers, setPrinters] = useState<Printer[]>([
    { id: '1', name: 'Impressora Cozinha', type: 'COZINHA', ip: '192.168.1.50', status: 'ONLINE', isDefault: true },
    { id: '2', name: 'Impressora Caixa', type: 'CAIXA', ip: '192.168.1.51', status: 'ONLINE' }
  ]);

  const [connections, setConnections] = useState<Connection[]>([
    { id: '1', provider: 'iFood', type: 'IFOOD', status: 'CONNECTED' },
    { id: '2', provider: 'Sefaz (NFC-e)', type: 'FISCAL', status: 'CONNECTED' }
  ]);

  const generateComandaId = () => Math.floor(1000 + Math.random() * 9000).toString();

  const addOrderItem = (tableId: number, product: Product, quantity: number) => {
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        const newItem: OrderItem = {
          id: `oi-${Date.now()}-${Math.random()}`,
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: quantity,
          status: OrderStatus.PENDING,
          paid: false,
          timestamp: Date.now()
        };
        return {
          ...t,
          comandaId: t.comandaId || generateComandaId(),
          status: TableStatus.OCCUPIED,
          customerCount: t.customerCount || 1,
          orderItems: [...t.orderItems, newItem],
          lastUpdate: Date.now()
        };
      }
      return t;
    }));
  };

  const finalizePayment = (tableId: number, paidItemsIds: string[], method: PaymentMethod, amountPaid: number, change: number, customerId?: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const itemsToPay = table.orderItems.filter(i => paidItemsIds.includes(i.id));
    const totalAmount = itemsToPay.reduce((sum, i) => sum + (i.price * i.quantity), 0);

    const newTransaction: Transaction = {
      id: `tr-${Date.now()}`,
      tableId,
      comandaId: table.comandaId,
      amount: totalAmount,
      amountPaid,
      change,
      paymentMethod: method,
      itemsCount: itemsToPay.length,
      timestamp: Date.now(),
      customerId
    };
    setTransactions(prev => [...prev, newTransaction]);

    setProducts(prev => prev.map(p => {
      const sold = itemsToPay.find(i => i.productId === p.id);
      if (sold) return { ...p, stock: p.stock - sold.quantity, salesVolume: p.salesVolume + sold.quantity };
      return p;
    }));

    if (customerId) {
      setCustomers(prev => prev.map(c => 
        c.id === customerId ? { ...c, points: c.points + Math.floor(totalAmount), spent: c.spent + totalAmount } : c
      ));
    }

    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        const remainingItems = t.orderItems.filter(i => !paidItemsIds.includes(i.id));
        return {
          ...t,
          orderItems: remainingItems,
          status: remainingItems.length === 0 ? TableStatus.AVAILABLE : TableStatus.OCCUPIED,
          comandaId: remainingItems.length === 0 ? undefined : t.comandaId,
          customerCount: remainingItems.length === 0 ? 0 : t.customerCount
        };
      }
      return t;
    }));
  };

  const transferItems = (fromTableId: number, toTableId: number) => {
    const fromTable = tables.find(t => t.id === fromTableId);
    if (!fromTable) return;

    setTables(prev => prev.map(t => {
      if (t.id === fromTableId) {
        return { ...t, orderItems: [], status: TableStatus.AVAILABLE, comandaId: undefined, customerCount: 0 };
      }
      if (t.id === toTableId) {
        return { 
          ...t, 
          comandaId: t.comandaId || fromTable.comandaId,
          orderItems: [...t.orderItems, ...fromTable.orderItems], 
          status: TableStatus.OCCUPIED,
          customerCount: t.customerCount || fromTable.customerCount
        };
      }
      return t;
    }));
  };

  const renderContent = () => {
    switch (activeSection) {
      case AppSection.DASHBOARD: return <Dashboard transactions={transactions} products={products} />;
      case AppSection.POS: return (
        <POS 
          tables={tables} 
          setTables={setTables} 
          products={products} 
          onAddItems={addOrderItem} 
          onFinalize={finalizePayment}
          onTransfer={transferItems}
          customers={customers}
        />
      );
      case AppSection.KDS: return <KDS tables={tables} setTables={setTables} />;
      case AppSection.INVENTORY: return <Inventory products={products} setProducts={setProducts} />;
      case AppSection.CRM: return <CRM customers={customers} />;
      case AppSection.SETTINGS: return (
        <Settings 
          printers={printers} 
          setPrinters={setPrinters} 
          connections={connections} 
          setConnections={setConnections}
        />
      );
      case AppSection.ARCHITECT: return <ArchitectInfo />;
      default: return <Dashboard transactions={transactions} products={products} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-900">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col z-30`}>
        <div className="p-4 flex items-center justify-between border-b border-gray-100">
          {isSidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold">L</div>
              <span className="font-bold text-xl text-red-600">Lagoon</span>
            </div>
          ) : (
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold mx-auto">L</div>
          )}
        </div>
        <nav className="flex-1 mt-6 px-3 space-y-1">
          {NAVIGATION_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                activeSection === item.id ? 'bg-red-50 text-red-600 font-medium' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {item.icon}
              {isSidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-lg">
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold">{NAVIGATION_ITEMS.find(n => n.id === activeSection)?.label}</h1>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
            <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse" /> Servidor Online
            </div>
            <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
               <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600"><User size={18} /></div>
               <span>Gerente Lagoon</span>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;
