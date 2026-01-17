import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, Menu, X, LogOut, ChevronRight, Lock, Cloud, RefreshCw, Volume2, Check, Printer as PrinterIcon, User as UserIcon, ShieldCheck, ShieldAlert } from 'lucide-react';
// @ts-ignore
import { initializeApp } from "firebase/app";
// @ts-ignore
import { getFirestore, doc, onSnapshot, setDoc, collection, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";

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

const COLL_TABLES = "lagoon_tables";
const COLL_PRODUCTS = "lagoon_products";
const COLL_CUSTOMERS = "lagoon_customers";
const COLL_TRANSACTIONS = "lagoon_transactions";
const DOC_SETTINGS = "lagoon_config/global";

const sanitize = (obj: any) => {
  const cleaned = { ...obj };
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    } else if (cleaned[key] && typeof cleaned[key] === 'object' && !Array.isArray(cleaned[key])) {
      cleaned[key] = sanitize(cleaned[key]);
    }
  });
  return cleaned;
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pinBuffer, setPinBuffer] = useState<string>("");
  const [isPinError, setIsPinError] = useState<boolean>(false);
  const [loginToast, setLoginToast] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [statusTables, setTables] = useState<Table[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);

  const tablesRef = useRef<Table[]>([]);
  useEffect(() => { tablesRef.current = statusTables; }, [statusTables]);

  useEffect(() => {
    const unsubTables = onSnapshot(collection(db, COLL_TABLES), (snap) => {
      const list: Table[] = [];
      snap.forEach(d => list.push(d.data() as Table));
      setTables(list.sort((a, b) => a.id - b.id));
      setIsLoaded(true);
    });

    const unsubProds = onSnapshot(collection(db, COLL_PRODUCTS), (snap) => {
      const list: Product[] = [];
      snap.forEach(d => list.push(d.data() as Product));
      setProducts(list.length > 0 ? list : MOCK_PRODUCTS);
    });

    const unsubTx = onSnapshot(collection(db, COLL_TRANSACTIONS), (snap) => {
      const list: Transaction[] = [];
      snap.forEach(d => list.push(d.data() as Transaction));
      setTransactions(list.sort((a, b) => b.timestamp - a.timestamp));
    });

    const unsubCust = onSnapshot(collection(db, COLL_CUSTOMERS), (snap) => {
      const list: Customer[] = [];
      snap.forEach(d => list.push(d.data() as Customer));
      setCustomers(list);
    });

    const unsubSettings = onSnapshot(doc(db, DOC_SETTINGS), (ds) => {
      if (ds.exists()) {
        const d = ds.data();
        if (d.printers) setPrinters(d.printers);
        if (d.connections) setConnections(d.connections);
        if (d.users) setUsers(d.users);
      }
    });

    return () => {
      unsubTables(); unsubProds(); unsubTx(); unsubCust(); unsubSettings();
    };
  }, []);

  const saveTable = async (table: Table) => {
    setIsSyncing(true);
    try {
      await setDoc(doc(db, COLL_TABLES, table.id.toString()), sanitize(table));
    } catch (e) {
      console.error("Erro ao salvar mesa:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveProduct = async (product: Product) => {
    setIsSyncing(true);
    try {
      await setDoc(doc(db, COLL_PRODUCTS, product.id), sanitize(product));
    } catch (e) {
      console.error("Erro ao salvar produto:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setIsSyncing(true);
    try {
      await deleteDoc(doc(db, COLL_PRODUCTS, productId));
    } catch (e) {
      console.error("Erro ao excluir produto:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const addOrderItem = useCallback(async (tableId: number, product: Product, qty: number, comandaId?: string) => {
    const table = tablesRef.current.find(t => t.id === tableId);
    if (!table) return;

    const newItem: OrderItem = {
      id: `it-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      productId: product.id, name: product.name, price: product.price, quantity: qty,
      status: OrderStatus.PREPARING, paid: false, timestamp: Date.now()
    };

    const updatedTable: Table = {
      ...table,
      status: TableStatus.OCCUPIED,
      comandaId: comandaId || table.comandaId || Math.floor(1000 + Math.random() * 9000).toString(),
      orderItems: [...table.orderItems, newItem],
      lastUpdate: Date.now()
    };

    setTables(prev => prev.map(t => t.id === tableId ? updatedTable : t));
    await saveTable(updatedTable);
  }, []);

  const removeOrderItem = useCallback(async (tableId: number, itemId: string) => {
    const table = tablesRef.current.find(t => t.id === tableId);
    if (!table) return;

    const remainingItems = table.orderItems.filter(oi => oi.id !== itemId);
    const isEmpty = remainingItems.length === 0;

    const updatedTable: Table = {
      ...table,
      status: isEmpty ? TableStatus.AVAILABLE : TableStatus.OCCUPIED,
      comandaId: isEmpty ? "" : table.comandaId,
      orderItems: remainingItems,
      lastUpdate: Date.now()
    };

    setTables(prev => prev.map(t => t.id === tableId ? updatedTable : t));
    await saveTable(updatedTable);
  }, []);

  const finalizePayment = useCallback(async (tableId: number, itemIds: string[], method: PaymentMethod, amount: number, change: number) => {
    const table = tablesRef.current.find(t => t.id === tableId);
    if (!table) return;

    const itemsToPay = table.orderItems.filter(i => itemIds.includes(i.id));
    const total = itemsToPay.reduce((s, i) => s + (i.price * i.quantity), 0);

    const txId = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newTx: Transaction = {
      id: txId, 
      tableId, 
      comandaId: table.comandaId || "", 
      amount: total, 
      amountPaid: amount, 
      change,
      paymentMethod: method, 
      itemsCount: itemIds.length, 
      timestamp: Date.now(), 
      customerId: table.customerId || undefined
    };
    await setDoc(doc(db, COLL_TRANSACTIONS, txId), sanitize(newTx));

    if (table.customerId) {
      const customer = customers.find(c => c.id === table.customerId);
      if (customer) {
        await setDoc(doc(db, COLL_CUSTOMERS, customer.id), sanitize({
          ...customer,
          spent: customer.spent + total,
          points: customer.points + Math.floor(total / 10),
          lastVisit: new Date().toLocaleDateString('pt-BR')
        }));
      }
    }

    const remaining = table.orderItems.filter(i => !itemIds.includes(i.id));
    const isNowAvailable = remaining.length === 0;
    
    const updatedTable: Table = {
      ...table,
      orderItems: remaining,
      status: isNowAvailable ? TableStatus.AVAILABLE : TableStatus.OCCUPIED,
      comandaId: isNowAvailable ? "" : table.comandaId,
      customerId: isNowAvailable ? undefined : table.customerId,
      lastUpdate: Date.now()
    };

    setTables(prev => prev.map(t => t.id === tableId ? updatedTable : t));
    await saveTable(updatedTable);
  }, [customers]);

  const markItemAsReady = useCallback(async (tableId: number, itemId: string) => {
    const table = tablesRef.current.find(t => t.id === tableId);
    if (!table) return;

    const updatedTable: Table = {
      ...table,
      orderItems: table.orderItems.map(oi => oi.id === itemId ? { ...oi, status: OrderStatus.READY } : oi),
      lastUpdate: Date.now()
    };

    setTables(prev => prev.map(t => t.id === tableId ? updatedTable : t));
    await saveTable(updatedTable);
  }, []);

  const assignCustomerToTable = useCallback(async (tableId: number, customerId: string | undefined) => {
    const table = tablesRef.current.find(t => t.id === tableId);
    if (!table) return;

    const updatedTable: Table = { ...table, customerId, lastUpdate: Date.now() };
    setTables(prev => prev.map(t => t.id === tableId ? updatedTable : t));
    await saveTable(updatedTable);
  }, []);

  const handleAddNewTable = useCallback(async () => {
    const nextId = tablesRef.current.length > 0 ? Math.max(...tablesRef.current.map(t => t.id)) + 1 : 1;
    const newTable: Table = {
      id: nextId, status: TableStatus.AVAILABLE, orderItems: [], customerCount: 0, lastUpdate: Date.now()
    };
    await saveTable(newTable);
  }, []);

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

  if (!isLoaded) return <div className="loading-screen"><div className="spinner"></div><div className="loading-text">Lagoon Cloud Engine...</div></div>;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
        <style>{`
          @keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-10px); } 40%, 80% { transform: translateX(10px); } }
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
                <span className="text-[9px] font-black text-green-700 uppercase tracking-widest">{isSyncing ? 'Gravando' : 'Sincronizado'}</span>
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
            {activeSection === AppSection.INVENTORY && <Inventory 
              products={products} 
              onSaveProduct={handleSaveProduct}
              onDeleteProduct={handleDeleteProduct}
            />}
            {activeSection === AppSection.CRM && <CRM customers={customers} setCustomers={(newCust) => {}} />}
            {activeSection === AppSection.SETTINGS && <Settings printers={printers} setPrinters={setPrinters} connections={connections} setConnections={setConnections} users={users} setUsers={setUsers} />}
            {activeSection === AppSection.ARCHITECT && <ArchitectInfo />}
        </main>
      </div>
    </div>
  );
};

export default App;