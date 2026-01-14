
import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Menu, X, LogOut, ChevronRight, Lock } from 'lucide-react';
// @ts-ignore
import { initializeApp } from "firebase/app";
// @ts-ignore
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";

import { AppSection, Table, TableStatus, OrderStatus, Product, Transaction, Customer, OrderItem, PaymentMethod, Printer, Connection, User, UserRole } from './types.ts';
import { NAVIGATION_ITEMS, MOCK_PRODUCTS, INITIAL_USERS, ROLE_PERMISSIONS } from './constants.tsx';
import Dashboard from './pages/Dashboard.tsx';
import POS from './pages/POS.tsx';
import KDS from './pages/KDS.tsx';
import Inventory from './pages/Inventory.tsx';
import CRM from './pages/CRM.tsx';
import Settings from './pages/Settings.tsx';
import ArchitectInfo from './pages/ArchitectInfo.tsx';

// CONFIGURAÇÃO FIREBASE (SUBSTITUA PELAS SUAS CHAVES REAIS)
const firebaseConfig = {
  apiKey: "demo-key-lagoon",
  authDomain: "lagoon-gastrobar.firebaseapp.com",
  projectId: "lagoon-gastrobar",
  storageBucket: "lagoon-gastrobar.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Singleton para Firebase
let db: any = null;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (e) {
  console.warn("Erro ao inicializar Firebase. Operando em modo local.");
}

const DOC_PATH = "system/data";

const App: React.FC = () => {
  // --- AUTH STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pinBuffer, setPinBuffer] = useState<string>("");
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

  // --- FIREBASE SYNC & INITIALIZATION ---
  useEffect(() => {
    let unsub = () => {};

    // Timer de segurança para evitar loading infinito
    const safetyTimeout = setTimeout(() => {
      if (!isLoaded) {
        console.warn("Firebase demorou demais. Carregando dados locais.");
        // Inicializa tabelas se não carregou
        if (tables.length === 0) {
          const initialTables = Array.from({ length: 24 }, (_, i) => ({ 
            id: i + 1, status: TableStatus.AVAILABLE, orderItems: [], customerCount: 0, lastUpdate: Date.now() 
          }));
          setTables(initialTables);
        }
        setIsLoaded(true);
      }
    }, 3000);

    if (db) {
      unsub = onSnapshot(doc(db, DOC_PATH), (docSnap: any) => {
        clearTimeout(safetyTimeout);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProducts(data.products || MOCK_PRODUCTS);
          setTransactions(data.transactions || []);
          setCustomers(data.customers || []);
          setUsers(data.users || INITIAL_USERS);
          setTables(data.tables || Array.from({ length: 24 }, (_, i) => ({ id: i + 1, status: TableStatus.AVAILABLE, orderItems: [], customerCount: 0, lastUpdate: Date.now() })));
          setPrinters(data.printers || []);
          setConnections(data.connections || []);
        } else {
          const initialTables = Array.from({ length: 24 }, (_, i) => ({ id: i + 1, status: TableStatus.AVAILABLE, orderItems: [], customerCount: 0, lastUpdate: Date.now() }));
          setTables(initialTables);
        }
        setIsLoaded(true);
      }, (error: any) => {
        console.error("Erro no Firestore Listener:", error);
        setIsLoaded(true);
      });
    } else {
      setIsLoaded(true);
    }

    return () => {
      unsub();
      clearTimeout(safetyTimeout);
    };
  }, [isLoaded, tables.length]);

  // --- PERSISTENCE HELPER ---
  const syncToCloud = useCallback(async (updates: any) => {
    if (!db) return;
    try {
      await setDoc(doc(db, DOC_PATH), updates, { merge: true });
    } catch (e) {
      console.error("Erro ao sincronizar dados:", e);
    }
  }, []);

  // Sync Debounced
  useEffect(() => {
    if (isLoaded && db) {
      const timeout = setTimeout(() => {
        syncToCloud({ products, transactions, customers, users, tables, printers, connections });
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [products, transactions, customers, users, tables, printers, connections, isLoaded, syncToCloud]);

  // --- ACTIONS ---
  const handlePinInput = (digit: string) => {
    if (digit === 'C') {
      setPinBuffer("");
    } else if (digit === 'OK') {
      const user = users.find(u => u.pin === pinBuffer);
      if (user) {
        setCurrentUser(user);
        const allowed = ROLE_PERMISSIONS[user.role];
        setActiveSection(allowed[0]);
        setPinBuffer("");
      } else {
        alert("PIN inválido!");
        setPinBuffer("");
      }
    } else {
      if (pinBuffer.length < 6) setPinBuffer(prev => prev + digit);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setPinBuffer("");
    setIsMobileMenuOpen(false);
  };

  const addOrderItem = useCallback((tableId: number, product: Product, qty: number) => {
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        const newItem: OrderItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
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
          comandaId: t.comandaId || Math.floor(1000 + Math.random() * 9000).toString(),
          orderItems: [...t.orderItems, newItem],
          lastUpdate: Date.now()
        };
      }
      return t;
    }));
  }, []);

  const finalizePayment = useCallback((tableId: number, itemIds: string[], method: PaymentMethod, amount: number, change: number) => {
    const targetTable = tables.find(t => t.id === tableId);
    if (!targetTable) return;

    const itemsToPay = targetTable.orderItems.filter(i => itemIds.includes(i.id));
    const totalPaid = itemsToPay.reduce((sum, i) => sum + (i.price * i.quantity), 0);

    setProducts(prev => prev.map(p => {
      const soldItem = itemsToPay.find(i => i.productId === p.id);
      if (soldItem) {
        return { ...p, stock: Math.max(0, p.stock - soldItem.quantity), salesVolume: (p.salesVolume || 0) + soldItem.quantity };
      }
      return p;
    }));

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      tableId,
      amount: totalPaid,
      amountPaid: amount,
      change,
      paymentMethod: method,
      itemsCount: itemIds.length,
      timestamp: Date.now()
    };
    setTransactions(prev => [...prev, newTx]);

    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        const remaining = t.orderItems.filter(i => !itemIds.includes(i.id));
        return {
          ...t,
          orderItems: remaining,
          status: remaining.length === 0 ? TableStatus.AVAILABLE : TableStatus.OCCUPIED,
          comandaId: remaining.length === 0 ? undefined : t.comandaId,
          lastUpdate: Date.now()
        };
      }
      return t;
    }));
  }, [tables]);

  const transferItems = useCallback((fromId: number, toId: number) => {
    const fromTable = tables.find(t => t.id === fromId);
    if (!fromTable || fromTable.orderItems.length === 0) return;

    setTables(prev => prev.map(t => {
      if (t.id === fromId) return { ...t, orderItems: [], status: TableStatus.AVAILABLE, comandaId: undefined, lastUpdate: Date.now() };
      if (t.id === toId) {
        return {
          ...t,
          orderItems: [...t.orderItems, ...fromTable.orderItems],
          status: TableStatus.OCCUPIED,
          comandaId: t.comandaId || fromTable.comandaId,
          lastUpdate: Date.now()
        };
      }
      return t;
    }));
  }, [tables]);

  if (!isLoaded) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <div className="loading-text">Sincronizando Lagoon...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm flex flex-col items-center">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-red-200 mb-6">L</div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Lagoon <span className="text-red-600">GastroBar</span></h1>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-10">Acesso Restrito</p>

          <div className="w-full mb-8">
            <div className="flex justify-center gap-3 mb-8">
              {[0, 1, 2, 3].map((idx) => (
                <div key={idx} className={`w-3 h-3 rounded-full transition-all ${pinBuffer.length > idx ? 'bg-red-600 scale-125' : 'bg-gray-200'}`} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map(key => (
                <button key={key} onClick={() => handlePinInput(key.toString())} className={`h-16 rounded-2xl flex items-center justify-center font-bold text-lg active:scale-90 transition-all ${key === 'OK' ? 'bg-red-600 text-white' : key === 'C' ? 'bg-gray-100 text-gray-400' : 'bg-white border border-gray-100 text-gray-800 shadow-sm'}`}>
                  {key}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {users.map(u => (
               <button key={u.id} onClick={() => { setPinBuffer(u.pin); handlePinInput('OK'); }} className="text-[9px] font-black text-gray-300 uppercase hover:text-red-600 transition-colors">{u.name}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const allowedSections = ROLE_PERMISSIONS[currentUser.role];
  const sidebarItems = NAVIGATION_ITEMS.filter(i => allowedSections.includes(i.id));

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <aside className={`hidden lg:flex flex-col bg-white border-r border-gray-100 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="h-16 flex items-center px-6 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-black shrink-0">L</div>
            {isSidebarOpen && <span className="font-black text-xl text-red-600">Lagoon</span>}
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {sidebarItems.map(item => (
            <button key={item.id} onClick={() => setActiveSection(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${activeSection === item.id ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}>
              <span className={activeSection === item.id ? 'text-white' : 'text-gray-400'}>{item.icon}</span>
              {isSidebarOpen && <span className="text-sm font-bold">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-50">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 text-gray-400 hover:text-red-600 rounded-xl transition-all">
            <LogOut size={20} />
            {isSidebarOpen && <span className="text-xs font-bold uppercase">Sair</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 text-gray-400"><Menu size={20} /></button>
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-tighter">{NAVIGATION_ITEMS.find(i => i.id === activeSection)?.label}</h2>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden sm:flex flex-col text-right">
                <span className="text-[10px] font-black text-gray-900 leading-none">{currentUser.name}</span>
                <span className="text-[8px] font-black text-red-600 uppercase mt-1">Cloud {db ? 'Ativo' : 'Local'}</span>
             </div>
             <div className="w-8 h-8 bg-red-50 text-red-600 rounded-lg flex items-center justify-center font-black text-xs">{currentUser.name[0]}</div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeSection === AppSection.DASHBOARD && <Dashboard transactions={transactions} products={products} />}
            {activeSection === AppSection.POS && <POS tables={tables} setTables={setTables} products={products} customers={customers} onAddItems={addOrderItem} onFinalize={finalizePayment} onTransfer={transferItems} />}
            {activeSection === AppSection.KDS && <KDS tables={tables} setTables={setTables} />}
            {activeSection === AppSection.INVENTORY && <Inventory products={products} setProducts={setProducts} />}
            {activeSection === AppSection.CRM && <CRM customers={customers} />}
            {activeSection === AppSection.SETTINGS && <Settings printers={printers} setPrinters={setPrinters} connections={connections} setConnections={setConnections} users={users} setUsers={setUsers} />}
            {activeSection === AppSection.ARCHITECT && <ArchitectInfo />}
          </div>
        </main>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-white p-6 shadow-2xl animate-in slide-in-from-left">
            <div className="flex items-center justify-between mb-8">
              <span className="font-black text-xl text-red-600">Lagoon</span>
              <button onClick={() => setIsMobileMenuOpen(false)}><X size={24} /></button>
            </div>
            <nav className="space-y-2">
              {sidebarItems.map(item => (
                <button key={item.id} onClick={() => { setActiveSection(item.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold ${activeSection === item.id ? 'bg-red-600 text-white' : 'text-gray-400'}`}>
                  {item.icon} {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
