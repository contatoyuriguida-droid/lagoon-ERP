
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
  // ENTRADAS E APERITIVOS
  { id: 'ent-1', name: 'Batata Frita', price: 24.99, category: 'Entradas', cost: 7.50, stock: 50, salesVolume: 120 },
  { id: 'ent-2', name: 'Batata Frita da Casa', price: 39.99, category: 'Entradas', cost: 12.00, stock: 40, salesVolume: 95 },
  { id: 'ent-3', name: 'Bolinho de Feijoada (10un)', price: 29.99, category: 'Entradas', cost: 9.00, stock: 30, salesVolume: 150 },
  { id: 'ent-4', name: 'Pastéis (Sortidos)', price: 29.99, category: 'Entradas', cost: 8.50, stock: 60, salesVolume: 210 },
  { id: 'ent-5', name: 'Pastel de Camarão (10un)', price: 39.99, category: 'Entradas', cost: 14.00, stock: 25, salesVolume: 180 },

  // REFEIÇÕES - 1 PESSOA
  { id: 'ref-1', name: 'Arroz Cremoso Camarão & Alho Poró', price: 39.90, category: 'Refeições', cost: 13.50, stock: 30, salesVolume: 340 },
  { id: 'ref-2', name: 'Contra Filé c/ Fritas', price: 37.90, category: 'Refeições', cost: 12.80, stock: 45, salesVolume: 410 },
  { id: 'ref-3', name: 'Estrogonofe de Camarão', price: 40.00, category: 'Refeições', cost: 14.50, stock: 20, salesVolume: 156 },
  { id: 'ref-4', name: 'Filé de Frango a Parmegiana', price: 36.90, category: 'Refeições', cost: 11.00, stock: 50, salesVolume: 280 },
  { id: 'ref-5', name: 'Frango Empanado ou Grelhado', price: 34.90, category: 'Refeições', cost: 9.50, stock: 40, salesVolume: 145 },
  { id: 'ref-6', name: 'Peixe Frito c/ Molho Camarão', price: 45.00, category: 'Refeições', cost: 16.00, stock: 12, salesVolume: 65 },
  { id: 'ref-7', name: 'Penne ou Talharim', price: 34.99, category: 'Refeições', cost: 8.50, stock: 30, salesVolume: 90 },
  { id: 'ref-8', name: 'Picanha (1 pessoa)', price: 89.00, category: 'Refeições', cost: 28.00, stock: 15, salesVolume: 88 },
  { id: 'ref-9', name: 'Salada Rooftop', price: 29.99, category: 'Refeições', cost: 7.00, stock: 20, salesVolume: 110 },

  // CARTA DE VINHO
  { id: 'vin-1', name: 'Casillero Sauv. Blanc 2024', price: 34.90, category: 'Vinhos', cost: 18.00, stock: 24, salesVolume: 42 },
  { id: 'vin-2', name: 'Reservado Sweet Rosé Suave', price: 59.90, category: 'Vinhos', cost: 28.00, stock: 12, salesVolume: 15 },
  { id: 'vin-3', name: 'Casa Perini Brut Rosé', price: 79.90, category: 'Vinhos', cost: 42.00, stock: 18, salesVolume: 10 },
  { id: 'vin-4', name: 'Casillero Cabernet (Pequena)', price: 34.90, category: 'Vinhos', cost: 16.00, stock: 24, salesVolume: 35 },
  { id: 'vin-5', name: 'Casillero Reserva Malbec 2023', price: 79.90, category: 'Vinhos', cost: 38.00, stock: 12, salesVolume: 12 },
  { id: 'vin-6', name: 'Del Grano Gold Suave (Mini)', price: 24.90, category: 'Vinhos', cost: 11.00, stock: 30, salesVolume: 55 },
  { id: 'vin-7', name: 'Mioranza Tinto Seco (Pequena)', price: 29.90, category: 'Vinhos', cost: 13.00, stock: 24, salesVolume: 28 },
  { id: 'vin-8', name: 'Pérgola Tinto Suave', price: 49.90, category: 'Vinhos', cost: 22.00, stock: 48, salesVolume: 94 },
  { id: 'vin-9', name: 'Reservado Merlot Concha y Toro', price: 59.90, category: 'Vinhos', cost: 28.00, stock: 18, salesVolume: 22 },

  // PRATOS ESPECIAIS
  { id: 'esp-1', name: 'Caldinho de Frutos do Mar', price: 19.99, category: 'Especiais', cost: 6.50, stock: 40, salesVolume: 180 },
  { id: 'esp-2', name: 'Moqueca de Peixe (2 Pessoas)', price: 240.00, category: 'Especiais', cost: 85.00, stock: 10, salesVolume: 32 },
  { id: 'esp-3', name: 'Picanha (2 pessoas)', price: 189.99, category: 'Especiais', cost: 62.00, stock: 15, salesVolume: 45 },
  { id: 'esp-4', name: 'Polvo Grelhado', price: 119.90, category: 'Especiais', cost: 48.00, stock: 8, salesVolume: 24 },

  // PORÇÕES
  { id: 'por-1', name: 'Anéis de Cebola (350g)', price: 29.99, category: 'Porções', cost: 8.00, stock: 40, salesVolume: 85 },
  { id: 'por-2', name: 'Camarão Alho e Óleo (350g)', price: 69.99, category: 'Porções', cost: 24.00, stock: 30, salesVolume: 112 },
  { id: 'por-3', name: 'Camarão Empanado', price: 69.99, category: 'Porções', cost: 25.00, stock: 25, salesVolume: 95 },
  { id: 'por-4', name: 'Frango a Passarinho (1kg)', price: 39.99, category: 'Porções', cost: 14.00, stock: 30, salesVolume: 130 },
  { id: 'por-5', name: 'Iscas Contra Filé Gorgonzola', price: 79.90, category: 'Porções', cost: 28.00, stock: 20, salesVolume: 54 },
  { id: 'por-6', name: 'Iscas Contra Filé Acebolado', price: 79.99, category: 'Porções', cost: 27.00, stock: 22, salesVolume: 68 },
  { id: 'por-7', name: 'Iscas de Frango Empanado', price: 39.99, category: 'Porções', cost: 12.00, stock: 35, salesVolume: 115 },
  { id: 'por-8', name: 'Porção de Lula', price: 79.99, category: 'Porções', cost: 28.00, stock: 15, salesVolume: 42 },
  { id: 'por-9', name: 'Pastel de Lula', price: 39.99, category: 'Porções', cost: 15.00, stock: 20, salesVolume: 38 },
  { id: 'por-10', name: 'Quarteto Sea Angels', price: 169.90, category: 'Porções', cost: 60.00, stock: 12, salesVolume: 20 },
  { id: 'por-11', name: 'Trio Sea Angels', price: 139.99, category: 'Porções', cost: 50.00, stock: 15, salesVolume: 25 },
  { id: 'por-12', name: 'Tábua de Frios', price: 44.99, category: 'Porções', cost: 18.00, stock: 20, salesVolume: 48 },

  // LANCHES E SOBREMESAS
  { id: 'lan-1', name: 'Misto Quente', price: 12.00, category: 'Lanches', cost: 3.50, stock: 50, salesVolume: 90 },
  { id: 'lan-2', name: 'Omelete', price: 17.90, category: 'Lanches', cost: 5.00, stock: 40, salesVolume: 65 },
  { id: 'lan-3', name: 'Sanduíche Natural', price: 16.00, category: 'Lanches', cost: 4.50, stock: 30, salesVolume: 45 },
  { id: 'sob-1', name: 'Banana Split', price: 24.99, category: 'Sobremesas', cost: 7.00, stock: 20, salesVolume: 35 },
  { id: 'sob-2', name: 'Brownie com Sorvete', price: 19.99, category: 'Sobremesas', cost: 6.50, stock: 25, salesVolume: 82 },
  { id: 'sob-3', name: 'Taça de Sorvete', price: 14.99, category: 'Sobremesas', cost: 4.00, stock: 30, salesVolume: 55 },

  // BEBIDAS
  { id: 'beb-1', name: 'Budweiser', price: 15.00, category: 'Bebidas', cost: 6.50, stock: 120, salesVolume: 240 },
  { id: 'beb-2', name: 'Corona', price: 15.00, category: 'Bebidas', cost: 6.80, stock: 96, salesVolume: 180 },
  { id: 'beb-3', name: 'Guaraviton', price: 8.00, category: 'Bebidas', cost: 2.50, stock: 100, salesVolume: 310 },
  { id: 'beb-4', name: 'H2O', price: 8.00, category: 'Bebidas', cost: 2.80, stock: 60, salesVolume: 145 },
  { id: 'beb-5', name: 'Heineken', price: 15.00, category: 'Bebidas', cost: 6.50, stock: 240, salesVolume: 890 },
  { id: 'beb-6', name: 'Redbull', price: 15.00, category: 'Bebidas', cost: 7.50, stock: 80, salesVolume: 210 },
  { id: 'beb-7', name: 'Refrigerantes Diversos', price: 8.00, category: 'Bebidas', cost: 2.80, stock: 300, salesVolume: 1200 },
  { id: 'beb-8', name: 'Sucos', price: 12.00, category: 'Bebidas', cost: 3.50, stock: 100, salesVolume: 450 },
  { id: 'beb-9', name: 'Vitaminas (Estação)', price: 15.00, category: 'Bebidas', cost: 5.00, stock: 40, salesVolume: 65 },
  { id: 'beb-10', name: 'Água Natural', price: 5.00, category: 'Bebidas', cost: 0.80, stock: 200, salesVolume: 780 },
  { id: 'beb-11', name: 'Água com Gás', price: 6.00, category: 'Bebidas', cost: 1.00, stock: 150, salesVolume: 600 },

  // DRINKS
  { id: 'drk-1', name: 'Caipivodka Premium', price: 40.00, category: 'Drinks', cost: 14.00, stock: 100, salesVolume: 85 },
  { id: 'drk-2', name: 'Cosmopolitan', price: 35.00, category: 'Drinks', cost: 12.00, stock: 100, salesVolume: 42 },
  { id: 'drk-3', name: 'Cuba Libre', price: 35.00, category: 'Drinks', cost: 11.00, stock: 100, salesVolume: 95 },
  { id: 'drk-4', name: 'Caipirinha', price: 25.00, category: 'Drinks', cost: 6.00, stock: 200, salesVolume: 560 },
  { id: 'drk-5', name: 'Caipvodka', price: 30.00, category: 'Drinks', cost: 9.00, stock: 150, salesVolume: 410 },
  { id: 'drk-6', name: 'Gin Tropical', price: 40.00, category: 'Drinks', cost: 15.00, stock: 80, salesVolume: 215 },
  { id: 'drk-7', name: 'Gin Tônica', price: 40.00, category: 'Drinks', cost: 14.00, stock: 80, salesVolume: 310 },
  { id: 'drk-8', name: 'Margarita', price: 40.00, category: 'Drinks', cost: 13.00, stock: 60, salesVolume: 48 },
  { id: 'drk-9', name: 'Mojito', price: 35.00, category: 'Drinks', cost: 10.00, stock: 80, salesVolume: 120 },
  { id: 'drk-10', name: 'Moscow Mule', price: 35.00, category: 'Drinks', cost: 12.00, stock: 100, salesVolume: 450 },
  { id: 'drk-11', name: 'Negroni', price: 35.00, category: 'Drinks', cost: 13.00, stock: 60, salesVolume: 110 },
  { id: 'drk-12', name: 'Pina Colada', price: 35.00, category: 'Drinks', cost: 11.00, stock: 80, salesVolume: 88 },
  { id: 'drk-13', name: 'Pink Paradise', price: 40.00, category: 'Drinks', cost: 15.00, stock: 50, salesVolume: 74 },
  { id: 'drk-14', name: 'Rooftop dos Anjos', price: 50.00, category: 'Drinks', cost: 18.00, stock: 40, salesVolume: 150 },
  { id: 'drk-15', name: 'Rooftop dos Sonhos', price: 40.00, category: 'Drinks', cost: 15.00, stock: 40, salesVolume: 95 },
  { id: 'drk-16', name: 'Rooftop Natural', price: 40.00, category: 'Drinks', cost: 14.00, stock: 40, salesVolume: 62 },
  { id: 'drk-17', name: 'Rooftop Sunset', price: 40.00, category: 'Drinks', cost: 15.00, stock: 40, salesVolume: 145 },
  { id: 'drk-18', name: 'Tequila Sunrise', price: 40.00, category: 'Drinks', cost: 14.00, stock: 60, salesVolume: 52 },
  { id: 'drk-19', name: 'Top Green', price: 35.00, category: 'Drinks', cost: 12.00, stock: 60, salesVolume: 34 }
];
