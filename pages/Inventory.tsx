import React, { useState } from 'react';
import { AlertCircle, ShoppingCart, TrendingDown, Target, Zap, Trash2, Plus, Save, Sparkles, X, Wand2, Loader2 } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { GoogleGenAI, Type } from "@google/genai";
import { Product } from '../types.ts';

interface InventoryProps {
  products: Product[];
  onSaveProduct: (p: Product) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
}

const Inventory: React.FC<InventoryProps> = ({ products, onSaveProduct, onDeleteProduct }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [menuText, setMenuText] = useState("");
  const [newProduct, setNewProduct] = useState({ name: '', price: 0, cost: 0, category: 'Geral', stock: 50 });

  const bcgData = products.map(p => ({
    name: p.name,
    profit: p.price - (p.cost || 0),
    volume: p.salesVolume || 0,
    id: p.id
  }));

  const lowStockCount = products.filter(p => p.stock < 20).length;

  const handleAddProduct = async (e: React.FormEvent) => {
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
    await onSaveProduct(product);
    setShowAddModal(false);
    setNewProduct({ name: '', price: 0, cost: 0, category: 'Geral', stock: 50 });
  };

  const processMenuWithAI = async () => {
    if (!menuText.trim()) return;
    setIsProcessingAI(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analise este texto de cardápio e extraia uma lista de produtos estruturada. 
        Texto: ${menuText}
        
        Regras:
        1. Identifique nome, preço e categoria.
        2. Estime o custo de produção como 30% do preço de venda se não for óbvio.
        3. Stock padrão é 50.
        4. Retorne apenas o JSON.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                price: { type: Type.NUMBER },
                category: { type: Type.STRING },
                cost: { type: Type.NUMBER }
              },
              required: ["name", "price", "category", "cost"]
            }
          }
        }
      });

      const parsedItems = JSON.parse(response.text);
      
      for (const item of parsedItems) {
        const product: Product = {
          id: `prod-ai-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: item.name,
          price: item.price,
          category: item.category,
          cost: item.cost,
          stock: 50,
          salesVolume: 0
        };
        await onSaveProduct(product);
      }

      setShowAIModal(false);
      setMenuText("");
      alert(`${parsedItems.length} produtos importados com sucesso!`);
    } catch (error) {
      console.error("Erro no processamento IA:", error);
      alert("Erro ao processar cardápio. Verifique o formato do texto.");
    } finally {
      setIsProcessingAI(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Alertas e Ações */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 p-6 rounded-3xl border border-red-100 flex items-center gap-4">
          <div className="p-3 bg-red-600 rounded-2xl text-white shadow-lg"><AlertCircle /></div>
          <div>
            <h3 className="text-red-800 font-black uppercase text-[10px] tracking-widest">Estoque Crítico</h3>
            <p className="text-red-600 font-black text-xl">{lowStockCount} itens</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between gap-4 group hover:border-red-600 transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-50 text-gray-400 rounded-2xl group-hover:bg-red-50 group-hover:text-red-600 transition-colors"><ShoppingCart /></div>
            <div>
              <h3 className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Mix de Produtos</h3>
              <p className="text-gray-900 font-black text-xl">{products.length} itens</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowAIModal(true)}
              className="p-3 bg-red-600 text-white rounded-xl hover:scale-110 transition-all shadow-lg shadow-red-100"
              title="Importar via IA"
            >
              <Sparkles size={20} />
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="p-3 bg-gray-900 text-white rounded-xl hover:scale-110 transition-all"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-gray-50 text-gray-400 rounded-2xl"><TrendingDown /></div>
          <div>
            <h3 className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Ruptura Provável</h3>
            <p className="text-gray-900 font-black text-sm uppercase">Cerveja Artesanal (FDS)</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-10">
             <div>
               <h2 className="text-xl font-black text-gray-900">Engenharia de Cardápio</h2>
               <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Análise de Performance (Matriz BCG)</p>
             </div>
             <Target className="text-red-600" />
          </div>
          <div className="h-80">
             <ResponsiveContainer width="100%" height="100%">
               <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                 <XAxis type="number" dataKey="volume" name="Popularidade" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#9ca3af'}} />
                 <YAxis type="number" dataKey="profit" name="Lucro" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#9ca3af'}} />
                 <ZAxis type="number" range={[100, 1000]} />
                 <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                 <Scatter data={bcgData}>
                   {bcgData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.profit > 20 ? (entry.volume > 20 ? '#dc2626' : '#f87171') : '#fca5a5'} />
                   ))}
                   <LabelList dataKey="name" position="top" style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase' }} />
                 </Scatter>
               </ScatterChart>
             </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col overflow-hidden max-h-[500px]">
          <h2 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-6 flex items-center justify-between">
            Estoque em Tempo Real
            <Zap size={14} className="text-red-600" />
          </h2>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
             {products.sort((a,b) => a.stock - b.stock).map(p => (
               <div key={p.id} className="p-4 bg-gray-50 rounded-2xl flex flex-col gap-2 border border-transparent hover:border-red-100 transition-all group">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-black text-gray-800 uppercase truncate pr-2">{p.name}</p>
                    <button onClick={() => onDeleteProduct(p.id)} className="text-gray-300 hover:text-red-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] text-gray-400 uppercase font-black tracking-widest">Qtd Atual</span>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black ${p.stock < 20 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {p.stock} UN
                    </div>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* MODAL IA IMPORTADOR */}
      {showAIModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-xl p-6">
          <div className="bg-white rounded-[40px] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-red-600 text-white rounded-2xl"><Sparkles size={24} /></div>
                   <h3 className="text-xl font-black text-gray-900 uppercase">Importar com IA</h3>
                </div>
                <button onClick={() => setShowAIModal(false)} className="p-2 bg-gray-50 text-gray-400 rounded-xl"><X size={20} /></button>
             </div>

             <p className="text-xs text-gray-500 font-medium mb-6 leading-relaxed">
               Cole abaixo o texto bruto do seu cardápio. Nossa IA irá identificar pratos, preços e categorias automaticamente.
             </p>

             <textarea 
                value={menuText}
                onChange={(e) => setMenuText(e.target.value)}
                placeholder="Ex: Picanha na chapa R$ 89,90... Coca Cola lata 350ml R$ 6.00... "
                className="w-full h-48 p-6 bg-gray-50 rounded-3xl border-none outline-none font-bold text-sm text-gray-800 focus:ring-2 focus:ring-red-600 mb-6 placeholder:text-gray-300 resize-none"
             />

             <button 
                onClick={processMenuWithAI}
                disabled={isProcessingAI || !menuText.trim()}
                className="w-full py-5 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-100 uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-50 transition-all hover:scale-[1.02]"
             >
                {isProcessingAI ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                {isProcessingAI ? 'ANALISANDO CARDÁPIO...' : 'PROCESSAR E CADASTRAR'}
             </button>
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR MANUAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black mb-6 text-red-600 uppercase">Novo Produto</h3>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Item</label>
                <input required type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-red-600" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Preço Venda</label>
                  <input required type="number" step="0.01" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Custo</label>
                  <input required type="number" step="0.01" value={newProduct.cost} onChange={e => setNewProduct({...newProduct, cost: Number(e.target.value)})} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold outline-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Estoque Inicial</label>
                <input required type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold outline-none" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl shadow-lg shadow-red-100 text-xs uppercase tracking-widest">Salvar</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-400 font-bold rounded-2xl text-xs uppercase tracking-widest">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;