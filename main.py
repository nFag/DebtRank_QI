from fastapi import FastAPI
from pydantic import BaseModel
import networkx as nx
import numpy as np

app = FastAPI(title="DebtRank API - Risco Sistêmico B2B")

# --- 1. CONSTRUINDO A ESTRUTURA DE DADOS (O GRAFO) ---
# Usamos um grafo direcionado (DiGraph) porque a dívida tem uma direção (A deve para B)
G = nx.DiGraph()

# Adicionando as empresas (Nós)
empresas = ["Varejista", "Distribuidora", "Fabrica", "Logistica"]
G.add_nodes_from(empresas)

# Adicionando as vulnerabilidades financeiras (Arestas)
# A semântica aqui é: (De quem o choque vem, Para quem o choque vai, peso da vulnerabilidade)
G.add_edge("Varejista", "Distribuidora", weight=1)
G.add_edge("Varejista", "Logistica", weight=0.15)
G.add_edge("Distribuidora", "Fabrica", weight=0.60)

# --- 2. PREPARANDO A MATRIZ (ÁLGEBRA LINEAR) ---
# Extraímos a matriz de adjacência pronta para o motor matemático
matriz_vulnerabilidade = nx.to_numpy_array(G, nodelist=empresas)


# --- 3. CRIANDO A ROTA DA API ---
class ChoqueRequest(BaseModel):
    nome_empresa: str
    intensidade: float # De 0.0 a 1.0

@app.post("/simular-choque")
def simular_choque(dados: ChoqueRequest):
    # Validando se a empresa existe na rede
    if dados.nome_empresa not in empresas:
        return {"erro": "Empresa não encontrada na rede."}

    # Criando o vetor de estresse inicial (tudo zero)
    vetor_estresse = np.zeros(len(empresas))
    
    # Injetando o choque inicial na empresa correta
    indice_empresa = empresas.index(dados.nome_empresa)
    vetor_estresse[indice_empresa] = dados.intensidade

    # --- O MOTOR DO DEBTRANK (A Multiplicação) ---
    # Aqui fazemos 1 iteração de propagação (o choque passando para os vizinhos)
    # matriz_vulnerabilidade.T é a matriz transposta
    estresse_propagado = matriz_vulnerabilidade.T @ vetor_estresse
    
    # O estresse total no sistema agora é o inicial + o que vazou
    estresse_total = vetor_estresse + estresse_propagado
    score_debtrank = np.sum(estresse_total)

    # Montando a resposta amigável para o Front-end
    resultado = {
        "empresa_origem": dados.nome_empresa,
        "choque_inicial": dados.intensidade,
        "risco_sistemico_total": round(score_debtrank, 4),
        "impacto_nas_empresas": {
            empresas[i]: round(estresse_total[i], 4) for i in range(len(empresas))
        }
    }
    
    return resultado