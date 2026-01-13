
import React, { useState, useEffect } from 'react';
import { Bell, Menu, X, LogOut, ChevronRight, Lock } from 'lucide-react';
import { AppSection, Table, TableStatus, OrderStatus, Product, Transaction, Customer, OrderItem, PaymentMethod, Printer, Connection, User, UserRole } from './types.ts';
import { NAVIGATION_ITEMS, MOCK_PRODUCTS, INITIAL_USERS, ROLE_PERMISSIONS } from './constants.tsx';
import Dashboard from './pages/Dashboard.tsx';
import POS from './pages/POS.tsx';
import KDS from './pages/KDS.tsx';
import Inventory from './pages/Inventory.tsx';
import CRM from './pages/CRM.tsx';
import Settings from './pages/Settings.tsx';
import ArchitectInfo from './pages/ArchitectInfo.tsx';

// --- STORAGE KEYS ---
const STORAGE_KEY = 'LAGOON_ERP_DATA';

const App: React.FC = () => {
  // --- AUTH STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // --- BUSINESS STATE ---
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [tables, setTables] = useState<Table[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);

  // --- INITIAL LOAD (DATABASE SYNC) ---
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setProducts(parsed.products || MOCK_PRODUCTS);
      setTransactions(parsed.transactions || []);
      setCustomers(parsed.customers || []);
      setUsers(parsed.users || INITIAL_USERS);
      setTables(parsed.tables || Array.from({ length: 24 }, (_, i) => ({ id: i + 1, status: TableStatus.AVAILABLE, orderItems: [], customerCount: 0, lastUpdate: Date.now() })));
      setPrinters(parsed.printers || []);
      setConnections(parsed.connections || []);
    } else {
      setTables(Array.from({ length: 24 }, (_, i) => ({ id: i + 1, status: TableStatus.AVAILABLE, orderItems: [], customerCount: 0, lastUpdate: Date.now() })));
    }
    setIsLoaded(true);
  }, []);

  // --- PERSISTENCE SYNC ---
  useEffect(() => {
    if (isLoaded) {
      const dataToSave = { products, transactions, customers, users, tables, printers, connections };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }
  }, [products, transactions, customers, users, tables, printers, connections, isLoaded]);

  // --- BUSINESS LOGIC ---
  const handleLogin = (pin: string) => {
    const user = users.find(u => u.pin === pin);
    if (user) {
      setCurrentUser(user);
      const firstSection = ROLE_PERMISSIONS[user.role][0];
      setActiveSection(firstSection);
    } else {
      alert('PIN Incorreto');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsMobileMenuOpen(false);
  };

  const finalizePayment = (tableId: number, itemIds: string[], method: PaymentMethod, amount: number, change: number) => {
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        const remaining = t.orderItems.filter(i => !itemIds.includes(i.id));
        
        // Add transaction record
        const newTx: Transaction = {
          id: `tx-${Date.now()}`,
          tableId,
          amount,
          amountPaid: amount + change,
          change,
          paymentMethod: method,
          itemsCount: itemIds.length,
          timestamp: Date.now()
        };
        setTransactions(prevTx => [...prevTx, newTx]);

        return {
          ...t,
          orderItems: remaining,
          status: remaining.length === 0 ? TableStatus.AVAILABLE : TableStatus.OCCUPIED,
          comandaId: remaining.length === 0 ? undefined : t.comandaId
        };
      }
      return t;
    }));
  };

  const addOrderItem = (tableId: number, product: Product, qty: number) => {
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        const newItem: OrderItem = {
          id: `item-${Date.now()}-${Math.random()}`,
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: qty,
          status: OrderStatus.PREPARING,
          paid: false,
          timestamp: Date.now()
        };
        return {
          ...t,
          status: TableStatus.OCCUPIED,
          orderItems: [...t.orderItems, newItem],
          lastUpdate: Date.now()
        };
      }
      return t;
    }));
  };

  // --- RENDER LOGIN SCREEN ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-600 rounded-3xl shadow-2xl shadow-red-200 text-white text-4xl font-black mb-4">L</div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Lagoon <span className="text-red-600">GastroBar</span></h1>
          <p className="text-gray-400 font-medium text-sm">Insira seu PIN para acessar o sistema</p>
          
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map(key => (
              <button 
                key={key} 
                onClick={() => {
                   if (key === 'OK') { /* handle logic via pin state if needed */ }
                   else if (key === 'C') { /* clear */ }
                   else { handleLogin(key.toString().repeat(4)); } // Mocking direct login for demo
                }}
                className={`h-16 rounded-2xl flex items-center justify-center font-bold text-xl transition-all active:scale-95 ${
                  key === 'OK' ? 'bg-red-600 text-white col-span-1' : 'bg-white border border-gray-200 text-gray-700 hover:border-red-600 hover:text-red-600'
                }`}
              >
                {key}
              </button>
            ))}
          </div>
          
          <div className="pt-8">
            <p className="text-[10px] text-gray-300 uppercase font-black tracking-widest mb-4">Ou selecione um perfil de teste</p>
            <div className="space-y-2">
              {users.map(u => (
                <button 
                  key={u.id} 
                  onClick={() => handleLogin(u.pin)}
                  className="w-full p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between group hover:border-red-600 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs uppercase">{u.name[0]}</div>
                    <div className="text-left">
                      <p className="font-bold text-sm text-gray-800">{u.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{u.role}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-red-600" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER MAIN APP ---
  const allowedSections = ROLE_PERMISSIONS[currentUser.role];
  const menuItems = NAVIGATION_ITEMS.filter(item => allowedSections.includes(item.id));

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-900">
      {/* Sidebar Desktop */}
      <aside className={`hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-4 flex items-center justify-between h-16 border-b border-gray-50">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-black shrink-0">L</div>
            {isSidebarOpen && <span className="font-black text-xl text-red-600">Lagoon</span>}
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                activeSection === item.id ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <span className={activeSection === item.id ? 'text-white' : 'text-gray-400'}>{item.icon}</span>
              {isSidebarOpen && <span className="text-sm font-bold truncate">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-50">
           <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
             <LogOut size={20} />
             {isSidebarOpen && <span className="text-xs font-bold uppercase tracking-wider">Sair</span>}
           </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-30 shrink-0">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 text-gray-400 hover:bg-gray-100 rounded-xl"><Menu size={20} /></button>
             <h2 className="text-base font-black text-gray-800 uppercase tracking-tighter">
               {NAVIGATION_ITEMS.find(i => i.id === activeSection)?.label}
             </h2>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-100">
               <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
               <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Sincronizado</span>
             </div>
             <button className="relative p-2 text-gray-400 hover:text-red-600"><Bell size={20} /></button>
             <div className="h-8 w-px bg-gray-200 mx-1" />
             <div className="flex items-center gap-3 pl-2">
                <div className="text-right hidden sm:block">
                   <p className="text-xs font-black text-gray-900 leading-none">{currentUser.name}</p>
                   <p className="text-[9px] font-bold text-red-600 uppercase tracking-widest mt-1">{currentUser.role}</p>
                </div>
                <div className="w-9 h-9 bg-red-50 text-red-600 border border-red-100 rounded-xl flex items-center justify-center font-black">
                   {currentUser.name[0]}
                </div>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8 bg-[#FDFDFD]">
          <div className="max-w-[1600px] mx-auto">
            {activeSection === AppSection.DASHBOARD && <Dashboard transactions={transactions} products={products} />}
            {activeSection === AppSection.POS && (
              <POS 
                tables={tables} 
                setTables={setTables} 
                products={products} 
                customers={customers}
                onAddItems={addOrderItem}
                onFinalize={finalizePayment}
                onTransfer={(from, to) => { /* transfer logic */ }}
              />
            )}
            {activeSection === AppSection.KDS && <KDS tables={tables} setTables={setTables} />}
            {activeSection === AppSection.INVENTORY && <Inventory products={products} setProducts={setProducts} />}
            {activeSection === AppSection.SETTINGS && (
              <Settings 
                printers={printers} setPrinters={setPrinters} 
                connections={connections} setConnections={setConnections}
                users={users} setUsers={setUsers}
              />
            )}
            {activeSection === AppSection.ARCHITECT && <ArchitectInfo />}
          </div>
        </div>
      </main>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100]">
           <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
           <div className="absolute inset-y-0 left-0 w-72 bg-white flex flex-col p-6 shadow-2xl animate-in slide-in-from-left duration-300">
              <div className="flex items-center justify-between mb-8">
                 <span className="font-black text-2xl text-red-600">Lagoon</span>
                 <button onClick={() => setIsMobileMenuOpen(false)}><X size={24} /></button>
              </div>
              <nav className="flex-1 space-y-2">
                 {menuItems.map(item => (
                   <button key={item.id} onClick={() => { setActiveSection(item.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activeSection === item.id ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'text-gray-400'}`}>
                      {item.icon} {item.label}
                   </button>
                 ))}
              </nav>
              <button onClick={handleLogout} className="mt-auto flex items-center gap-3 p-4 text-gray-400 font-bold border-t border-gray-100">
                 <LogOut /> Sair
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
