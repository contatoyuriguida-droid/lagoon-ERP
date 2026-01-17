import React, { useState, useMemo } from 'react';
import { 
  AlertCircle, 
  ShoppingCart, 
  TrendingDown, 
  Target, 
  Zap, 
  Trash2, 
  Plus, 
  Save, 
  Sparkles, 
  X, 
  Wand2, 
  Loader2, 
  Pencil, 
  Filter,
  ChevronRight
} from 'lucide-react';
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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [menuText, setMenuText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("TODOS");
  
  const [formData, setFormData] = useState({ 
    name: '', 
    price: 0, 
    cost: 0, 
    category: 'Geral', 
    stock: 50 
  });

  // Extrair categorias únicas para o filtro e para o select
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category)));
    return cats.sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "TODOS") return products.sort((a,b) => a.stock - b.stock);
    return products
      .filter(p => p.category === selectedCategory)
      .sort((a,b) => a.stock - b.stock);
  }, [products, selectedCategory]);

  const bcgData = products.map(p => ({
    name: p.name,
    profit: p.price - (p.cost || 0),
    volume: p.salesVolume || 0,
    id: p.id
  }));

  const lowStockCount = products.filter(p => p.stock < 20).length;

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      cost: product.cost || 0,
      category: product.category,
      stock: product.stock
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const product: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      name: formData.name,
      price: Number(formData.price),
      cost: Number(formData.cost),
      category: formData.category,
      stock: Number(formData.stock),
      salesVolume: editingProduct ? editingProduct.salesVolume : 0
    };
    
    await onSaveProduct(product);
    setShowAddModal(false);
    setEditingProduct(null);
    setFormData({ name: '', price: 0, cost: 0, category: 'Geral', stock: 50 });
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
        4. Retorne apenas o JSON puro.`,
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
      alert("Erro ao processar cardápio via IA.");
    } finally {
      setIsProcessingAI(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
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
              <h3 className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Mix Total</h3>
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
            <h3 className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Ticket Médio (Est.)</h3>
            <p className="text-gray-900 font-black text-sm uppercase">R$ {(products.reduce((acc, p) => acc + p.price, 0) / products.length || 0).toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Matriz BCG */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-10">
             <div>
               <h2 className="text-xl font-black text-gray-900">Engenharia de Cardápio</h2>
               <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Análise de Performance (Lucro x Volume)</p>
             </div>
             <Target className="text-red-600" />
          </div>
          <div className="h-80">
             <ResponsiveContainer width="100%" height="100%">
               <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                 <XAxis type="number" dataKey="volume" name="Vendas" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#9ca3af'}} />
                 <YAxis type="number" dataKey="profit" name="Lucro Unit." axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#9ca3af'}} />
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

        {/* Lista de Itens com Filtro */}
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col overflow-hidden h-[600px]">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                <Zap size={14} className="text-red-600" /> Itens de Estoque
             </h2>
             <span className="text-[9px] font-black text-gray-300">{filteredProducts.length} itens</span>
          </div>

          {/* Filtro por Categoria */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-2 custom-scrollbar no-scrollbar">
             <button 
                onClick={() => setSelectedCategory("TODOS")}
                className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase whitespace-nowrap transition-all ${selectedCategory === "TODOS" ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:text-red-600'}`}
             >
                TODOS
             </button>
             {categories.map(cat => (
               <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:text-red-600'}`}
               >
                  {cat}
               </button>
             ))}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
             {filteredProducts.map(p => (
               <div key={p.id} className="p-4 bg-gray-50 rounded-2xl flex flex-col gap-2 border border-transparent hover:border-red-100 transition-all group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-black text-gray-800 uppercase truncate pr-2 leading-none mb-1">{p.name}</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{p.category}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => handleOpenEdit(p)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => onDeleteProduct(p.id)} className="p-2 text-gray-300 hover:text-red-600 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-red-600 font-black text-xs">R$ {p.price.toFixed(2)}</span>
                    <div className={`px-3 py-1 rounded-full text-[9px] font-black ${p.stock < 20 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-green-100 text-green-600'}`}>
                      {p.stock} UN
                    </div>
                  </div>
               </div>
             ))}
             {filteredProducts.length === 0 && (
               <div className="flex flex-col items-center justify-center py-20 opacity-20">
                  <Filter size={40} className="mb-2" />
                  <p className="text-[10px] font-black uppercase">Nenhum item nesta categoria</p>
               </div>
             )}
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
               Nossa IA identificará pratos, preços e categorias automaticamente. Cole o texto do seu menu abaixo.
             </p>

             <textarea 
                value={menuText}
                onChange={(e) => setMenuText(e.target.value)}
                placeholder="Ex: Picanha Grelhada R$ 89,90... "
                className="w-full h-48 p-6 bg-gray-50 rounded-3xl border-none outline-none font-bold text-sm text-gray-800 focus:ring-2 focus:ring-red-600 mb-6 placeholder:text-gray-300 resize-none shadow-inner"
             />

             <button 
                onClick={processMenuWithAI}
                disabled={isProcessingAI || !menuText.trim()}
                className="w-full py-5 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-100 uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-50 transition-all hover:scale-[1.02]"
             >
                {isProcessingAI ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                {isProcessingAI ? 'PROCESSANDO CARDÁPIO...' : 'CADASTRAR ITENS'}
             </button>
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR / EDITAR PRODUTO */}
      {(showAddModal || editingProduct) && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
          <div className="bg-white rounded-[40px] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                 <div className="p-3 bg-red-600 text-white rounded-2xl"><Save size={20} /></div>
                 <h3 className="text-xl font-black text-gray-900 uppercase">{editingProduct ? 'Editar Item' : 'Novo Produto'}</h3>
              </div>
              <button onClick={() => { setShowAddModal(false); setEditingProduct(null); }} className="p-2 bg-gray-50 text-gray-400 rounded-xl"><X size={20} /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Produto</label>
                <input 
                  required 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-red-600 shadow-sm" 
                  placeholder="Ex: Picanha na Chapa"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Categoria</label>
                <div className="relative">
                  <select 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-red-600 shadow-sm appearance-none"
                  >
                    <option value="Geral">Geral</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="NOVA">+ Adicionar Nova Categoria</option>
                  </select>
                  <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 rotate-90" />
                </div>
                {formData.category === "NOVA" && (
                   <input 
                    autoFocus
                    type="text" 
                    placeholder="Nome da nova categoria..." 
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full mt-2 p-4 bg-red-50 rounded-2xl border-2 border-red-100 font-bold outline-none text-red-600 placeholder:text-red-200"
                   />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Preço (Venda)</label>
                  <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold outline-none shadow-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Custo (CMV)</label>
                  <input required type="number" step="0.01" value={formData.cost} onChange={e => setFormData({...formData, cost: Number(e.target.value)})} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold outline-none shadow-sm" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Quantidade em Estoque</label>
                <input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold outline-none shadow-sm" />
              </div>

              <div className="flex gap-3 pt-6">
                <button type="submit" className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-100 text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all">
                  {editingProduct ? 'ATUALIZAR' : 'SALVAR'}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setShowAddModal(false); setEditingProduct(null); }} 
                  className="px-6 py-4 bg-gray-100 text-gray-400 font-bold rounded-2xl text-[10px] uppercase tracking-widest"
                >
                  FECHAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;