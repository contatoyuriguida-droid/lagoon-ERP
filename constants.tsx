import React from 'react';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  MonitorPlay, 
  Package, 
  Users, 
  FileCode2,
  Settings as SettingsIcon,
  UserCog
} from 'lucide-react';
import { AppSection, UserRole, User, Product } from './types.ts';

export const COLORS = {
  primary: '#dc2626',
  secondary: '#ffffff',
  background: '#f9fafb',
  text: '#111827',
  accent: '#991b1b'
};

export const ROLE_PERMISSIONS: Record<UserRole, AppSection[]> = {
  [UserRole.ADMIN]: [
    AppSection.DASHBOARD, 
    AppSection.POS, 
    AppSection.KDS, 
    AppSection.INVENTORY, 
    AppSection.CRM, 
    AppSection.SETTINGS, 
    AppSection.ARCHITECT,
    AppSection.USERS
  ],
  [UserRole.MANAGER]: [
    AppSection.DASHBOARD, 
    AppSection.POS, 
    AppSection.KDS, 
    AppSection.INVENTORY, 
    AppSection.CRM,
    AppSection.USERS
  ],
  [UserRole.WAITER]: [
    AppSection.POS
  ],
  [UserRole.CHEF]: [
    AppSection.KDS,
    AppSection.INVENTORY
  ]
};

export const INITIAL_USERS: User[] = [
  { id: '1', name: 'Admin Lagoon', role: UserRole.ADMIN, pin: '1234' },
  { id: '2', name: 'Carlos (Gerente)', role: UserRole.MANAGER, pin: '0000' },
  { id: '3', name: 'João (Garçom)', role: UserRole.WAITER, pin: '1111' },
  { id: '4', name: 'Chef Ricardo', role: UserRole.CHEF, pin: '2222' }
];

export const NAVIGATION_ITEMS = [
  { id: AppSection.DASHBOARD, label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: AppSection.POS, label: 'Ponto de Venda', icon: <UtensilsCrossed size={20} /> },
  { id: AppSection.KDS, label: 'Cozinha', icon: <MonitorPlay size={20} /> },
  { id: AppSection.INVENTORY, label: 'Estoque', icon: <Package size={20} /> },
  { id: AppSection.CRM, label: 'CRM', icon: <Users size={20} /> },
  { id: AppSection.USERS, label: 'Equipe', icon: <UserCog size={20} /> },
  { id: AppSection.SETTINGS, label: 'Ajustes', icon: <SettingsIcon size={20} /> },
  { id: AppSection.ARCHITECT, label: 'Arquitetura', icon: <FileCode2 size={20} /> },
];

export const MOCK_PRODUCTS: Product[] = [
  // ENTRADAS
  { id: 'e1', name: 'Batata Frita', price: 24.99, category: 'Entradas', cost: 7.50, stock: 50, salesVolume: 120 },
  { id: 'e2', name: 'Batata Frita da Casa', price: 39.99, category: 'Entradas', cost: 12.00, stock: 40, salesVolume: 95 },
  { id: 'e3', name: 'Bolinho de Feijoada (10un)', price: 29.99, category: 'Entradas', cost: 9.00, stock: 30, salesVolume: 150 },
  { id: 'e4', name: 'Pastéis Sortidos', price: 29.99, category: 'Entradas', cost: 8.50, stock: 60, salesVolume: 210 },
  { id: 'e5', name: 'Pastel de Camarão (10un)', price: 39.99, category: 'Entradas', cost: 14.00, stock: 25, salesVolume: 180 },

  // REFEIÇÕES 1 PESSOA
  { id: 'r1', name: 'Arroz Cremoso Camarão', price: 39.90, category: 'Refeições', cost: 13.50, stock: 30, salesVolume: 340 },
  { id: 'r2', name: 'Contra Filé c/ Fritas', price: 37.90, category: 'Refeições', cost: 12.80, stock: 45, salesVolume: 410 },
  { id: 'r3', name: 'Estrogonofe de Camarão', price: 40.00, category: 'Refeições', cost: 14.50, stock: 20, salesVolume: 156 },
  { id: 'r4', name: 'Parmegiana de Frango', price: 36.90, category: 'Refeições', cost: 11.00, stock: 50, salesVolume: 280 },
  { id: 'r5', name: 'Picanha (1 pessoa)', price: 89.00, category: 'Refeições', cost: 28.00, stock: 15, salesVolume: 88 },
  { id: 'r6', name: 'Peixe do Dia c/ Molho Camarão', price: 45.00, category: 'Refeições', cost: 16.00, stock: 12, salesVolume: 65 },

  // VINHOS
  { id: 'v1', name: 'Casillero Sauvignon Blanc', price: 34.90, category: 'Vinhos', cost: 18.00, stock: 24, salesVolume: 42 },
  { id: 'v2', name: 'Casa Perini Brut Rosé', price: 79.90, category: 'Vinhos', cost: 42.00, stock: 18, salesVolume: 15 },
  { id: 'v3', name: 'Reservado Merlot', price: 59.90, category: 'Vinhos', cost: 28.00, stock: 30, salesVolume: 28 },
  { id: 'v4', name: 'Pérgola Tinto Suave', price: 49.90, category: 'Vinhos', cost: 22.00, stock: 48, salesVolume: 94 },

  // ESPECIAIS E PORÇÕES
  { id: 'p1', name: 'Moqueca de Peixe (2p)', price: 240.00, category: 'Especiais', cost: 85.00, stock: 10, salesVolume: 32 },
  { id: 'p2', name: 'Polvo Grelhado', price: 119.90, category: 'Especiais', cost: 48.00, stock: 8, salesVolume: 24 },
  { id: 'p3', name: 'Camarão Alho e Óleo', price: 69.99, category: 'Porções', cost: 24.00, stock: 30, salesVolume: 112 },
  { id: 'p4', name: 'Iscas Contra Filé Gorgonzola', price: 79.90, category: 'Porções', cost: 26.00, stock: 25, salesVolume: 54 },
  { id: 'p5', name: 'Quarteto Sea Angels', price: 169.90, category: 'Porções', cost: 62.00, stock: 15, salesVolume: 18 },

  // BEBIDAS
  { id: 'b1', name: 'Heineken', price: 15.00, category: 'Bebidas', cost: 6.50, stock: 120, salesVolume: 890 },
  { id: 'b2', name: 'Corona', price: 15.00, category: 'Bebidas', cost: 6.80, stock: 96, salesVolume: 450 },
  { id: 'b3', name: 'Refrigerante Lata', price: 8.00, category: 'Bebidas', cost: 2.80, stock: 200, salesVolume: 1200 },
  { id: 'b4', name: 'Água com Gás', price: 6.00, category: 'Bebidas', cost: 1.20, stock: 150, salesVolume: 600 },

  // DRINKS
  { id: 'd1', name: 'Moscow Mule', price: 35.00, category: 'Drinks', cost: 12.00, stock: 100, salesVolume: 320 },
  { id: 'd2', name: 'Gin Tônica', price: 40.00, category: 'Drinks', cost: 14.00, stock: 80, salesVolume: 215 },
  { id: 'd3', name: 'Negroni', price: 35.00, category: 'Drinks', cost: 13.00, stock: 60, salesVolume: 110 },
  { id: 'd4', name: 'Rooftop Sunset', price: 40.00, category: 'Drinks', cost: 15.00, stock: 40, salesVolume: 145 },
  { id: 'd5', name: 'Caipirinha', price: 25.00, category: 'Drinks', cost: 6.00, stock: 200, salesVolume: 560 }
];