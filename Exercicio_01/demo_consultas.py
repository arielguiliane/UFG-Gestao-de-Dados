#!/usr/bin/env python3
"""
Script de Demonstração - Consultas ao Banco de Dados
Exercício 1 - Gestão de Dados

Este script demonstra como usar os dados processados pela aplicação
de ciclo de vida de dados, executando consultas SQL úteis.
"""

import sqlite3
import json
from datetime import datetime

def conectar_banco():
    """Conecta ao banco de dados"""
    try:
        conn = sqlite3.connect('movies.db')
        conn.row_factory = sqlite3.Row  # Para acessar colunas por nome
        return conn
    except Exception as e:
        print(f"Erro ao conectar ao banco: {e}")
        return None

def consulta_estatisticas_basicas(conn):
    """Consulta estatísticas básicas dos filmes"""
    print("=" * 60)
    print("📊 ESTATÍSTICAS BÁSICAS DOS FILMES")
    print("=" * 60)
    
    cursor = conn.cursor()
    
    # Total de filmes
    cursor.execute("SELECT COUNT(*) as total FROM movies")
    total = cursor.fetchone()['total']
    print(f"Total de filmes no banco: {total:,}")
    
    # Filme mais caro
    cursor.execute("""
        SELECT title, budget 
        FROM movies 
        WHERE budget > 0 
        ORDER BY budget DESC 
        LIMIT 1
    """)
    mais_caro = cursor.fetchone()
    print(f"Filme mais caro: {mais_caro['title']} (${mais_caro['budget']:,})")
    
    # Filme com maior receita
    cursor.execute("""
        SELECT title, revenue 
        FROM movies 
        WHERE revenue > 0 
        ORDER BY revenue DESC 
        LIMIT 1
    """)
    maior_receita = cursor.fetchone()
    print(f"Maior receita: {maior_receita['title']} (${maior_receita['revenue']:,})")
    
    # Filme mais bem avaliado
    cursor.execute("""
        SELECT title, vote_average, vote_count 
        FROM movies 
        WHERE vote_count >= 100 
        ORDER BY vote_average DESC 
        LIMIT 1
    """)
    melhor_avaliado = cursor.fetchone()
    print(f"Melhor avaliado: {melhor_avaliado['title']} ({melhor_avaliado['vote_average']}/10 - {melhor_avaliado['vote_count']} votos)")
    
    print()

def consulta_top_generos(conn):
    """Consulta os gêneros mais populares"""
    print("=" * 60)
    print("🎭 TOP 10 GÊNEROS MAIS POPULARES")
    print("=" * 60)
    
    cursor = conn.cursor()
    cursor.execute("""
        SELECT g.name as genero, 
               COUNT(*) as total_filmes,
               ROUND(AVG(m.vote_average), 2) as nota_media,
               ROUND(AVG(m.revenue), 0) as receita_media
        FROM genres g
        JOIN movie_genres mg ON g.id = mg.genre_id
        JOIN movies m ON mg.movie_id = m.id
        WHERE m.vote_average > 0
        GROUP BY g.name
        ORDER BY total_filmes DESC
        LIMIT 10
    """)
    
    print(f"{'Gênero':<15} {'Filmes':<8} {'Nota Média':<12} {'Receita Média':<15}")
    print("-" * 60)
    
    for row in cursor.fetchall():
        receita_str = f"${row['receita_media']:,.0f}" if row['receita_media'] else "N/A"
        print(f"{row['genero']:<15} {row['total_filmes']:<8} {row['nota_media']:<12} {receita_str:<15}")
    
    print()

def consulta_evolucao_temporal(conn):
    """Consulta a evolução da indústria cinematográfica"""
    print("=" * 60)
    print("📈 EVOLUÇÃO DA INDÚSTRIA (2010-2020)")
    print("=" * 60)
    
    cursor = conn.cursor()
    cursor.execute("""
        SELECT strftime('%Y', release_date) as ano,
               COUNT(*) as total_filmes,
               ROUND(AVG(budget), 0) as orcamento_medio,
               ROUND(AVG(revenue), 0) as receita_media,
               ROUND(AVG(vote_average), 2) as nota_media
        FROM movies 
        WHERE release_date IS NOT NULL 
        AND strftime('%Y', release_date) BETWEEN '2010' AND '2020'
        GROUP BY strftime('%Y', release_date)
        ORDER BY ano
    """)
    
    print(f"{'Ano':<6} {'Filmes':<8} {'Orçamento Médio':<18} {'Receita Média':<18} {'Nota':<6}")
    print("-" * 70)
    
    for row in cursor.fetchall():
        orc_str = f"${row['orcamento_medio']:,.0f}" if row['orcamento_medio'] else "N/A"
        rec_str = f"${row['receita_media']:,.0f}" if row['receita_media'] else "N/A"
        print(f"{row['ano']:<6} {row['total_filmes']:<8} {orc_str:<18} {rec_str:<18} {row['nota_media']:<6}")
    
    print()

