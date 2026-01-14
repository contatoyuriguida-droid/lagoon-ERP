import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, Menu, X, LogOut, ChevronRight, Lock, Cloud, RefreshCw, Volume2, Check } from 'lucide-react';
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

// ========================================================
// CONFIGURAÇÃO OFICIAL DO LAGOON ERP
// ========================================================
const firebaseConfig = {
  apiKey: "AIzaSyBci24rNuL9-cFlLomJa6UzMPj8SM-YJ-g",
  authDomain: "lagoon-erp.firebaseapp.com",
  projectId: "lagoon-erp",
  storageBucket: "lagoon-erp.firebasestorage.app",
  messagingSenderId: "1026563692982",
  appId: "1:1026563692982:web:f28ef0b5a54e98699a0917",
  measurementId: "G-X7YJ36KZQN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const DOC_PATH = "lagoon/system_state";

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pinBuffer, setPinBuffer] = useState<string>("");
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [tables, setTables] = useState<Table[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);

  // Referência para contar pedidos e evitar beep no load inicial
  const lastOrderCount = useRef<number>(-1);

  // --- MOTOR DE ÁUDIO (BEEP) ---
  const playKdsBeep = useCallback(() => {
    if (!isSoundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // Nota Lá
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);

      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn("Áudio não permitido");
    }
  }, [isSoundEnabled]);

  // --- MONITOR DE NOVOS PEDIDOS ---
  useEffect(() => {
    if (!isLoaded) return;
    
    const currentTotalOrders = tables.reduce((acc, table) => 
      acc + table.orderItems.filter(i => i.status === OrderStatus.PREPARING || i.status === OrderStatus.PENDING).length
    , 0);

    // Se o contador aumentou e não é o carregamento inicial, toca o beep
    if (lastOrderCount.current !== -1 && currentTotalOrders > lastOrderCount.current) {
      playKdsBeep();
    }
    
    lastOrderCount.current = currentTotalOrders;
  }, [tables, isLoaded, playKdsBeep]);

  // --- ESCUTADOR FIRESTORE ---
  useEffect(() => {
    const unsub = onSnapshot(doc(db, DOC_PATH), (docSnap: any) => {
      if (docSnap.exists()) {
        const cloud = docSnap.data();
        if (cloud.products) setProducts(cloud.products);
        if (cloud.transactions) setTransactions(cloud.transactions);
        if (cloud.customers) setCustomers(cloud.customers);
        if (cloud.users) setUsers(cloud.users);
        if (cloud.tables) setTables(cloud.tables);
        if (cloud.printers) setPrinters(cloud.printers);
        if (cloud.connections) setConnections(cloud.connections);
      } else {
        const initTables = Array.from({ length: 24 }, (_, i) => ({ 
          id: i + 1, status: TableStatus.AVAILABLE, orderItems: [], customerCount: 0, lastUpdate: Date.now() 
        }));
        setTables(initTables);
        persistToCloud({ 
          products: MOCK_PRODUCTS, users: INITIAL_USERS, tables: initTables, 
          transactions: [], customers: [], printers: [], connections: [] 
        });
      }
      setIsLoaded(true);
    }, (error: any) => {
      console.error("Erro Cloud Sync:", error);
      setIsLoaded(true);
    });

    return () => unsub();
  }, []);

  const persistToCloud = useCallback(async (data: any) => {
    setIsSyncing(true);
    try {
      await setDoc(doc(db, DOC_PATH), data, { merge: true });
    } catch (e) {
      console.error("Falha ao salvar:", e);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      const timer = setTimeout(() => {
        persistToCloud({ products, transactions, customers, users, tables, printers, connections });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [products, transactions, customers, users, tables, printers, connections, isLoaded, persistToCloud]);

  // --- AUTH ---
  const handlePinInput = (digit: string) => {
    if (digit === 'C') {
      setPinBuffer("");
    } else if (digit === 'OK') {
      const user = users.find(u => u.pin === pinBuffer);
      if (user) {
        setCurrentUser(user);
        setActiveSection(ROLE_PERMISSIONS[user.role][0]);
        setPinBuffer("");
      } else {
        alert("PIN Incorreto!");
        setPinBuffer("");
      }
    } else {
      if (pinBuffer.length < 6) setPinBuffer(prev => prev + digit);
    }
  };

  const addOrderItem = useCallback((tableId: number, product: Product, qty: number) => {
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        const newItem: OrderItem = {
          id: `it-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
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
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const itemsToPay = table.orderItems.filter(i => itemIds.includes(i.id));
    const total = itemsToPay.reduce((s, i) => s + (i.price * i.quantity), 0);

    setProducts(prev => prev.map(p => {
      const sold = itemsToPay.find(i => i.productId === p.id);
      return sold ? { ...p, stock: Math.max(0, p.stock - sold.quantity), salesVolume: (p.salesVolume || 0) + sold.quantity } : p;
    }));

    setTransactions(prev => [...prev, {
      id: `tx-${Date.now()}`, tableId, amount: total, amountPaid: amount, change,
      paymentMethod: method, itemsCount: itemIds.length, timestamp: Date.now()
    }]);

    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        const rem = t.orderItems.filter(i => !itemIds.includes(i.id));
        return {
          ...t,
          orderItems: rem,
          status: rem.length === 0 ? TableStatus.AVAILABLE : TableStatus.OCCUPIED,
          comandaId: rem.length === 0 ? undefined : t.comandaId,
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
        <div className="loading-text">Conectando Lagoon Cloud...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm flex flex-col items-center">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-red-200 mb-6">L</div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Lagoon <span className="text-red-600">GastroBar</span></h1>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-10">ERP Conectado</p>

          <div className="w-full mb-8">
            <div className="flex justify-center gap-3 mb-10">
              {[0, 1, 2, 3].map((idx) => (
                <div key={idx} className={`w-3 h-3 rounded-full transition-all duration-300 ${pinBuffer.length > idx ? 'bg-red-600 scale-125 shadow-lg shadow-red-200' : 'bg-gray-100'}`} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map(key => (
                <button key={key} onClick={() => handlePinInput(key.toString())} className={`h-14 rounded-xl flex items-center justify-center font-black text-lg active:scale-90 transition-all ${key === 'OK' ? 'bg-red-600 text-white shadow-lg' : key === 'C' ? 'bg-gray-50 text-gray-400' : 'bg-white border border-gray-100 text-gray-800 shadow-sm hover:border-red-600'}`}>
                  {key}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 opacity-50">
             {users.map(u => <span key={u.id} className="text-[8px] font-black uppercase text-gray-400">{u.name} ({u.pin})</span>)}
          </div>
        </div>
      </div>
    );
  }

  const sidebarItems = NAVIGATION_ITEMS.filter(i => ROLE_PERMISSIONS[currentUser.role].includes(i.id));

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <aside className={`hidden lg:flex flex-col bg-white border-r border-gray-100 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="h-16 flex items-center px-6 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-black shrink-0">L</div>
            {isSidebarOpen && <span className="font-black text-xl text-red-600 tracking-tighter">Lagoon</span>}
          </div>
        </div>
        <nav className="flex-1 py-6 px-3 space-y-1">
          {sidebarItems.map(item => (
            <button key={item.id} onClick={() => setActiveSection(item.id)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${activeSection === item.id ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'text-gray-400 hover:bg-gray-50 hover:text-red-600'}`}>
              <span className={activeSection === item.id ? 'text-white' : 'text-current'}>{item.icon}</span>
              {isSidebarOpen && <span className="text-xs font-black uppercase tracking-wider">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-50">
          <button onClick={() => setCurrentUser(null)} className="w-full flex items-center gap-3 p-3 text-gray-400 hover:text-red-600 rounded-xl transition-all">
            <LogOut size={20} />
            {isSidebarOpen && <span className="text-[10px] font-black uppercase tracking-widest">Sair</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 text-gray-400"><Menu size={20} /></button>
            <h2 className="text-[11px] font-black text-gray-800 uppercase tracking-[0.2em]">{NAVIGATION_ITEMS.find(i => i.id === activeSection)?.label}</h2>
          </div>
          
          <div className="flex items-center gap-4">
             <button onClick={() => setIsSoundEnabled(!isSoundEnabled)} className={`p-2 rounded-lg transition-colors ${isSoundEnabled ? 'text-red-600 bg-red-50' : 'text-gray-300 bg-gray-50'}`}>
                <Volume2 size={18} />
             </button>

             <div className="hidden sm:flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isSyncing ? 'bg-blue-500 animate-ping' : 'bg-green-500'}`} />
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter flex items-center gap-1">
                   {isSyncing ? <RefreshCw size={10} className="animate-spin" /> : <Check size={10} className="text-green-600" />}
                   {isSyncing ? 'Sincronizando...' : 'Cloud Ativa'}
                </span>
             </div>

             <div className="flex items-center gap-3 pl-2 border-l border-gray-100">
                <div className="hidden sm:flex flex-col text-right">
                   <span className="text-[10px] font-black text-gray-900 leading-none">{currentUser.name}</span>
                   <span className="text-[8px] font-black text-red-600 uppercase mt-1 tracking-widest">{currentUser.role}</span>
                </div>
                <div className="w-8 h-8 bg-red-600 text-white rounded-lg flex items-center justify-center font-black text-xs shadow-md">
                   {currentUser.name[0]}
                </div>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeSection === AppSection.DASHBOARD && <Dashboard transactions={transactions} products={products} />}
            {activeSection === AppSection.POS && <POS tables={tables} setTables={setTables} products={products} customers={customers} onAddItems={addOrderItem} onFinalize={finalizePayment} onTransfer={(f,t) => {}} />}
            {activeSection === AppSection.KDS && <KDS tables={tables} setTables={setTables} />}
            {activeSection === AppSection.INVENTORY && <Inventory products={products} setProducts={setProducts} />}
            {activeSection === AppSection.CRM && <CRM customers={customers} />}
            {activeSection === AppSection.SETTINGS && <Settings printers={printers} setPrinters={setPrinters} connections={connections} setConnections={setConnections} users={users} setUsers={setUsers} />}
            {activeSection === AppSection.ARCHITECT && <ArchitectInfo />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;