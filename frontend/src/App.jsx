import React, { useState, useCallback } from 'react';
import { ReactFlow, Background, Controls, Handle, Position, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// --- CONFIGURAÇÃO DA REDE ---
const companies = [
  { id: "padaria", label: "Padaria Aliança", icon: "🍞" },
  { id: "servicos", label: "Serviços Tech", icon: "💻" },
  { id: "agro", label: "AgroFértil", icon: "🌱" },
  { id: "logistica", label: "Transportadora", icon: "🚛" }
];

const vulnerabilities = [
  { source: "padaria", target: "servicos", weight: 0.15 },
  { source: "agro", target: "padaria", weight: 0.5 },
  { source: "servicos", target: "agro", weight: 0.1 },
  { source: "logistica", target: "agro", weight: 0.4 },
  { source: "agro", target: "logistica", weight: 0.1 },
  { source: "logistica", target: "servicos", weight: 0.2 },
];

// --- 1. COMPONENTE DE NÓ (Com barra de saúde) ---
const CompanyNode = ({ data }) => {
  const healthPercent = Math.max(0, 100 - (data.stress * 100));
  const dynamicColor = `rgb(${Math.min(255, 255 - healthPercent * 2.5)}, ${Math.min(255, healthPercent * 2.5)}, 0)`;

  return (
    <div className="bg-fintech_panel border-2 border-gray-700 rounded-xl p-4 w-56 shadow-lg">
      <Handle type="target" position={Position.Top} className="w-12 h-2 !bg-gray-400 border-none rounded-none" />
      
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{data.icon}</span>
          <h3 className="text-md font-bold text-gray-100">{data.label}</h3>
        </div>
        {data.isOrigin && <span className="text-xs font-bold text-white bg-red-600 px-2 py-1 rounded">Origem</span>}
      </div>

      <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden mt-3">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${healthPercent}%`, backgroundColor: dynamicColor }}></div>
      </div>
      <p className="text-right text-xs mt-1 font-mono text-gray-400">Saúde: {healthPercent.toFixed(0)}%</p>

      <Handle type="source" position={Position.Bottom} className="w-12 h-2 !bg-gray-400 border-none rounded-none" />
    </div>
  );
};

// --- 2. CONFIGURAÇÃO INICIAL (Com Setas Direcionais Gigantes) ---
const nodeTypes = { company: CompanyNode };

const initialNodes = companies.map((c, i) => ({
  id: c.id,
  position: { x: (i % 2) * 400 + 50, y: Math.floor(i / 2) * 300 + 50 },
  data: { label: c.label, icon: c.icon, stress: 0, isOrigin: false },
  type: 'company',
}));

const initialEdges = vulnerabilities.map(v => ({
  id: `${v.source}-${v.target}`,
  source: v.source,
  target: v.target,
  label: `${(v.weight * 100).toFixed(0)}%`,
  style: { stroke: '#6B7280', strokeWidth: 2 }, 
  labelStyle: { fill: '#F9FAFB', fontWeight: 'bold', fontSize: 14 },
  labelBgStyle: { fill: '#1F2937', fillOpacity: 0.8, rx: 4, ry: 4 },
  // AQUI DEFINIMOS A SETA DIRECIONAL VISÍVEL
  markerEnd: { 
    type: MarkerType.ArrowClosed, 
    width: 20, 
    height: 20, 
    color: '#6B7280' 
  },
  animated: false
}));

// --- 3. COMPONENTE PRINCIPAL (Layout Fullscreen) ---
function App() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [selectedCompanyId, setSelectedCompanyId] = useState(companies[0].id);
  const [shockIntensity, setShockIntensity] = useState(0.3);
  const [systemicScore, setSystemicScore] = useState(0);
  const [results, setResults] = useState({});
  const [hasRun, setHasRun] = useState(false);

  const calculateSystemicRisk = async () => {
    console.log("1. Botão clicado! Preparando o pacote...");
    try {
      console.log(`2. Disparando requisição para: http://127.0.0.1:8080/debt_rank`);
      console.log(`Enviando dados:`, { company_name: selectedCompanyId, intensity: shockIntensity });
      
      const response = await fetch('http://127.0.0.1:8080/debt_rank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: selectedCompanyId, intensity: shockIntensity }),
      });

      console.log("3. A API atendeu a porta! Status da resposta:", response.status);
      
      const data = await response.json();
      console.log("4. Resposta decodificada do Python:", data);

      if (data.error) {
        alert("Erro da API: " + data.error);
        return;
      }

      setSystemicScore(data.risco_sistemico_total);
      setResults(data.impacto_nas_empresas);
      setHasRun(true);

      // Atualiza os Nós
      setNodes((nds) => nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          stress: data.impacto_nas_empresas[node.id] || 0,
          isOrigin: node.id === selectedCompanyId,
        },
      })));

      // Atualiza as Setas
      setEdges((eds) => eds.map((edge) => {
        const sourceStress = data.impacto_nas_empresas[edge.source] || 0;
        const edgeColor = sourceStress > 0 ? '#EF4444' : '#6B7280';
        return {
          ...edge,
          style: { stroke: edgeColor, strokeWidth: sourceStress > 0 ? 3 : 2 }, 
          markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: edgeColor },
          animated: sourceStress > 0,
        }
      }));

      console.log("5. Mágica visual aplicada com sucesso!");

    } catch (error) {
      console.error('Falha na requisição. O servidor caiu ou bloqueou a entrada:', error);
      alert("Falha na comunicação com o Python. Verifique o console.");
    }
  };

  return (
    // Container Pai ocupando 100% da tela rigorosamente
    <div className="w-screen h-screen bg-fintech_blue flex flex-col font-sans overflow-hidden">
      
      {/* Header Fixo */}
      <header className="h-16 flex-none flex items-center justify-between px-6 border-b border-gray-800 bg-fintech_panel z-50">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold text-fintech_yellow">QI Tech</div>
          <div className="h-6 w-px bg-gray-600 mx-2"></div>
          <h1 className="text-lg text-gray-300">Monitor de Contágio B2B</h1>
        </div>
      </header>

      {/* Corpo Dividido (Barra Lateral + Grafo) */}
      <main className="flex-grow flex w-full h-full overflow-hidden">
        
        {/* Painel Esquerdo (Controles e Resultados) - Ocupa 30% da tela */}
        <aside className="w-[30%] min-w-[350px] max-w-[450px] h-full bg-fintech_panel border-r border-gray-800 p-6 flex flex-col gap-6 overflow-y-auto z-10 shadow-2xl">
          
          <div className="bg-fintech_blue p-5 rounded-xl border border-gray-700 shadow-inner">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>⚙️</span> Configurar Choque
            </h2>
            
            <label className="text-sm text-gray-400 mb-1 block">Empresa Origem (Epicentro)</label>
            <select value={selectedCompanyId} onChange={(e) => setSelectedCompanyId(e.target.value)} className="w-full bg-fintech_panel p-3 rounded-lg border border-gray-600 text-white mb-4 outline-none focus:border-fintech_yellow">
              {companies.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            
            <label className="text-sm text-gray-400 mb-1 block">Intensidade do Calote <span className="float-right text-fintech_yellow font-bold">{(shockIntensity * 100).toFixed(0)}%</span></label>
            <input type="range" min="0" max="1" step="0.01" value={shockIntensity} onChange={(e) => setShockIntensity(parseFloat(e.target.value))} className="w-full h-2 rounded-lg cursor-pointer bg-gray-700 accent-fintech_yellow mb-6" />
            
            <button onClick={calculateSystemicRisk} className="w-full bg-fintech_yellow text-fintech_blue font-bold py-3 rounded-lg hover:bg-yellow-500 transition shadow-lg">
              Simular Contágio na Rede
            </button>
          </div>

          {/* Resultados (Só aparece após clicar no botão) */}
          {hasRun && (
            <div className="bg-fintech_blue p-5 rounded-xl border border-gray-700 shadow-inner flex-grow animate-fade-in">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span>📊</span> Resultados do DebtRank
              </h2>
              
              <div className="mb-6 pb-4 border-b border-gray-700">
                <p className="text-sm text-gray-400 mb-1">Risco Sistêmico Global</p>
                <p className="text-4xl font-black text-fintech_yellow">{systemicScore.toFixed(4)}</p>
              </div>

              <p className="text-sm text-gray-400 mb-3">Impacto residual por empresa:</p>
              <div className="flex flex-col gap-3">
                {companies.map(c => (
                  <div key={c.id} className="flex justify-between items-center bg-fintech_panel p-3 rounded-lg border border-gray-700">
                    <span className="text-gray-200 text-sm">{c.label}</span>
                    <span className={`font-mono font-bold ${results[c.id] > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {results[c.id]?.toFixed(4) || "0.0000"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Área do Grafo - Ocupa os 70% restantes da tela */}
        <section className="flex-grow h-full relative bg-fintech_blue">
          <ReactFlow 
            nodes={nodes} 
            edges={edges} 
            nodeTypes={nodeTypes}
            fitView 
            minZoom={0.5}
            className="w-full h-full"
          >
            <Background color="#1F2937" gap={30} size={2} />
            <Controls className="bg-fintech_panel text-white border-gray-700 fill-white" />
          </ReactFlow>
        </section>

      </main>
    </div>
  );
}

export default App;