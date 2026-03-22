import numpy as np
import networkx as nx
from pydantic import BaseModel
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 1. Inicialização da API
app = FastAPI(title="DebtRank API")

# Libera a segurança do CORS para o Hackathon
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permite que qualquer front-end converse com a API
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ... (o resto do seu código continua exatamente igual daqui para baixo)

# 2. Construção da Estrutura de Dados (O Grafo)
G = nx.DiGraph()

companies = ["padaria", "servicos", "agro", "logistica"]
G.add_nodes_from(companies)

# (Origem da dívida, Destino do dinheiro, Porcentagem de impacto)
G.add_edge("padaria", "servicos", weight=0.15)
G.add_edge("agro", "padaria", weight=0.5)
G.add_edge("servicos", "agro", weight=0.1)
G.add_edge("logistica", "agro", weight=0.4)
G.add_edge("agro", "logistica", weight=0.1)
G.add_edge("logistica", "servicos", weight=0.2)

# Transforma o grafo em uma matriz de adjacencia ponderada (vulnerabilidades)
vulnerabilities_matrix = nx.to_numpy_array(G, nodelist=companies)

# Define o modelo de requisiçao para o endpoint
class DebtRankRequest(BaseModel):
    company_name: str
    intensity: float

# 5. O Endpoint (A Rota que processa o cálculo)
@app.post("/debt_rank")
def calculate_debt_rank(dados: DebtRankRequest):
    print(f"--> [BACKEND] Recebi o pacote da empresa: {dados.company_name}")

    if dados.company_name not in companies:
        return {"error": "Company not found in the graph."}

    estresse_atual = np.zeros(len(companies))
    indices_empresa = companies.index(dados.company_name)
    estresse_atual[indices_empresa] = dados.intensity

    estresse_total_acumulado = np.copy(estresse_atual)
    onda_de_choque = np.copy(estresse_atual)

    iteracoes = 0
    # TRAVA DE SEGURANÇA: Só roda enquanto for > 0.0001 e NO MÁXIMO 100 vezes.
    while np.sum(onda_de_choque) > 0.0001 and iteracoes < 100:
        iteracoes += 1
        onda_de_choque = vulnerabilities_matrix.T @ onda_de_choque
        estresse_total_acumulado += onda_de_choque
        print(f"    Iteração {iteracoes}: Força da onda = {np.sum(onda_de_choque)}")

    score_debtrank = np.sum(estresse_total_acumulado)
    print(f"<-- [BACKEND] Cálculo finalizado na iteração {iteracoes}! Score: {score_debtrank}")

    resultado = {
        "empresa_origem": dados.company_name,
        "choque_inicial": dados.intensity,
        "risco_sistemico_total": round(score_debtrank, 4),
        "impacto_nas_empresas": {
            companies[i]: round(estresse_total_acumulado[i], 4) for i in range(len(companies))
        }
    }
    
    return resultado