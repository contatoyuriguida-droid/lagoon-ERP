
export enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  PAID = 'PAID'
}

export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  CLEANING = 'CLEANING'
}

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
  PIX = 'PIX'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  WAITER = 'WAITER',
  CHEF = 'CHEF'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  pin: string;
  avatar?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  cost: number;
  stock: number;
  salesVolume: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  status: OrderStatus;
  paid: boolean;
  timestamp: number;
}

export interface Table {
  id: number;
  comandaId?: string;
  status: TableStatus;
  orderItems: OrderItem[];
  customerCount: number;
  lastUpdate: number;
}

export interface Transaction {
  id: string;
  tableId: number;
  comandaId?: string;
  amount: number;
  amountPaid: number;
  change: number;
  paymentMethod: PaymentMethod;
  itemsCount: number;
  timestamp: number;
  customerId?: string;
}

export interface Customer {
  id: string;
  name: string;
  spent: number;
  points: number;
  lastVisit: string;
  prefs: string[];
}

export interface Printer {
  id: string;
  name: string;
  type: 'COZINHA' | 'CAIXA' | 'BAR';
  connectionMethod: 'IP' | 'USB';
  ip?: string;
  usbVendorId?: string;
  status: 'ONLINE' | 'OFFLINE';
  isDefault?: boolean;
}

export interface Connection {
  id: string;
  provider: string;
  type: 'IFOOD' | 'RAPPI' | 'FISCAL' | 'BANK';
  status: 'CONNECTED' | 'DISCONNECTED';
  apiKey?: string;
}

export enum AppSection {
  DASHBOARD = 'DASHBOARD',
  POS = 'POS',
  KDS = 'KDS',
  INVENTORY = 'INVENTORY',
  CRM = 'CRM',
  SETTINGS = 'SETTINGS',
  ARCHITECT = 'ARCHITECT',
  USERS = 'USERS'
}