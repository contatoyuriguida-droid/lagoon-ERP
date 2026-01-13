
import React from 'react';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  MonitorPlay, 
  Package, 
  Users, 
  FileCode2,
  Settings as SettingsIcon,
  Printer as PrinterIcon,
  Wifi
} from 'lucide-react';
import { AppSection } from './types.ts';

export const COLORS = {
  primary: '#dc2626', // Red-600
  secondary: '#ffffff', // White
  background: '#f9fafb',
  text: '#111827',
  accent: '#991b1b' // Red-800
};

export const NAVIGATION_ITEMS = [
  { id: AppSection.DASHBOARD, label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: AppSection.POS, label: 'Frente de Caixa (PDV)', icon: <UtensilsCrossed size={20} /> },
  { id: AppSection.KDS, label: 'Cozinha (KDS)', icon: <MonitorPlay size={20} /> },
  { id: AppSection.INVENTORY, label: 'Estoque & Cardápio', icon: <Package size={20} /> },
  { id: AppSection.CRM, label: 'Inteligência & CRM', icon: <Users size={20} /> },
  { id: AppSection.SETTINGS, label: 'Configurações', icon: <SettingsIcon size={20} /> },
  { id: AppSection.ARCHITECT, label: 'Arquitetura', icon: <FileCode2 size={20} /> },
];

export const MOCK_PRODUCTS = [
  { id: '1', name: 'Lagoon Burger', price: 42.00, category: 'Pratos', cost: 12.00, stock: 45, salesVolume: 850 },
  { id: '2', name: 'Batata Rústica', price: 28.00, category: 'Acompanhamentos', cost: 5.50, stock: 120, salesVolume: 920 },
  { id: '3', name: 'Negroni Lagoon', price: 38.00, category: 'Drinks', cost: 14.00, stock: 80, salesVolume: 410 },
  { id: '4', name: 'Filet Mignon au Poivre', price: 89.00, category: 'Pratos', cost: 32.00, stock: 20, salesVolume: 150 },
  { id: '5', name: 'Cerveja Artesanal', price: 18.00, category: 'Bebidas', cost: 7.00, stock: 15, salesVolume: 1200 },
];
