import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Menu, X, LogOut, ChevronRight, Lock } from 'lucide-react';
// @ts-ignore
import { initializeApp } from "firebase/app";
// @ts-ignore
import { getFirestore, doc, onSnapshot, setDoc, collection, getDoc } from "firebase/firestore";

import { AppSection, Table, TableStatus, OrderStatus, Product, Transaction, Customer, OrderItem, PaymentMethod, Printer, Connection, User, UserRole } from './types.ts';
import { NAVIGATION_ITEMS, MOCK_PRODUCTS, INITIAL_USERS, ROLE_PERMISSIONS } from './constants.tsx';
import Dashboard from './pages/Dashboard.tsx';
import POS from './pages/POS.tsx';
import KDS from './pages/KDS.tsx';
import Inventory from './pages/Inventory.tsx';
import CRM from './pages/CRM.tsx';
import Settings from './pages/Settings.tsx';
import ArchitectInfo from './pages/ArchitectInfo.tsx';

// CONFIGURAÇÃO FIREBASE
// Nota: Em um ambiente real, estas chaves viriam de variáveis de ambiente.
const firebaseConfig = {
  apiKey: "demo-key",
  authDomain: "lagoon-gastrobar.firebaseapp.com",
  projectId: "lagoon-gastrobar",
  storageBucket: "lagoon-gastrobar.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
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

  // --- FIREBASE SYNC ---
  useEffect(() => {
    // Escuta em tempo real as mudanças no Firestore
    const unsub = onSnapshot(doc(db, DOC_PATH), (docSnap: any) => {
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
        // Se o documento não existe (primeiro acesso), inicializa mesas
        const initialTables = Array.from({ length: 24 }, (_, i) => ({ id: i + 1, status: TableStatus.AVAILABLE, orderItems: [], customerCount: 0, lastUpdate: Date.now() }));
        setTables(initialTables);
      }
      setIsLoaded(true);
    }, (error: any) => {
      console.warn("Firestore offline ou erro de permissão. Usando Local Storage fallback.", error);
      // Fallback para garantir que o app não trave em loading
      setIsLoaded(true);
    });

    return () => unsub();
  }, []);

  // --- PERSISTENCE HELPER ---
  const syncToCloud = useCallback(async (updates: any) => {
    try {
      // Nota: Em produção, salvaríamos apenas o delta. Aqui salvamos o estado completo para simplicidade do ERP.
      await setDoc(doc(db, DOC_PATH), updates, { merge: true });
    } catch (e) {
      console.error("Falha ao sincronizar com Firebase", e);
    }
  }, []);

  // Efeito para salvar mudanças (debounce ou trigger manual é preferível em larga escala)
  useEffect(() => {
    if (isLoaded) {
      const timeout = setTimeout(() => {
        syncToCloud({ products, transactions, customers, users, tables, printers, connections });
      }, 1000);
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
      if (pinBuffer.length < 6) {
        setPinBuffer(prev => prev + digit);
      }
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
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
        return {
          ...p,
          stock: Math.max(0, p.stock - soldItem.quantity),
          salesVolume: (p.salesVolume || 0) + soldItem.quantity
        };
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
      if (t.id === fromId) {
        return { ...t, orderItems: [], status: TableStatus.AVAILABLE, comandaId: undefined, lastUpdate: Date.now() };
      }
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
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <div className="w-12 h-12 border-4 border-gray-100 border-t-red-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-red-600 font-black text-[10px] uppercase tracking-widest">Sincronizando Banco de Dados...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-sm flex flex-col items-center">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-red-200 mb-6">L</div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tighter mb-1">Lagoon <span className="text-red-600">GastroBar</span></h1>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-10 text-center">Controle de Acesso Cloud</p>

          <div className="w-full mb-8">
            <div className="flex justify-center gap-3 mb-8">
              {[0, 1, 2, 3].map((idx) => (
                <div key={idx} className={`w-4 h-4 rounded-full border-2 transition-all ${pinBuffer.length > idx ? 'bg-red-600 border-red-600' : 'border-gray-200'}`} />
              ))}
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map(key => (
                <button
                  key={key}
                  onClick={() => handlePinInput(key.toString())}
                  className={`h-16 rounded-2xl flex items-center justify-center font-bold text-lg active:scale-95 transition-all ${
                    key === 'OK' ? 'bg-red-600 text-white shadow-lg' : 
                    key === 'C' ? 'bg-gray-100 text-gray-400' : 'bg-white border border-gray-100 text-gray-800 shadow-sm hover:border-red-600'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full border-t border-gray-100 pt-6">
            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest text-center mb-4">Acesso Rápido (Demo)</p>
            <div className="grid grid-cols-2 gap-2">
              {users.map(u => (
                <button key={u.id} onClick={() => { setPinBuffer(u.pin); handlePinInput('OK'); }} className="flex flex-col items-center p-3 bg-gray-50 rounded-xl hover:bg-red-50 transition-colors group">
                  <span className="text-xs font-bold text-gray-800 group-hover:text-red-600">{u.name}</span>
                  <span className="text-[8px] font-black text-gray-400 uppercase group-hover:text-red-400">{u.role}</span>
                </button>
              ))}
            </div>
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
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-black shrink-0 shadow-lg shadow-red-100">L</div>
            {isSidebarOpen && <span className="font-black text-xl text-red-600 tracking-tight">Lagoon</span>}
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                activeSection === item.id ? 'bg-red-600 text-white shadow-xl shadow-red-100' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <span className={activeSection === item.id ? 'text-white' : 'text-gray-400'}>{item.icon}</span>
              {isSidebarOpen && <span className="text-sm font-bold truncate">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-50">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
            <LogOut size={20} />
            {isSidebarOpen && <span className="text-xs font-bold uppercase tracking-widest">Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 text-gray-400"><Menu size={20} /></button>
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-tighter">{NAVIGATION_ITEMS.find(i => i.id === activeSection)?.label}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 mr-4 bg-green-50 px-3 py-1 rounded-full border border-green-100">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
               <span className="text-[10px] font-bold text-green-700 uppercase">Cloud Sync</span>
            </div>
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-gray-900 leading-none">{currentUser.name}</p>
                <p className="text-[8px] font-black text-red-600 uppercase tracking-widest mt-1">{currentUser.role}</p>
              </div>
              <div className="w-9 h-9 bg-red-50 text-red-600 border border-red-100 rounded-xl flex items-center justify-center font-black">
                {currentUser.name[0]}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-8 bg-[#FDFDFD]">
          <div className="max-w-7xl mx-auto">
            {activeSection === AppSection.DASHBOARD && <Dashboard transactions={transactions} products={products} />}
            {activeSection === AppSection.POS && (
              <POS 
                tables={tables} 
                setTables={setTables} 
                products={products} 
                customers={customers}
                onAddItems={addOrderItem}
                onFinalize={finalizePayment}
                onTransfer={transferItems}
              />
            )}
            {activeSection === AppSection.KDS && <KDS tables={tables} setTables={setTables} />}
            {activeSection === AppSection.INVENTORY && <Inventory products={products} setProducts={setProducts} />}
            {activeSection === AppSection.CRM && <CRM customers={customers} />}
            {activeSection === AppSection.SETTINGS && (
              <Settings 
                printers={printers} setPrinters={setPrinters} 
                connections={connections} setConnections={setConnections}
                users={users} setUsers={setUsers}
              />
            )}
            {activeSection === AppSection.ARCHITECT && <ArchitectInfo />}
          </div>
        </main>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-white flex flex-col p-6 shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between mb-8">
              <span className="font-black text-2xl text-red-600">Lagoon</span>
              <button onClick={() => setIsMobileMenuOpen(false)}><X size={24} /></button>
            </div>
            <nav className="flex-1 space-y-2">
              {sidebarItems.map(item => (
                <button key={item.id} onClick={() => { setActiveSection(item.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activeSection === item.id ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'text-gray-400'}`}>
                  {item.icon} {item.label}
                </button>
              ))}
            </nav>
            <button onClick={handleLogout} className="mt-auto flex items-center gap-3 p-4 text-gray-400 font-bold border-t border-gray-100">
              <LogOut /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;