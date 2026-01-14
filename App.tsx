import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, Menu, X, LogOut, ChevronRight, Lock, Cloud, RefreshCw, Volume2, Check, Printer as PrinterIcon, User as UserIcon } from 'lucide-react';
// @ts-ignore
import { initializeApp } from "firebase/app";
// @ts-ignore
import { getFirestore, doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";

import { AppSection, Table, TableStatus, OrderStatus, Product, Transaction, Customer, OrderItem, PaymentMethod, Printer, Connection, User, UserRole } from './types.ts';
import { NAVIGATION_ITEMS, MOCK_PRODUCTS, INITIAL_USERS, ROLE_PERMISSIONS } from './constants.tsx';
import Dashboard from './pages/Dashboard.tsx';
import POS from './pages/POS.tsx';
import KDS from './pages/KDS.tsx';
import Inventory from './pages/Inventory.tsx';
import CRM from './pages/CRM.tsx';
import Settings from './pages/Settings.tsx';
import ArchitectInfo from './pages/ArchitectInfo.tsx';

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
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [lastPrintJob, setLastPrintJob] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [tables, setTables] = useState<Table[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);

  const isWritingRef = useRef(false);
  const lastSyncTimeRef = useRef(0);

  const sendToPrinter = useCallback((type: 'COZINHA' | 'BAR' | 'CAIXA', content: string) => {
    const targetPrinter = printers.find(p => p.type === type && p.status === 'ONLINE') || printers.find(p => p.type === 'CAIXA');
    if (!targetPrinter) return;
    setLastPrintJob(`Imprimindo no ${targetPrinter.type}...`);
    setTimeout(() => setLastPrintJob(null), 2000);
    console.log(`[PRINTER ${targetPrinter.ip}]`, content);
  }, [printers]);

  const persistToCloud = useCallback(async (overrides?: any, priority = false) => {
    if (isWritingRef.current && !priority) return;
    isWritingRef.current = true;
    setIsSyncing(true);
    
    const currentState = {
      products, transactions, customers, users, tables, printers, connections,
      lastGlobalUpdate: Date.now(),
      ...overrides
    };

    try {
      await setDoc(doc(db, DOC_PATH), currentState, { merge: true });
      lastSyncTimeRef.current = Date.now();
    } catch (e) {
      console.error("Erro de sincronização:", e);
    } finally {
      isWritingRef.current = false;
      setTimeout(() => setIsSyncing(false), 300);
    }
  }, [products, transactions, customers, users, tables, printers, connections]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, DOC_PATH), (docSnap: any) => {
      if (isWritingRef.current) return;
      if (docSnap.exists()) {
        const cloud = docSnap.data();
        if (cloud.lastGlobalUpdate && cloud.lastGlobalUpdate > lastSyncTimeRef.current) {
          if (cloud.products) setProducts(cloud.products);
          if (cloud.transactions) setTransactions(cloud.transactions);
          if (cloud.customers) setCustomers(cloud.customers);
          if (cloud.users) setUsers(cloud.users);
          if (cloud.tables) setTables(cloud.tables);
          if (cloud.printers) setPrinters(cloud.printers);
          if (cloud.connections) setConnections(cloud.connections);
        }
      } else {
        const initTables = Array.from({ length: 24 }, (_, i) => ({ 
          id: i + 1, status: TableStatus.AVAILABLE, orderItems: [], customerCount: 0, lastUpdate: Date.now() 
        }));
        setTables(initTables);
        persistToCloud({ tables: initTables }, true);
      }
      setIsLoaded(true);
    });
    return () => unsub();
  }, [persistToCloud]);

  const addOrderItem = useCallback((tableId: number, product: Product, qty: number, comandaId?: string) => {
    const newTables = tables.map(t => {
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
        const printerType = product.category.toLowerCase().includes('bebida') || product.category.toLowerCase().includes('drink') ? 'BAR' : 'COZINHA';
        sendToPrinter(printerType, `PEDIDO MESA ${tableId}\nITEM: ${qty}x ${product.name}`);
        return {
          ...t,
          status: TableStatus.OCCUPIED,
          comandaId: comandaId || t.comandaId || Math.floor(1000 + Math.random() * 9000).toString(),
          orderItems: [...t.orderItems, newItem],
          lastUpdate: Date.now()
        };
      }
      return t;
    });
    setTables(newTables);
    persistToCloud({ tables: newTables }, true);
  }, [tables, sendToPrinter, persistToCloud]);

  const finalizePayment = useCallback((tableId: number, itemIds: string[], method: PaymentMethod, amount: number, change: number) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    const itemsToPay = table.orderItems.filter(i => itemIds.includes(i.id));
    const total = itemsToPay.reduce((s, i) => s + (i.price * i.quantity), 0);
    const newTx: Transaction = {
      id: `tx-${Date.now()}`, tableId, comandaId: table.comandaId, amount: total, amountPaid: amount, change,
      paymentMethod: method, itemsCount: itemIds.length, timestamp: Date.now()
    };
    const newTransactions = [...transactions, newTx];
    const newTables = tables.map(t => {
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
    });
    setTransactions(newTransactions);
    setTables(newTables);
    persistToCloud({ tables: newTables, transactions: newTransactions }, true);
    sendToPrinter('CAIXA', `EXTRATO MESA ${tableId}\nFECHADO: R$ ${total.toFixed(2)}`);
  }, [tables, transactions, persistToCloud, sendToPrinter]);

  const handleAddNewTable = useCallback(() => {
    const nextId = tables.length > 0 ? Math.max(...tables.map(t => t.id)) + 1 : 1;
    const newTable: Table = {
      id: nextId,
      status: TableStatus.AVAILABLE,
      orderItems: [],
      customerCount: 0,
      lastUpdate: Date.now()
    };
    const newTables = [...tables, newTable];
    setTables(newTables);
    persistToCloud({ tables: newTables }, true);
  }, [tables, persistToCloud]);

  if (!isLoaded) return <div className="loading-screen"><div className="spinner"></div><div className="loading-text">Sincronizando Real-Time...</div></div>;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-red-200 mb-6">L</div>
        <h1 className="text-2xl font-black text-gray-900 mb-1">Lagoon <span className="text-red-600">GastroBar</span></h1>
        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-10">Acesso Restrito</p>
        
        {/* PIN DISPLAY WITH DOTS */}
        <div className="flex gap-4 mb-10">
          {[0, 1, 2, 3].map((idx) => (
            <div 
              key={idx} 
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                pinBuffer.length > idx ? 'bg-red-600 border-red-600 scale-125 shadow-lg shadow-red-100' : 'bg-transparent border-gray-200'
              }`} 
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map(key => (
            <button 
              key={key} 
              onClick={() => {
                if (key === 'C') setPinBuffer("");
                else if (key === 'OK') {
                  const u = users.find(u => u.pin === pinBuffer);
                  if (u) {
                    setCurrentUser(u);
                    setPinBuffer("");
                  } else {
                    setPinBuffer("");
                  }
                } else {
                  if (pinBuffer.length < 4) setPinBuffer(p => p + key);
                }
              }} 
              className="h-16 rounded-2xl flex items-center justify-center font-black text-lg bg-white border border-gray-100 text-gray-800 shadow-sm hover:border-red-600 active:bg-red-600 active:text-white transition-all transform active:scale-95"
            >
              {key}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <aside className={`hidden lg:flex flex-col bg-white border-r border-gray-100 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="h-16 flex items-center px-6 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-black">L</div>
            {isSidebarOpen && <span className="font-black text-xl text-red-600 tracking-tighter">Lagoon</span>}
          </div>
        </div>
        <nav className="flex-1 py-6 px-3 space-y-1">
          {NAVIGATION_ITEMS.filter(i => ROLE_PERMISSIONS[currentUser.role].includes(i.id)).map(item => (
            <button key={item.id} onClick={() => setActiveSection(item.id)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${activeSection === item.id ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-red-600'}`}>
              {item.icon}
              {isSidebarOpen && <span className="text-xs font-black uppercase tracking-wider">{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-30 shadow-sm">
          <h2 className="text-[11px] font-black text-gray-800 uppercase tracking-[0.2em]">{activeSection}</h2>
          <div className="flex items-center gap-6">
             {lastPrintJob && (
               <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full animate-in fade-in zoom-in">
                  <PrinterIcon size={12} />
                  <span className="text-[9px] font-black uppercase">{lastPrintJob}</span>
               </div>
             )}
             <div className="hidden md:flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-blue-500 animate-ping' : 'bg-green-500'}`} />
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">Conectado</span>
             </div>
             
             {/* USER INFO BLOCK - REFINED FOR VISIBILITY */}
             <div className="flex items-center gap-4 pl-6 border-l border-gray-100">
                <div className="text-right hidden sm:block">
                   <p className="text-[13px] font-black text-gray-900 leading-none mb-1">{currentUser.name}</p>
                   <span className={`text-[9px] font-black uppercase tracking-[0.1em] px-2 py-1 rounded-full inline-block shadow-sm ${
                      currentUser.role === UserRole.ADMIN ? 'bg-red-600 text-white' : 
                      currentUser.role === UserRole.MANAGER ? 'bg-gray-800 text-white' : 
                      currentUser.role === UserRole.CHEF ? 'bg-orange-500 text-white' : 'bg-blue-600 text-white'
                   }`}>{currentUser.role}</span>
                </div>
                <div className="relative group cursor-pointer">
                  <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-red-100 border border-red-700 transition-transform hover:scale-105">
                    {currentUser.name[0]}
                  </div>
                </div>
                <button onClick={() => setCurrentUser(null)} className="p-2 text-gray-300 hover:text-red-600 transition-all hover:bg-red-50 rounded-xl" title="Sair do terminal">
                   <LogOut size={20} />
                </button>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-8">
            {activeSection === AppSection.DASHBOARD && <Dashboard transactions={transactions} products={products} printers={printers} />}
            {activeSection === AppSection.POS && <POS currentUser={currentUser} tables={tables} setTables={setTables} products={products} onAddItems={addOrderItem} onFinalize={finalizePayment} onAddTable={handleAddNewTable} />}
            {activeSection === AppSection.KDS && <KDS tables={tables} setTables={setTables} />}
            {activeSection === AppSection.INVENTORY && <Inventory products={products} setProducts={setProducts} />}
            {activeSection === AppSection.CRM && <CRM customers={customers} />}
            {activeSection === AppSection.SETTINGS && <Settings printers={printers} setPrinters={setPrinters} connections={connections} setConnections={setConnections} users={users} setUsers={setUsers} />}
            {activeSection === AppSection.ARCHITECT && <ArchitectInfo />}
        </main>
      </div>
    </div>
  );
};

export default App;