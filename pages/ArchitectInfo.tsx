
import React from 'react';
import { Server, Database, Layers, Cloud, Globe, ShieldCheck, Smartphone, WifiOff } from 'lucide-react';

const ArchitectInfo: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-extrabold text-gray-900 leading-tight">Proposta de Arquitetura <span className="text-red-600">Lagoon GastroBar</span></h2>
        <p className="text-gray-500 text-lg">Sistema Escalável, Resiliente e Offline-First</p>
      </div>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-red-100 pb-2">
           <Layers className="text-red-600" />
           <h3 className="text-xl font-bold">Stack Tecnológica Recomendada</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TechCard 
            title="Frontend (Web & POS)" 
            tech="React 18 + Vite + Tailwind" 
            desc="Alta performance, renderização rápida e interface responsiva para Totens e Desktops."
            icon={<Globe size={24} />}
          />
          <TechCard 
            title="Mobile (Garçons)" 
            tech="React Native + Expo" 
            desc="Desenvolvimento híbrido com performance nativa e acesso rápido ao hardware (Câmera/NFC)."
            icon={<Smartphone size={24} />}
          />
          <TechCard 
            title="Backend" 
            tech="Node.js (TypeScript) + NestJS" 
            desc="Arquitetura modular orientada a serviços com validação de tipos rigorosa."
            icon={<Server size={24} />}
          />
          <TechCard 
            title="Sincronização" 
            tech="PouchDB + CouchDB / WatermelonDB" 
            desc="Capacidade Offline-First. O PDV continua operando sem internet e sincroniza ao reconectar."
            icon={<WifiOff size={24} />}
          />
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-red-100 pb-2">
           <Database className="text-red-600" />
           <h3 className="text-xl font-bold">Modelagem de Dados (Principais Tabelas)</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <code className="text-sm text-gray-700 whitespace-pre">
{`-- Tabelas Nucleares
users (id, name, role_id, pin_hash)
tables (id, number, status_id, current_order_id)
products (id, name, category_id, base_price, cost_price, is_active)
ingredients (id, name, unit_id, stock_alert_min)
product_ingredients (product_id, ingredient_id, quantity) -- Ficha Técnica

-- Operação
orders (id, table_id, customer_id, total_amount, status_id, type_id) -- Local/Delivery
order_items (id, order_id, product_id, quantity, notes, status_id, split_id)
transactions (id, order_id, payment_method_id, amount, fiscal_key)

-- CRM
customers (id, name, phone, email, birth_date)
loyalty_points (id, customer_id, points_balance, expiry_date)`}
          </code>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-red-100 pb-2">
           <ShieldCheck className="text-red-600" />
           <h3 className="text-xl font-bold">Endpoints Estratégicos (API)</h3>
        </div>
        <div className="space-y-2">
           <EndpointItem method="POST" path="/v1/orders/close" desc="Processa o fechamento, emite NFC-e e abate estoque." />
           <EndpointItem method="PATCH" path="/v1/tables/:id/transfer" desc="Transfere comandas entre mesas." />
           <EndpointItem method="GET" path="/v1/reports/menu-engineering" desc="Calcula matriz BCG em tempo real." />
           <EndpointItem method="POST" path="/v1/integrations/ifood/sync" desc="Webhooks para pedidos de delivery." />
        </div>
      </section>

      <div className="bg-red-600 p-8 rounded-3xl text-white shadow-2xl shadow-red-200">
         <h4 className="text-2xl font-bold mb-4">Conclusão do Consultor</h4>
         <p className="leading-relaxed opacity-90">
           Para o <strong>Lagoon GastroBar</strong>, o foco principal deve ser a latência zero no PDV e a resiliência à queda de internet. 
           A escolha por <em>PouchDB/WatermelonDB</em> garante que a operação de salão nunca pare. O monitoramento KDS deve 
           operar via WebSockets para feedback instantâneo entre salão e cozinha.
         </p>
      </div>
    </div>
  );
};

const TechCard = ({ title, tech, desc, icon }: { title: string, tech: string, desc: string, icon: React.ReactNode }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-red-200 transition-colors">
    <div className="text-red-600 mb-4">{icon}</div>
    <h4 className="font-bold text-gray-900">{title}</h4>
    <p className="text-red-600 text-sm font-semibold mb-2">{tech}</p>
    <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
  </div>
);

const EndpointItem = ({ method, path, desc }: { method: string, path: string, desc: string }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
    <span className={`px-2 py-1 rounded font-bold text-[10px] w-fit ${
      method === 'POST' ? 'bg-green-100 text-green-700' : 
      method === 'GET' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
    }`}>{method}</span>
    <code className="text-xs font-mono text-gray-800 flex-1">{path}</code>
    <span className="text-xs text-gray-500">{desc}</span>
  </div>
);

export default ArchitectInfo;