def consulta_roi_analysis(conn):
    """Análise de ROI (Return on Investment)"""
    print("=" * 60)
    print("💰 TOP 10 FILMES POR ROI (Return on Investment)")
    print("=" * 60)
    
    cursor = conn.cursor()
    cursor.execute("""
        SELECT title, 
               budget, 
               revenue,
               ROUND(((revenue - budget) * 100.0 / budget), 2) as roi_percentage
        FROM movies 
        WHERE budget > 1000000 AND revenue > budget
        ORDER BY roi_percentage DESC
        LIMIT 10
    """)
    
    print(f"{'Filme':<30} {'Orçamento':<15} {'Receita':<15} {'ROI %':<10}")
    print("-" * 75)
    
    for row in cursor.fetchall():
        print(f"{row['title'][:29]:<30} ${row['budget']:>12,} ${row['revenue']:>12,} {row['roi_percentage']:>8}%")
    
    print()

def consulta_qualidade_dados(conn):
    """Análise da qualidade dos dados"""
    print("=" * 60)
    print("🔍 ANÁLISE DE QUALIDADE DOS DADOS")
    print("=" * 60)
    
    cursor = conn.cursor()
    
    # Total de registros
    cursor.execute("SELECT COUNT(*) as total FROM movies")
    total = cursor.fetchone()['total']
    
    # Campos importantes e sua completude
    campos = [
        ('title', 'Título'),
        ('release_date', 'Data de Lançamento'),
        ('budget', 'Orçamento'),
        ('revenue', 'Receita'),
        ('vote_average', 'Nota'),
        ('overview', 'Sinopse')
    ]
    
    print(f"Total de registros: {total:,}")
    print("\nCompletude dos dados:")
    print(f"{'Campo':<20} {'Completos':<12} {'Percentual':<12}")
    print("-" * 50)
    
    for campo, nome in campos:
        if campo in ['budget', 'revenue', 'vote_average']:
            cursor.execute(f"SELECT COUNT(*) FROM movies WHERE {campo} > 0")
        else:
            cursor.execute(f"SELECT COUNT(*) FROM movies WHERE {campo} IS NOT NULL AND {campo} != ''")
        
        completos = cursor.fetchone()[0]
        percentual = (completos / total) * 100
        print(f"{nome:<20} {completos:>10,} {percentual:>10.1f}%")
    
    # Inconsistências
    cursor.execute("SELECT COUNT(*) FROM movies WHERE revenue > 0 AND budget > 0 AND revenue < budget")
    inconsistentes = cursor.fetchone()[0]
    print(f"\nInconsistências detectadas:")
    print(f"Filmes com receita menor que orçamento: {inconsistentes}")
    
    print()

def consulta_palavras_chave_populares(conn):
    """Consulta as palavras-chave mais populares"""
    print("=" * 60)
    print("🏷️  TOP 15 PALAVRAS-CHAVE MAIS POPULARES")
    print("=" * 60)
    
    cursor = conn.cursor()
    cursor.execute("""
        SELECT k.keyword, 
               COUNT(*) as total_filmes,
               ROUND(AVG(m.vote_average), 2) as nota_media
        FROM keywords k
        JOIN movie_keywords mk ON k.id = mk.keyword_id
        JOIN movies m ON mk.movie_id = m.id
        WHERE m.vote_average > 0
        GROUP BY k.keyword
        ORDER BY total_filmes DESC
        LIMIT 15
    """)
    
    print(f"{'Palavra-chave':<20} {'Filmes':<8} {'Nota Média':<12}")
    print("-" * 45)
    
    for row in cursor.fetchall():
        print(f"{row['keyword']:<20} {row['total_filmes']:<8} {row['nota_media']:<12}")
    
    print()

def main():
    """Função principal"""
    print("🎬 DEMONSTRAÇÃO DE CONSULTAS - BANCO DE FILMES")
    print("Exercício 1 - Gestão de Dados")
    print(f"Executado em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print()
    
    # Conecta ao banco
    conn = conectar_banco()
    if not conn:
        print("❌ Não foi possível conectar ao banco de dados.")
        print("Certifique-se de que o arquivo 'movies.db' existe.")
        return
    
    try:
        # Executa as consultas
        consulta_estatisticas_basicas(conn)
        consulta_top_generos(conn)
        consulta_evolucao_temporal(conn)
        consulta_roi_analysis(conn)
        consulta_qualidade_dados(conn)
        consulta_palavras_chave_populares(conn)
        
        print("=" * 60)
        print("✅ Demonstração concluída com sucesso!")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Erro durante a execução: {e}")
    
    finally:
        conn.close()

if __name__ == "__main__":
    main()
