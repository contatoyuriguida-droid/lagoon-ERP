
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
  ChevronRight,
  CloudUpload,
  Check,
  Star,
  Flame,
  Search,
  HelpCircle,
  Skull
} from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { GoogleGenAI, Type } from "@google/genai";
import { Product } from '../types.ts';
import { MOCK_PRODUCTS } from '../constants.tsx';

interface InventoryProps {
  products: Product[];
  onSaveProduct: (p: Product) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onMigrateAll: () => Promise<void>;
}

const Inventory: React.FC<InventoryProps> = ({ products, onSaveProduct, onDeleteProduct, onMigrateAll }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [menuText, setMenuText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("TODOS");
  
  const [formData, setFormData] = useState({ 
    name: '', 
    price: 0, 
    cost: 0, 
    category: 'Geral', 
    stock: 50 
  });

  const isUsingMocks = products.length === MOCK_PRODUCTS.length && products.every((p, i) => p.id === MOCK_PRODUCTS[i].id);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category)));
    return cats.sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "TODOS") return [...products].sort((a,b) => a.stock - b.stock);
    return products
      .filter(p => p.category === selectedCategory)
      .sort((a,b) => a.stock - b.stock);
  }, [products, selectedCategory]);

  // CÁLCULOS DA ENGENHARIA DE CARDÁPIO
  const analysisData = useMemo(() => {
    const data = products.map(p => ({
      name: p.name,
      profit: p.price - (p.cost || 0),
      volume: p.salesVolume || 0,
      category: p.category
    }));

    const avgProfit = data.reduce((acc, curr) => acc + curr.profit, 0) / (data.length || 1);
    const avgVolume = data.reduce((acc, curr) => acc + curr.volume, 0) / (data.length || 1);

    return { data, avgProfit, avgVolume };
  }, [products]);

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

  const handleManualSync = async () => {
    setIsMigrating(true);
    try {
      await onMigrateAll();
      alert("Sincronização concluída!");
    } catch (e) {
      alert("Erro ao sincronizar.");
    } finally {
      setIsMigrating(false);
    }
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
        contents: `Analise este cardápio e retorne JSON: ${menuText}`,
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
        await onSaveProduct({
          id: `prod-ai-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: item.name, price: item.price, category: item.category, cost: item.cost, stock: 50, salesVolume: 0
        });
      }
      setShowAIModal(false);
      setMenuText("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 animate-in zoom-in-95">
          <p className="text-[10px] font-black uppercase text-red-600 mb-1">{data.category}</p>
          <p className="font-black text-gray-900 mb-2">{data.name}</p>
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-gray-400 uppercase">Lucro: <span className="text-gray-900">R$ {data.profit.toFixed(2)}</span></p>
            <p className="text-[9px] font-bold text-gray-400 uppercase">Vendas: <span className="text-gray-900">{data.volume} un</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* Alerta de Sincronismo */}
      {isUsingMocks && (
        <div className="bg-red-600 p-6 rounded-[32px] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-red-100 animate-in slide-in-from-top-4 duration-500">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl"><CloudUpload /></div>
              <div>
                 <h3 className="text-sm font-black uppercase tracking-widest leading-none mb-1">Cardápio Local</h3>
                 <p className="text-[10px] font-medium opacity-80 uppercase tracking-tighter">O cardápio padrão ainda não está na nuvem.</p>
              </div>
           </div>
           <button onClick={handleManualSync} disabled={isMigrating} className="px-8 py-3 bg-white text-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2">
             {isMigrating ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
             {isMigrating ? 'SINCRONIZANDO...' : 'Sincronizar Agora'}
           </button>
        </div>
      )}

      {/* Métricas e Ações */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 p-6 rounded-3xl border border-red-100 flex items-center gap-4">
          <div className="p-3 bg-red-600 rounded-2xl text-white"><AlertCircle /></div>
          <div><h3 className="text-red-800 font-black uppercase text-[10px] tracking-widest">Estoque Crítico</h3><p className="text-red-600 font-black text-xl">{lowStockCount} itens</p></div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-50 text-gray-400 rounded-2xl"><ShoppingCart /></div>
            <div><h3 className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Mix Total</h3><p className="text-gray-900 font-black text-xl">{products.length} itens</p></div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAIModal(true)} className="p-3 bg-red-600 text-white rounded-xl shadow-lg shadow-red-100"><Sparkles size={20} /></button>
            <button onClick={() => setShowAddModal(true)} className="p-3 bg-gray-900 text-white rounded-xl hover:scale-110 transition-all"><Plus size={20} /></button>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-gray-50 text-gray-400 rounded-2xl"><TrendingDown /></div>
          <div><h3 className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Ticket Médio (Est.)</h3><p className="text-gray-900 font-black text-sm uppercase">R$ {(products.reduce((acc, p) => acc + p.price, 0) / (products.length || 1)).toFixed(2)}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ENGENHARIA DE CARDÁPIO REDESENHADA */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <div>
                 <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Matriz de Performance</h2>
                 <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Engenharia de Cardápio BCG (Lucratividade vs Popularidade)</p>
               </div>
               <div className="flex gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl text-[9px] font-black text-gray-400 uppercase">
                    Média Lucro: R$ {analysisData.avgProfit.toFixed(2)}
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl text-[9px] font-black text-gray-400 uppercase">
                    Média Vendas: {analysisData.avgVolume.toFixed(0)} un
                  </div>
               </div>
            </div>

            <div className="h-[400px] relative">
               {/* Rótulos dos Quadrantes (Background) */}
               <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none opacity-[0.03]">
                  <div className="border-r border-b border-gray-900 flex items-center justify-center font-black text-4xl uppercase tracking-widest">Estrelas</div>
                  <div className="border-b border-gray-900 flex items-center justify-center font-black text-4xl uppercase tracking-widest">Desafios</div>
                  <div className="border-r border-gray-900 flex items-center justify-center font-black text-4xl uppercase tracking-widest">Volume</div>
                  <div className="flex items-center justify-center font-black text-4xl uppercase tracking-widest">Cães</div>
               </div>

               <ResponsiveContainer width="100%" height="100%">
                 <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                   <XAxis type="number" dataKey="volume" name="Vendas" hide />
                   <YAxis type="number" dataKey="profit" name="Lucro" hide />
                   <ZAxis type="number" range={[150, 150]} />
                   <Tooltip content={<CustomTooltip />} />
                   
                   {/* Linhas de Corte */}
                   <ReferenceLine x={analysisData.avgVolume} stroke="#e5e7eb" strokeWidth={2} strokeDasharray="5 5" />
                   <ReferenceLine y={analysisData.avgProfit} stroke="#e5e7eb" strokeWidth={2} strokeDasharray="5 5" />

                   <Scatter data={analysisData.data}>
                     {analysisData.data.map((entry, index) => {
                       const isHighProfit = entry.profit >= analysisData.avgProfit;
                       const isHighVolume = entry.volume >= analysisData.avgVolume;
                       
                       let color = "#9ca3af"; // Cão (Cinza)
                       if (isHighProfit && isHighVolume) color = "#dc2626"; // Estrela (Vermelho)
                       if (isHighProfit && !isHighVolume) color = "#3b82f6"; // Quebra-cabeça (Azul)
                       if (!isHighProfit && isHighVolume) color = "#f97316"; // Cavalo de Batalha (Laranja)

                       return <Cell key={`cell-${index}`} fill={color} className="cursor-pointer hover:opacity-80 transition-opacity" />;
                     })}
                   </Scatter>
                 </ScatterChart>
               </ResponsiveContainer>
            </div>

            {/* Legenda Estratégica */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10">
               <LegendItem color="bg-red-600" icon={<Star size={12}/>} label="Estrelas" desc="Alta Margem/Volume" />
               <LegendItem color="bg-orange-500" icon={<Flame size={12}/>} label="Cavalos" desc="Famosos/Baixo Lucro" />
               <LegendItem color="bg-blue-500" icon={<HelpCircle size={12}/>} label="Enigmas" desc="Lucrativos/Pouca Saída" />
               <LegendItem color="bg-gray-400" icon={<Skull size={12}/>} label="Cães" desc="Baixo Giro/Lucro" />
            </div>
          </div>
        </div>

        {/* Lista de Estoque Lateral */}
        <div className="bg-white p-8 rounded-[48px] border border-gray-100 shadow-sm flex flex-col overflow-hidden h-[680px]">
          <div className="flex items-center justify-between mb-6">
             <h2 className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                <Zap size={14} className="text-red-600" /> Gestão de Giro
             </h2>
             <span className="text-[9px] font-black text-gray-300">{filteredProducts.length} itens</span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
             <button onClick={() => setSelectedCategory("TODOS")} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase transition-all ${selectedCategory === "TODOS" ? 'bg-red-600 text-white' : 'bg-gray-50 text-gray-400'}`}>TODOS</button>
             {categories.map(cat => (
               <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase transition-all ${selectedCategory === cat ? 'bg-red-600 text-white' : 'bg-gray-50 text-gray-400'}`}>{cat}</button>
             ))}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
             {filteredProducts.map(p => (
               <div key={p.id} className="p-4 bg-gray-50 rounded-2xl flex flex-col gap-2 border border-transparent hover:border-red-100 transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 truncate">
                      <p className="text-[11px] font-black text-gray-800 uppercase truncate leading-none mb-1">{p.name}</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{p.category}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => handleOpenEdit(p)} className="p-2 text-gray-400 hover:text-red-600"><Pencil size={14} /></button>
                      <button onClick={() => onDeleteProduct(p.id)} className="p-2 text-gray-300 hover:text-red-600"><Trash2 size={14} /></button>
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
          </div>
        </div>
      </div>

      {/* MODAL IA IMPORTADOR */}
      {showAIModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-xl p-6">
          <div className="bg-white rounded-[40px] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
             <div className="w-16 h-16 bg-red-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-100">
               <Sparkles size={32} />
             </div>
             <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-2">Importador Mágico</h3>
             <p className="text-xs text-gray-400 font-medium mb-8 uppercase tracking-widest">Cole seu menu e deixe a IA trabalhar</p>
             <textarea value={menuText} onChange={(e) => setMenuText(e.target.value)} placeholder="Ex: Picanha R$ 89,90..." className="w-full h-48 p-6 bg-gray-50 rounded-3xl border-none outline-none font-bold text-sm text-gray-800 mb-6 resize-none shadow-inner" />
             <div className="flex gap-4">
                <button onClick={processMenuWithAI} disabled={isProcessingAI || !menuText.trim()} className="flex-1 py-5 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-100 uppercase text-xs tracking-widest flex items-center justify-center gap-3">
                   {isProcessingAI ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                   {isProcessingAI ? 'ANALISANDO...' : 'PROCESSAR AGORA'}
                </button>
                <button onClick={() => setShowAIModal(false)} className="px-8 py-5 bg-gray-100 text-gray-400 font-black rounded-2xl uppercase text-xs">SAIR</button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR / EDITAR */}
      {(showAddModal || editingProduct) && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
          <div className="bg-white rounded-[40px] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-gray-900 uppercase mb-8">{editingProduct ? 'Editar Item' : 'Novo Produto'}</h3>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold outline-none shadow-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Categoria</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold outline-none shadow-sm appearance-none">
                  <option value="Geral">Geral</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Venda (R$)</label>
                  <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold outline-none shadow-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Custo (R$)</label>
                  <input required type="number" step="0.01" value={formData.cost} onChange={e => setFormData({...formData, cost: Number(e.target.value)})} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold outline-none shadow-sm" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Estoque</label>
                <input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold outline-none shadow-sm" />
              </div>
              <div className="flex gap-3 pt-6">
                <button type="submit" className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-100 text-xs uppercase tracking-widest">SALVAR</button>
                <button type="button" onClick={() => { setShowAddModal(false); setEditingProduct(null); }} className="px-6 py-4 bg-gray-100 text-gray-400 font-bold rounded-2xl text-[10px] uppercase">CANCELAR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const LegendItem = ({ color, icon, label, desc }: any) => (
  <div className="flex flex-col gap-1.5 group">
     <div className="flex items-center gap-2">
        <div className={`w-4 h-4 ${color} rounded-lg flex items-center justify-center text-white`}>{icon}</div>
        <span className="text-[10px] font-black text-gray-900 uppercase tracking-tighter">{label}</span>
     </div>
     <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter leading-none">{desc}</p>
  </div>
);

export default Inventory;
