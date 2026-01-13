
import React, { useState } from 'react';
import { AlertCircle, ShoppingCart, TrendingDown, Target, Zap, Trash2, Plus, Save } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Product } from '../types.ts';

interface InventoryProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const Inventory: React.FC<InventoryProps> = ({ products, setProducts }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: 0, cost: 0, category: 'Geral', stock: 0 });

  const bcgData = products.map(p => ({
    name: p.name,
    profit: p.price - p.cost,
    volume: p.salesVolume || 0,
    id: p.id
  }));

  const lowStockCount = products.filter(p => p.stock < 20).length;

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const product: Product = {
      id: `prod-${Date.now()}`,
      name: newProduct.name,
      price: Number(newProduct.price),
      cost: Number(newProduct.cost),
      category: newProduct.category,
      stock: Number(newProduct.stock),
      salesVolume: 0
    };
    setProducts([...products, product]);
    setShowAddModal(false);
    setNewProduct({ name: '', price: 0, cost: 0, category: 'Geral', stock: 0 });
  };

  const updateStock = (id: string, newStock: number) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p));
  };

  const deleteProduct = (id: string) => {
    if (confirm('Deseja realmente excluir este produto?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-8">
      {/* Stock Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex items-center gap-4">
          <div className="p-3 bg-red-600 rounded-xl text-white"><AlertCircle /></div>
          <div>
            <h3 className="text-red-800 font-bold">Estoque Baixo</h3>
            <p className="text-red-600 text-sm">{lowStockCount} itens críticos</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded-xl text-gray-500"><ShoppingCart /></div>
            <div>
              <h3 className="text-gray-800 font-bold">Total Produtos</h3>
              <p className="text-gray-500 text-sm">{products.length} cadastrados</p>
            </div>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-gray-100 rounded-xl text-gray-500"><TrendingDown /></div>
          <div>
            <h3 className="text-gray-800 font-bold">Previsão Demanda</h3>
            <p className="text-gray-500 text-sm">Alta para o FDS</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* BCG Matrix */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
             <div>
               <h2 className="text-lg font-bold">Engenharia de Cardápio</h2>
               <p className="text-xs text-gray-400">Popularidade vs Lucratividade</p>
             </div>
             <Target className="text-red-600" />
          </div>
          <div className="h-80">
             <ResponsiveContainer width="100%" height="100%">
               <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" />
                 <XAxis type="number" dataKey="volume" name="Popularidade" />
                 <YAxis type="number" dataKey="profit" name="Lucro Unitário" />
                 <ZAxis type="number" range={[100, 1000]} />
                 <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                 <Scatter data={bcgData}>
                   {bcgData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.profit > 20 ? (entry.volume > 20 ? '#dc2626' : '#f87171') : '#fca5a5'} />
                   ))}
                   <LabelList dataKey="name" position="top" style={{ fontSize: '10px' }} />
                 </Scatter>
               </ScatterChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Management List */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden max-h-[500px]">
          <h2 className="text-lg font-bold mb-6 flex items-center justify-between">
            Gerenciar Estoque
            <span className="text-xs font-normal text-gray-400">Clique para editar qtd</span>
          </h2>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
             {products.map(p => (
               <div key={p.id} className="p-3 bg-gray-50 rounded-xl flex flex-col gap-2 border border-transparent hover:border-red-100 transition-all">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold truncate pr-2">{p.name}</p>
                    <button onClick={() => deleteProduct(p.id)} className="text-gray-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Quantidade</span>
                    <input 
                      type="number"
                      value={p.stock}
                      onChange={(e) => updateStock(p.id, Number(e.target.value))}
                      className="w-20 bg-white border border-gray-200 rounded px-2 py-0.5 text-xs font-bold text-red-600 outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-bold mb-6 text-red-600">Novo Produto</h3>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Nome do Prato/Bebida</label>
                <input required type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-red-500" placeholder="Ex: Risoto de Camarão" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Preço Venda</label>
                  <input required type="number" step="0.01" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-red-500" placeholder="0.00" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Custo Prod.</label>
                  <input required type="number" step="0.01" value={newProduct.cost} onChange={e => setNewProduct({...newProduct, cost: Number(e.target.value)})} className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-red-500" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Estoque Inicial</label>
                <input required type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})} className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-red-500" placeholder="0" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 py-4 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-100 hover:bg-red-700 transition-all">Salvar Produto</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
