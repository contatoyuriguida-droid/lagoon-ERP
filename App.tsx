import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, Menu, X, LogOut, ChevronRight, Lock, Cloud, RefreshCw, Volume2, Check, Printer as PrinterIcon } from 'lucide-react';
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

  // Refs para evitar loops de sincronização e garantir dados mais recentes
  const isWritingRef = useRef(false);
  const lastSyncTimeRef = useRef(0);

  // --- SERVIÇO DE IMPRESSÃO IP (MANTIDO) ---
  const sendToPrinter = useCallback((type: 'COZINHA' | 'BAR' | 'CAIXA', content: string) => {
    const targetPrinter = printers.find(p => p.type === type && p.status === 'ONLINE') || printers.find(p => p.type === 'CAIXA');
    if (!targetPrinter) return;
    setLastPrintJob(`Imprimindo no ${targetPrinter.type}...`);
    setTimeout(() => setLastPrintJob(null), 2000);
    console.log(`[PRINTER ${targetPrinter.ip}]`, content);
  }, [printers]);

  const playKdsBeep = useCallback(() => {
    if (!isSoundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) {}
  }, [isSoundEnabled]);

  // --- MOTOR DE SINCRONIZAÇÃO ULTRA-RÁPIDO ---
  const persistToCloud = useCallback(async (overrides?: any, priority = false) => {
    if (isWritingRef.current && !priority) return;
    
    isWritingRef.current = true;
    setIsSyncing(true);
    
    const newState = {
      products,
      transactions,
      customers,
      users,
      tables,
      printers,
      connections,
      lastGlobalUpdate: Date.now(),
      ...overrides
    };

    try {
      await setDoc(doc(db, DOC_PATH), newState, { merge: true });
      lastSyncTimeRef.current = Date.now();
    } catch (e) {
      console.error("Erro crítico de sincronização:", e);
    } finally {
      isWritingRef.current = false;
      setTimeout(() => setIsSyncing(false), 300);
    }
  }, [products, transactions, customers, users, tables, printers, connections]);

  // Escuta mudanças externas
  useEffect(() => {
    const unsub = onSnapshot(doc(db, DOC_PATH), (docSnap: any) => {
      // Se eu estou escrevendo, ignoro o que vem da rede para não "bater cabeça"
      if (isWritingRef.current) return;

      if (docSnap.exists()) {
        const cloud = docSnap.data();
        
        // Só atualizamos se o dado da nuvem for realmente mais novo que nossa última sincronização de saída
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
        // Inicialização se for a primeira vez
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

  // --- OPERAÇÕES COM PERSISTÊNCIA PRIORITÁRIA ---
  
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
    persistToCloud({ tables: newTables }, true); // Salva IMEDIATAMENTE
    playKdsBeep();
  }, [tables, sendToPrinter, persistToCloud, playKdsBeep]);

  const finalizePayment = useCallback((tableId: number, itemIds: string[], method: PaymentMethod, amount: number, change: number) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const itemsToPay = table.orderItems.filter(i => itemIds.includes(i.id));
    const total = itemsToPay.reduce((s, i) => s + (i.price * i.quantity), 0);

    const newTransaction: Transaction = {
      id: `tx-${Date.now()}`, tableId, comandaId: table.comandaId, amount: total, amountPaid: amount, change,
      paymentMethod: method, itemsCount: itemIds.length, timestamp: Date.now()
    };

    const newTransactions = [...transactions, newTransaction];
    const newTables = tables.map(t => {
      if (t.id === tableId) {
        const remainingItems = t.orderItems.filter(i => !itemIds.includes(i.id));
        return {
          ...t,
          orderItems: remainingItems,
          status: remainingItems.length === 0 ? TableStatus.AVAILABLE : TableStatus.OCCUPIED,
          comandaId: remainingItems.length === 0 ? undefined : t.comandaId,
          lastUpdate: Date.now()
        };
      }
      return t;
    });

    // Atualiza estados locais
    setTransactions(newTransactions);
    setTables(newTables);

    // Persiste IMEDIATAMENTE na nuvem para os outros terminais verem a mesa livre
    persistToCloud({ 
      tables: newTables, 
      transactions: newTransactions 
    }, true);

    sendToPrinter('CAIXA', `EXTRATO MESA ${tableId}\nFECHADO: R$ ${total.toFixed(2)}`);
  }, [tables, transactions, persistToCloud, sendToPrinter]);

  const transferTable = useCallback((fromId: number, toId: number) => {
    const fromTable = tables.find(t => t.id === fromId);
    if (!fromTable) return;

    const newTables = tables.map(t => {
      if (t.id === fromId) {
        return { ...t, status: TableStatus.AVAILABLE, orderItems: [], comandaId: undefined, lastUpdate: Date.now() };
      }
      if (t.id === toId) {
        return { ...t, status: TableStatus.OCCUPIED, orderItems: fromTable.orderItems, comandaId: fromTable.comandaId, lastUpdate: Date.now() };
      }
      return t;
    });

    setTables(newTables);
    persistToCloud({ tables: newTables }, true); // Salva IMEDIATAMENTE
  }, [tables, persistToCloud]);

  if (!isLoaded) return <div className="loading-screen"><div className="spinner"></div><div className="loading-text">Sincronizando Real-Time...</div></div>;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm flex flex-col items-center">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-red-200 mb-6">L</div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Lagoon <span className="text-red-600">GastroBar</span></h1>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-10">ERP Conectado v2.0</p>
          <div className="grid grid-cols-3 gap-4 w-full">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map(key => (
              <button key={key} onClick={() => {
                if (key === 'C') setPinBuffer("");
                else if (key === 'OK') {
                   const u = users.find(u => u.pin === pinBuffer);
                   if (u) setCurrentUser(u);
                   else setPinBuffer("");
                } else setPinBuffer(p => p + key);
              }} className="h-14 rounded-xl flex items-center justify-center font-black text-lg bg-white border border-gray-100 text-gray-800 shadow-sm active:bg-red-600 active:text-white">
                {key}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* SIDEBAR (MANTIDA) */}
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
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-30 shadow-sm">
          <h2 className="text-[11px] font-black text-gray-800 uppercase tracking-[0.2em]">{activeSection}</h2>
          <div className="flex items-center gap-4">
             {lastPrintJob && (
               <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full animate-in fade-in zoom-in duration-300">
                  <PrinterIcon size={12} />
                  <span className="text-[9px] font-black uppercase">{lastPrintJob}</span>
               </div>
             )}
             <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-blue-500 animate-ping' : 'bg-green-500'}`} />
                <span className="text-[9px] font-black text-gray-500 uppercase">{isSyncing ? 'Gravando Nuvem' : 'Sincronizado'}</span>
             </div>
             <button onClick={() => setCurrentUser(null)} className="p-2 text-gray-400 hover:text-red-600"><LogOut size={20} /></button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-8">
            {activeSection === AppSection.DASHBOARD && <Dashboard transactions={transactions} products={products} printers={printers} />}
            {activeSection === AppSection.POS && <POS tables={tables} setTables={setTables} products={products} onAddItems={addOrderItem} onFinalize={finalizePayment} onTransfer={transferTable} />}
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