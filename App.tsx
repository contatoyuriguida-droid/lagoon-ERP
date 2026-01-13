
import React, { useState, useEffect } from 'react';
import { Bell, Search, Menu, User, X, LayoutDashboard, UtensilsCrossed, MonitorPlay, Package, Users, FileCode2, Settings as SettingsIcon } from 'lucide-react';
import { AppSection, Table, TableStatus, OrderStatus, Product, Transaction, Customer, OrderItem, PaymentMethod, Printer, Connection } from './types.ts';
import { NAVIGATION_ITEMS, MOCK_PRODUCTS } from './constants.tsx';
import Dashboard from './pages/Dashboard.tsx';
import POS from './pages/POS.tsx';
import KDS from './pages/KDS.tsx';
import Inventory from './pages/Inventory.tsx';
import CRM from './pages/CRM.tsx';
import Settings from './pages/Settings.tsx';
import ArchitectInfo from './pages/ArchitectInfo.tsx';

// Fixed: Moved NavItem outside of App component to avoid re-creation on every render and fix TS "key" prop error
interface NavItemProps {
  item: {
    id: AppSection;
    label: string;
    icon: React.ReactNode;
  };
  activeSection: AppSection;
  setActiveSection: (section: AppSection) => void;
  isSidebarOpen: boolean;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
}

const NavItem: React.FC<NavItemProps> = ({ 
  item, 
  activeSection, 
  setActiveSection, 
  isSidebarOpen, 
  isMobileMenuOpen, 
  setIsMobileMenuOpen 
}) => (
  <button
    onClick={() => {
      setActiveSection(item.id);
      setIsMobileMenuOpen(false);
    }}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
      activeSection === item.id ? 'bg-red-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'
    }`}
  >
    <span className={activeSection === item.id ? 'text-white' : 'text-gray-400'}>{item.icon}</span>
    {(isSidebarOpen || isMobileMenuOpen) && <span className="text-sm font-semibold">{item.label}</span>}
  </button>
);

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([
    { id: '1', name: 'Ricardo Silva', spent: 1240, points: 1240, lastVisit: '2 dias atrás', prefs: ['IPAs', 'Burgers'] },
    { id: '2', name: 'Amanda Oliveira', spent: 890, points: 890, lastVisit: 'Hoje', prefs: ['Vinhos', 'Saladas'] }
  ]);
  
  const [tables, setTables] = useState<Table[]>(
    Array.from({ length: 24 }, (_, i) => ({
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
      {/* Sidebar Desktop */}
      <aside className={`hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-4 flex items-center justify-between border-b border-gray-100 h-16">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="min-w-[32px] w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0">L</div>
            {isSidebarOpen && <span className="font-bold text-lg text-red-600 truncate">Lagoon</span>}
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAVIGATION_ITEMS.map((item) => (
            <NavItem 
              key={item.id} 
              item={item} 
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              isSidebarOpen={isSidebarOpen}
              isMobileMenuOpen={isMobileMenuOpen}
              setIsMobileMenuOpen={setIsMobileMenuOpen}
            />
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-full flex items-center justify-center p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Menu size={20} />
          </button>
        </div>
      </aside>

      {/* Overlay Mobile */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar Mobile */}
      <aside className={`lg:hidden fixed inset-y-0 left-0 w-64 bg-white z-50 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold">L</div>
            <span className="font-bold text-lg text-red-600">Lagoon</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-400"><X size={20} /></button>
        </div>
        <nav className="p-4 space-y-2">
          {NAVIGATION_ITEMS.map((item) => (
            <NavItem 
              key={item.id} 
              item={item} 
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              isSidebarOpen={isSidebarOpen}
              isMobileMenuOpen={isMobileMenuOpen}
              setIsMobileMenuOpen={setIsMobileMenuOpen}
            />
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden text-gray-500 p-2 hover:bg-gray-100 rounded-lg">
              <Menu size={20} />
            </button>
            <h1 className="text-base lg:text-lg font-bold truncate max-w-[150px] sm:max-w-none">
              {NAVIGATION_ITEMS.find(n => n.id === activeSection)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider border border-green-100">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Cloud
            </div>
            <button className="relative p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
               <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600 font-bold text-sm">G</div>
               <span className="hidden md:block text-xs font-bold text-gray-700">Gerente</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="max-w-[1600px] mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
