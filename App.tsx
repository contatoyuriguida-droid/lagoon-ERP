import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, Menu, X, LogOut, ChevronRight, Lock, Cloud, RefreshCw, Volume2, Check, Printer as PrinterIcon, User as UserIcon, ShieldCheck, ShieldAlert } from 'lucide-react';
// @ts-ignore
import { initializeApp } from "firebase/app";
// @ts-ignore
import { getFirestore, doc, onSnapshot, setDoc, getDoc, updateDoc } from "firebase/firestore";

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
  const [isPinError, setIsPinError] = useState<boolean>(false);
  const [loginToast, setLoginToast] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [statusTables, setTables] = useState<Table[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);

  // Referências cruciais para evitar Stale Closures (Dados antigos em funções async)
  const stateRef = useRef({
    tables: [] as Table[],
    transactions: [] as Transaction[],
    products: [] as Product[],
    customers: [] as Customer[],
    users: [] as User[],
    printers: [] as Printer[],
    connections: [] as Connection[]
  });

  useEffect(() => {
    stateRef.current = {
      tables: statusTables,
      transactions,
      products,
      customers,
      users,
      printers,
      connections
    };
  }, [statusTables, transactions, products, customers, users, printers, connections]);

  const isWritingRef = useRef(false);
  const lastSyncTimeRef = useRef(0);

  // Função de persistência Robusta: Força a atualização do Ref antes de enviar
  const persistToCloud = useCallback(async (overrides?: any) => {
    isWritingRef.current = true;
    setIsSyncing(true);
    
    const now = Date.now();
    const newState = {
      products: overrides?.products || stateRef.current.products,
      transactions: overrides?.transactions || stateRef.current.transactions,
      customers: overrides?.customers || stateRef.current.customers,
      users: overrides?.users || stateRef.current.users,
      tables: overrides?.tables || stateRef.current.tables,
      printers: overrides?.printers || stateRef.current.printers,
      connections: overrides?.connections || stateRef.current.connections,
      lastGlobalUpdate: now
    };

    try {
      await setDoc(doc(db, DOC_PATH), newState);
      lastSyncTimeRef.current = now;
    } catch (e) {
      console.error("Cloud Save Error:", e);
    } finally {
      // Pequeno delay para permitir que o onSnapshot receba a própria atualização sem conflito
      setTimeout(() => {
        isWritingRef.current = false;
        setIsSyncing(false);
      }, 500);
    }
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, DOC_PATH), (docSnap: any) => {
      // Se estamos escrevendo, ignoramos o snapshot para evitar "flicker" ou sobrescrita reversa
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
          lastSyncTimeRef.current = cloud.lastGlobalUpdate;
        }
      } else {
        // Inicialização primária
        const initTables = Array.from({ length: 24 }, (_, i) => ({ 
          id: i + 1, status: TableStatus.AVAILABLE, orderItems: [], customerCount: 0, lastUpdate: Date.now() 
        }));
        setTables(initTables);
        persistToCloud({ tables: initTables });
      }
      setIsLoaded(true);
    });
    return () => unsub();
  }, [persistToCloud]);

  const handleLogin = (u: User) => {
    setCurrentUser(u);
    setPinBuffer("");
    setIsPinError(false);
    setLoginToast(null);
    if (u.role === UserRole.WAITER) {
      setActiveSection(AppSection.POS);
      setIsSidebarOpen(false);
    } else {
      setActiveSection(AppSection.DASHBOARD);
    }
  };

  const handleWrongPin = () => {
    setIsPinError(true);
    setLoginToast("ACESSO NEGADO: OPERADOR NÃO ENCONTRADO");
    setTimeout(() => { setPinBuffer(""); setIsPinError(false); }, 600);
    setTimeout(() => { setLoginToast(null); }, 3000);
  };

  const assignCustomerToTable = useCallback((tableId: number, customerId: string | undefined) => {
    const newTables = stateRef.current.tables.map(t => 
      t.id === tableId ? { ...t, customerId, lastUpdate: Date.now() } : t
    );
    setTables(newTables);
    persistToCloud({ tables: newTables });
  }, [persistToCloud]);

  const addOrderItem = useCallback((tableId: number, product: Product, qty: number, comandaId?: string) => {
    // Usamos o estado mais recente do REF para garantir que não perdemos itens de outros garçons
    const newTables = stateRef.current.tables.map(t => {
      if (t.id === tableId) {
        const newItem: OrderItem = {
          id: `it-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          productId: product.id, name: product.name, price: product.price, quantity: qty,
          status: OrderStatus.PREPARING, paid: false, timestamp: Date.now()
        };
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
    persistToCloud({ tables: newTables });
  }, [persistToCloud]);

  const removeOrderItem = useCallback((tableId: number, itemId: string) => {
    const newTables = stateRef.current.tables.map(t => {
      if (t.id === tableId) {
        const remainingItems = t.orderItems.filter(oi => oi.id !== itemId);
        const isEmpty = remainingItems.length === 0;
        return {
          ...t,
          status: isEmpty ? TableStatus.AVAILABLE : TableStatus.OCCUPIED,
          comandaId: isEmpty ? "" : t.comandaId,
          orderItems: remainingItems,
          lastUpdate: Date.now()
        };
      }
      return t;
    });
    setTables(newTables);
    persistToCloud({ tables: newTables });
  }, [persistToCloud]);

  const finalizePayment = useCallback((tableId: number, itemIds: string[], method: PaymentMethod, amount: number, change: number) => {
    const table = stateRef.current.tables.find(t => t.id === tableId);
    if (!table) return;
    
    const itemsToPay = table.orderItems.filter(i => itemIds.includes(i.id));
    const total = itemsToPay.reduce((s, i) => s + (i.price * i.quantity), 0);
    
    // Atualização do CRM
    let updatedCustomers = stateRef.current.customers;
    if (table.customerId) {
      updatedCustomers = updatedCustomers.map(c => {
        if (c.id === table.customerId) {
          return {
            ...c,
            spent: c.spent + total,
            points: c.points + Math.floor(total / 10),
            lastVisit: new Date().toLocaleDateString('pt-BR')
          };
        }
        return c;
      });
      setCustomers(updatedCustomers);
    }

    const newTx: Transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, 
      tableId, comandaId: table.comandaId, amount: total, amountPaid: amount, change,
      paymentMethod: method, itemsCount: itemIds.length, timestamp: Date.now(), customerId: table.customerId
    };
    
    const newTransactions = [...stateRef.current.transactions, newTx];
    const newTables = stateRef.current.tables.map(t => {
      if (t.id === tableId) {
        const remaining = t.orderItems.filter(i => !itemIds.includes(i.id));
        const isNowAvailable = remaining.length === 0;
        return { 
          ...t, 
          orderItems: remaining, 
          status: isNowAvailable ? TableStatus.AVAILABLE : TableStatus.OCCUPIED, 
          comandaId: isNowAvailable ? "" : t.comandaId, 
          customerId: isNowAvailable ? undefined : t.customerId,
          lastUpdate: Date.now() 
        };
      }
      return t;
    });
    
    setTransactions(newTransactions);
    setTables(newTables);
    persistToCloud({ tables: newTables, transactions: newTransactions, customers: updatedCustomers });
  }, [persistToCloud]);

  const markItemAsReady = useCallback((tableId: number, itemId: string) => {
    const newTables = stateRef.current.tables.map(t => {
      if (t.id === tableId) {
        return { ...t, orderItems: t.orderItems.map(oi => oi.id === itemId ? { ...oi, status: OrderStatus.READY } : oi), lastUpdate: Date.now() };
      }
      return t;
    });
    setTables(newTables);
    persistToCloud({ tables: newTables });
  }, [persistToCloud]);

  const handleAddNewTable = useCallback(() => {
    const nextId = stateRef.current.tables.length > 0 ? Math.max(...stateRef.current.tables.map(t => t.id)) + 1 : 1;
    const newTables = [...stateRef.current.tables, {
      id: nextId, status: TableStatus.AVAILABLE, orderItems: [], customerCount: 0, lastUpdate: Date.now()
    }];
    setTables(newTables);
    persistToCloud({ tables: newTables });
  }, [persistToCloud]);

  if (!isLoaded) return <div className="loading-screen"><div className="spinner"></div><div className="loading-text">Sincronia Lagoon...</div></div>;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-10px); }
            40%, 80% { transform: translateX(10px); }
          }
          .shake-animation { animation: shake 0.4s ease-in-out; }
        `}</style>

        {loginToast && (
          <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[300] animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="bg-red-600 text-white px-8 py-4 rounded-2xl shadow-2xl shadow-red-200 flex items-center gap-3">
              <ShieldAlert size={20} className="animate-pulse" />
              <span className="font-black text-[10px] uppercase tracking-[0.2em]">{loginToast}</span>
            </div>
          </div>
        )}
        
        <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-xl mb-6">L</div>
        <h1 className="text-3xl font-black text-gray-900 mb-1">Lagoon <span className="text-red-600">GastroBar</span></h1>
        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em] mb-10">Terminal Operacional Cloud</p>
        
        <div className={`flex gap-4 mb-12 ${isPinError ? 'shake-animation' : ''}`}>
          {[0, 1, 2, 3].map((idx) => (
            <div key={idx} className={`w-5 h-5 rounded-full border-4 transition-all duration-300 ${isPinError ? 'bg-red-600 border-red-600 scale-110' : pinBuffer.length > idx ? 'bg-red-600 border-red-600 scale-125 shadow-lg shadow-red-200' : 'bg-gray-100 border-gray-200'}`} />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 w-full max-w-[320px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map(key => (
            <button key={key} onClick={() => {
                if (isPinError) return;
                if (key === 'C') { setPinBuffer(""); setIsPinError(false); }
                else if (key === 'OK') {
                  const u = users.find(u => u.pin === pinBuffer);
                  if (u) handleLogin(u);
                  else handleWrongPin();
                } else if (pinBuffer.length < 4) {
                  setPinBuffer(p => p + String(key));
                  if (loginToast) setLoginToast(null);
                }
              }} 
              className="h-16 rounded-2xl flex items-center justify-center font-black text-xl bg-white border-2 border-gray-100 text-gray-800 shadow-sm active:bg-red-600 active:text-white transform active:scale-95 transition-all select-none"
            >
              {key}
            </button>
          ))}
        </div>
        <div className="h-10 mt-6 flex items-center justify-center">{isPinError && <p className="text-red-600 text-[10px] font-black uppercase tracking-widest animate-pulse">PIN Incorreto</p>}</div>
      </div>
    );
  }

  const allowedSections = ROLE_PERMISSIONS[currentUser.role];

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <aside className={`${isSidebarOpen ? 'flex' : 'hidden'} lg:flex flex-col bg-white border-r border-gray-100 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="h-16 flex items-center px-6 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-black">L</div>
            {isSidebarOpen && <span className="font-black text-xl text-red-600 tracking-tighter">Lagoon</span>}
          </div>
        </div>
        <nav className="flex-1 py-6 px-3 space-y-1">
          {NAVIGATION_ITEMS.filter(i => allowedSections.includes(i.id)).map(item => (
            <button key={item.id} onClick={() => setActiveSection(item.id)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${activeSection === item.id ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-red-600'}`}>
              {item.icon}
              {isSidebarOpen && <span className="text-xs font-black uppercase tracking-wider">{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 lg:h-24 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-8 z-30 shadow-sm">
          <div className="flex items-center gap-4">
             {allowedSections.length > 1 && <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-400 lg:hidden"><Menu size={24} /></button>}
             <h2 className="text-[10px] lg:text-[12px] font-black text-gray-800 uppercase tracking-[0.2em]">{activeSection}</h2>
          </div>
          <div className="flex items-center gap-3 lg:gap-6">
             <div className="hidden sm:flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-blue-500 animate-pulse' : 'bg-green-500 shadow-sm'}`} />
                <span className="text-[9px] font-black text-green-700 uppercase tracking-widest">{isSyncing ? 'Sincronizando' : 'Ativo'}</span>
             </div>
             <div className="flex items-center gap-3 lg:gap-5 pl-3 lg:pl-6 border-l-2 border-gray-100">
                <div className="text-right hidden xs:block">
                   <p className="text-[12px] lg:text-[14px] font-black text-gray-900 leading-none mb-1">{currentUser.name}</p>
                   <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest text-white ${currentUser.role === UserRole.ADMIN ? 'bg-red-600' : 'bg-blue-600'}`}>{currentUser.role}</div>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-red-600 flex items-center justify-center text-white font-black text-lg lg:text-xl shadow-lg">{currentUser.name[0]}</div>
                <button onClick={() => setCurrentUser(null)} className="p-2 lg:p-3 text-gray-400 hover:text-red-600 transition-all"><LogOut size={20} /></button>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-3 lg:p-10">
            {activeSection === AppSection.DASHBOARD && <Dashboard transactions={transactions} products={products} printers={printers} />}
            {activeSection === AppSection.POS && <POS 
              currentUser={currentUser} 
              tables={statusTables} 
              products={products} 
              customers={customers}
              onAddItems={addOrderItem} 
              onRemoveItem={removeOrderItem} 
              onFinalize={finalizePayment} 
              onAddTable={handleAddNewTable}
              onAssignCustomer={assignCustomerToTable}
            />}
            {activeSection === AppSection.KDS && <KDS tables={statusTables} onMarkReady={markItemAsReady} />}
            {activeSection === AppSection.INVENTORY && <Inventory products={products} setProducts={(newProds) => { 
                const updated = typeof newProds === 'function' ? newProds(stateRef.current.products) : newProds;
                setProducts(updated);
                persistToCloud({ products: updated });
            }} />}
            {activeSection === AppSection.CRM && <CRM customers={customers} setCustomers={(newCust) => {
                const updated = typeof newCust === 'function' ? newCust(stateRef.current.customers) : newCust;
                setCustomers(updated);
                persistToCloud({ customers: updated });
            }} />}
            {activeSection === AppSection.SETTINGS && <Settings printers={printers} setPrinters={setPrinters} connections={connections} setConnections={setConnections} users={users} setUsers={setUsers} />}
            {activeSection === AppSection.ARCHITECT && <ArchitectInfo />}
        </main>
      </div>
    </div>
  );
};

export default App;