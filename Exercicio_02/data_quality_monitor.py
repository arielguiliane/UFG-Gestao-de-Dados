#!/usr/bin/env python3
"""
Sistema de Monitoramento de Qualidade de Dados - Exercício 2
Implementa monitoramento das dimensões de qualidade de dados e governança
baseado nos dados processados no Exercício 1.

Dimensões monitoradas:
1. Completude - Percentual de dados preenchidos
2. Consistência - Dados sem contradições
3. Precisão - Valores corretos e válidos
4. Atualidade - Dados recentes e relevantes
5. Integridade - Relacionamentos preservados
6. Unicidade - Ausência de duplicatas
7. Conformidade - Aderência a padrões (LGPD)
"""

import sqlite3
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from datetime import datetime, timedelta
import json
import logging
from pathlib import Path

# Configuração de estilo para gráficos
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('quality_monitor.log'),
        logging.StreamHandler()
    ]
)

class DataQualityMonitor:
    """
    Sistema de Monitoramento de Qualidade de Dados
    Implementa as principais dimensões de qualidade e governança
    """
    
    def __init__(self, db_path='movies.db'):
        self.db_path = db_path
        self.conn = None
        self.quality_metrics = {}
        self.governance_metrics = {}
        
    def __enter__(self):
        """Context manager para conexão com banco"""
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Fecha conexão com banco"""
        if self.conn:
            self.conn.close()
    
    # DIMENSÃO 1: COMPLETUDE
    def monitor_completeness(self):
        """
        Monitora a completude dos dados
        Mede o percentual de campos preenchidos vs. campos obrigatórios
        """
        logging.info("=== MONITORANDO DIMENSÃO: COMPLETUDE ===")
        
        cursor = self.conn.cursor()
        
        # Total de registros
        cursor.execute("SELECT COUNT(*) as total FROM movies")
        total_records = cursor.fetchone()['total']
        
        # Campos críticos para análise
        critical_fields = [
            'title', 'release_date', 'budget', 'revenue', 
            'vote_average', 'overview', 'original_language'
        ]
        
        completeness_data = {}
        
        for field in critical_fields:
            if field in ['budget', 'revenue', 'vote_average']:
                # Para campos numéricos, considera > 0 como preenchido
                cursor.execute(f"SELECT COUNT(*) FROM movies WHERE {field} > 0")
            else:
                # Para campos texto, considera NOT NULL e não vazio
                cursor.execute(f"SELECT COUNT(*) FROM movies WHERE {field} IS NOT NULL AND {field} != ''")
            
            filled_count = cursor.fetchone()[0]
            completeness_percentage = (filled_count / total_records) * 100
            completeness_data[field] = {
                'filled': filled_count,
                'total': total_records,
                'percentage': round(completeness_percentage, 2)
            }
        
        self.quality_metrics['completeness'] = completeness_data
        
        # Score geral de completude
        avg_completeness = np.mean([data['percentage'] for data in completeness_data.values()])
        self.quality_metrics['completeness_score'] = round(avg_completeness, 2)
        
        logging.info(f"Score de Completude: {avg_completeness:.2f}%")
        return completeness_data
    
    # DIMENSÃO 2: CONSISTÊNCIA
    def monitor_consistency(self):
        """
        Monitora a consistência dos dados
        Identifica contradições e inconsistências lógicas
        """
        logging.info("=== MONITORANDO DIMENSÃO: CONSISTÊNCIA ===")
        
        cursor = self.conn.cursor()
        
        consistency_issues = {}
        
        # 1. Receita menor que orçamento (inconsistência financeira)
        cursor.execute("""
            SELECT COUNT(*) as count FROM movies 
            WHERE revenue > 0 AND budget > 0 AND revenue < budget
        """)
        financial_inconsistencies = cursor.fetchone()['count']
        
        # 2. Datas de lançamento futuras
        cursor.execute("""
            SELECT COUNT(*) as count FROM movies 
            WHERE release_date > date('now')
        """)
        future_dates = cursor.fetchone()['count']
        
        # 3. Notas fora do range válido (0-10)
        cursor.execute("""
            SELECT COUNT(*) as count FROM movies 
            WHERE vote_average < 0 OR vote_average > 10
        """)
        invalid_ratings = cursor.fetchone()['count']
        
        # 4. Durações impossíveis (< 1 minuto ou > 500 minutos)
        cursor.execute("""
            SELECT COUNT(*) as count FROM movies 
            WHERE runtime > 0 AND (runtime < 1 OR runtime > 500)
        """)
        invalid_durations = cursor.fetchone()['count']
        
        consistency_issues = {
            'financial_inconsistencies': financial_inconsistencies,
            'future_release_dates': future_dates,
            'invalid_ratings': invalid_ratings,
            'invalid_durations': invalid_durations
        }
        
        # Score de consistência (100% - % de inconsistências)
        cursor.execute("SELECT COUNT(*) FROM movies")
        total_records = cursor.fetchone()[0]
        total_issues = sum(consistency_issues.values())
        consistency_score = max(0, 100 - (total_issues / total_records * 100))
        
        self.quality_metrics['consistency'] = consistency_issues
        self.quality_metrics['consistency_score'] = round(consistency_score, 2)
        
        logging.info(f"Score de Consistência: {consistency_score:.2f}%")
        return consistency_issues
    
    # DIMENSÃO 3: PRECISÃO
    def monitor_accuracy(self):
        """
        Monitora a precisão dos dados
        Verifica se os valores estão dentro de ranges esperados
        """
        logging.info("=== MONITORANDO DIMENSÃO: PRECISÃO ===")
        
        cursor = self.conn.cursor()
        
        accuracy_metrics = {}
        
        # 1. Orçamentos dentro de ranges realistas (1K - 500M)
        cursor.execute("""
            SELECT 
                COUNT(*) as total_with_budget,
                SUM(CASE WHEN budget BETWEEN 1000 AND 500000000 THEN 1 ELSE 0 END) as realistic_budgets
            FROM movies WHERE budget > 0
        """)
        budget_data = cursor.fetchone()
        budget_accuracy = (budget_data['realistic_budgets'] / budget_data['total_with_budget'] * 100) if budget_data['total_with_budget'] > 0 else 0
        
        # 2. Receitas coerentes com orçamentos (ROI entre -100% e 10000%)
        cursor.execute("""
            SELECT 
                COUNT(*) as total_with_both,
                SUM(CASE WHEN ((revenue - budget) * 100.0 / budget) BETWEEN -100 AND 10000 THEN 1 ELSE 0 END) as realistic_roi
            FROM movies WHERE budget > 0 AND revenue > 0
        """)
        roi_data = cursor.fetchone()
        roi_accuracy = (roi_data['realistic_roi'] / roi_data['total_with_both'] * 100) if roi_data['total_with_both'] > 0 else 0
        
        # 3. Notas com votos suficientes (pelo menos 10 votos para ser confiável)
        cursor.execute("""
            SELECT 
                COUNT(*) as total_with_rating,
                SUM(CASE WHEN vote_count >= 10 THEN 1 ELSE 0 END) as reliable_ratings
            FROM movies WHERE vote_average > 0
        """)
        rating_data = cursor.fetchone()
        rating_accuracy = (rating_data['reliable_ratings'] / rating_data['total_with_rating'] * 100) if rating_data['total_with_rating'] > 0 else 0
        
        accuracy_metrics = {
            'budget_accuracy': round(budget_accuracy, 2),
            'roi_accuracy': round(roi_accuracy, 2),
            'rating_accuracy': round(rating_accuracy, 2)
        }
        
        # Score geral de precisão
        accuracy_score = np.mean(list(accuracy_metrics.values()))
        
        self.quality_metrics['accuracy'] = accuracy_metrics
        self.quality_metrics['accuracy_score'] = round(accuracy_score, 2)
        
        logging.info(f"Score de Precisão: {accuracy_score:.2f}%")
        return accuracy_metrics
    
    # DIMENSÃO 4: ATUALIDADE
    def monitor_timeliness(self):
        """
        Monitora a atualidade dos dados
        Verifica se os dados são recentes e relevantes
        """
        logging.info("=== MONITORANDO DIMENSÃO: ATUALIDADE ===")
        
        cursor = self.conn.cursor()
        
        # Análise temporal dos dados
        cursor.execute("""
            SELECT 
                strftime('%Y', release_date) as year,
                COUNT(*) as count
            FROM movies 
            WHERE release_date IS NOT NULL
            GROUP BY strftime('%Y', release_date)
            ORDER BY year DESC
        """)
        
        year_distribution = cursor.fetchall()
        
        # Calcula métricas de atualidade
        current_year = datetime.now().year
        recent_years = [str(year) for year in range(current_year - 10, current_year + 1)]
        
        total_movies = sum(row['count'] for row in year_distribution)
        recent_movies = sum(row['count'] for row in year_distribution if row['year'] in recent_years)
        
        timeliness_score = (recent_movies / total_movies * 100) if total_movies > 0 else 0
        
        # Idade média dos dados
        cursor.execute("""
            SELECT AVG(CAST(strftime('%Y', 'now') AS INTEGER) - CAST(strftime('%Y', release_date) AS INTEGER)) as avg_age
            FROM movies WHERE release_date IS NOT NULL
        """)
        avg_age = cursor.fetchone()['avg_age'] or 0
        
        timeliness_metrics = {
            'recent_data_percentage': round(timeliness_score, 2),
            'average_age_years': round(avg_age, 1),
            'total_movies': total_movies,
            'recent_movies': recent_movies
        }
        
        self.quality_metrics['timeliness'] = timeliness_metrics
        self.quality_metrics['timeliness_score'] = round(timeliness_score, 2)
        
        logging.info(f"Score de Atualidade: {timeliness_score:.2f}%")
        return timeliness_metrics
    
    # DIMENSÃO 5: INTEGRIDADE
    def monitor_integrity(self):
        """
        Monitora a integridade dos dados
        Verifica relacionamentos e constraints
        """
        logging.info("=== MONITORANDO DIMENSÃO: INTEGRIDADE ===")
        
        cursor = self.conn.cursor()
        
        integrity_metrics = {}
        
        # 1. Integridade referencial - filmes com gêneros
        cursor.execute("""
            SELECT 
                COUNT(DISTINCT m.id) as movies_with_genres,
                (SELECT COUNT(*) FROM movies) as total_movies
            FROM movies m
            JOIN movie_genres mg ON m.id = mg.movie_id
        """)
        genre_data = cursor.fetchone()
        genre_integrity = (genre_data['movies_with_genres'] / genre_data['total_movies'] * 100) if genre_data['total_movies'] > 0 else 0
        
        # 2. Integridade referencial - filmes com keywords
        cursor.execute("""
            SELECT 
                COUNT(DISTINCT m.id) as movies_with_keywords,
                (SELECT COUNT(*) FROM movies) as total_movies
            FROM movies m
            JOIN movie_keywords mk ON m.id = mk.movie_id
        """)
        keyword_data = cursor.fetchone()
        keyword_integrity = (keyword_data['movies_with_keywords'] / keyword_data['total_movies'] * 100) if keyword_data['total_movies'] > 0 else 0
        
        # 3. Constraints de domínio - IDs únicos
        cursor.execute("SELECT COUNT(*) - COUNT(DISTINCT original_id) as duplicate_ids FROM movies WHERE original_id IS NOT NULL")
        duplicate_ids = cursor.fetchone()[0]
        
        integrity_metrics = {
            'genre_relationship_integrity': round(genre_integrity, 2),
            'keyword_relationship_integrity': round(keyword_integrity, 2),
            'duplicate_ids': duplicate_ids,
            'id_uniqueness': 100 if duplicate_ids == 0 else 0
        }
        
        # Score geral de integridade
        integrity_score = np.mean([genre_integrity, keyword_integrity, (100 if duplicate_ids == 0 else 0)])
        
        self.quality_metrics['integrity'] = integrity_metrics
        self.quality_metrics['integrity_score'] = round(integrity_score, 2)
        
        logging.info(f"Score de Integridade: {integrity_score:.2f}%")
        return integrity_metrics

    # DIMENSÃO 6: UNICIDADE
    def monitor_uniqueness(self):
        """
        Monitora a unicidade dos dados
        Identifica e quantifica duplicatas
        """
        logging.info("=== MONITORANDO DIMENSÃO: UNICIDADE ===")

        cursor = self.conn.cursor()

        uniqueness_metrics = {}

        # 1. Duplicatas por título e ano
        cursor.execute("""
            SELECT
                title, strftime('%Y', release_date) as year, COUNT(*) as count
            FROM movies
            WHERE title IS NOT NULL AND release_date IS NOT NULL
            GROUP BY title, strftime('%Y', release_date)
            HAVING COUNT(*) > 1
        """)
        title_year_duplicates = cursor.fetchall()

        # 2. Duplicatas por título exato
        cursor.execute("""
            SELECT title, COUNT(*) as count
            FROM movies
            WHERE title IS NOT NULL
            GROUP BY title
            HAVING COUNT(*) > 1
        """)
        title_duplicates = cursor.fetchall()

        # 3. Total de registros únicos vs duplicados
        cursor.execute("SELECT COUNT(*) as total FROM movies")
        total_records = cursor.fetchone()['total']

        cursor.execute("SELECT COUNT(DISTINCT title) as unique_titles FROM movies WHERE title IS NOT NULL")
        unique_titles = cursor.fetchone()['unique_titles']

        # Cálculo do score de unicidade
        duplicate_records = sum(dup['count'] - 1 for dup in title_duplicates)  # Conta apenas os extras
        uniqueness_score = ((total_records - duplicate_records) / total_records * 100) if total_records > 0 else 0

        uniqueness_metrics = {
            'total_records': total_records,
            'unique_titles': unique_titles,
            'title_year_duplicates': len(title_year_duplicates),
            'title_duplicates': len(title_duplicates),
            'duplicate_records': duplicate_records,
            'uniqueness_percentage': round(uniqueness_score, 2)
        }

        self.quality_metrics['uniqueness'] = uniqueness_metrics
        self.quality_metrics['uniqueness_score'] = round(uniqueness_score, 2)

        logging.info(f"Score de Unicidade: {uniqueness_score:.2f}%")
        return uniqueness_metrics

    # DIMENSÃO 7: CONFORMIDADE (LGPD/GDPR)
    def monitor_compliance(self):
        """
        Monitora a conformidade com regulamentações (LGPD)
        Verifica aspectos de privacidade e proteção de dados
        """
        logging.info("=== MONITORANDO DIMENSÃO: CONFORMIDADE (LGPD) ===")

        cursor = self.conn.cursor()

        compliance_metrics = {}

        # 1. Dados pessoais identificáveis (simulação - em dados reais seria mais complexo)
        # Para filmes, consideramos que não há dados pessoais diretos, mas há metadados
        cursor.execute("SELECT COUNT(*) FROM movies WHERE overview LIKE '%personal%' OR overview LIKE '%private%'")
        potential_personal_data = cursor.fetchone()[0]

        # 2. Dados com origem/fonte documentada (simulação de auditoria)
        cursor.execute("SELECT COUNT(*) FROM movies WHERE original_id IS NOT NULL")
        traceable_data = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM movies")
        total_records = cursor.fetchone()[0]

        traceability_score = (traceable_data / total_records * 100) if total_records > 0 else 0

        # 3. Dados anonimizados/pseudonimizados (verificação de IDs)
        cursor.execute("SELECT COUNT(DISTINCT original_id) as unique_ids FROM movies WHERE original_id IS NOT NULL")
        unique_ids = cursor.fetchone()['unique_ids']

        # 4. Retenção de dados (idade dos dados vs política de retenção)
        cursor.execute("""
            SELECT COUNT(*) as old_data FROM movies
            WHERE release_date < date('now', '-20 years')
        """)
        old_data_count = cursor.fetchone()['old_data']
        retention_compliance = ((total_records - old_data_count) / total_records * 100) if total_records > 0 else 0

        compliance_metrics = {
            'data_traceability': round(traceability_score, 2),
            'potential_personal_data': potential_personal_data,
            'retention_compliance': round(retention_compliance, 2),
            'unique_identifiers': unique_ids,
            'total_records': total_records
        }

        # Score geral de conformidade
        compliance_score = np.mean([traceability_score, retention_compliance])

        self.quality_metrics['compliance'] = compliance_metrics
        self.quality_metrics['compliance_score'] = round(compliance_score, 2)

        logging.info(f"Score de Conformidade: {compliance_score:.2f}%")
        return compliance_metrics

    # GOVERNANÇA DE DADOS
    def monitor_data_governance(self):
        """
        Monitora aspectos de governança de dados
        Inclui catalogação, linhagem e políticas
        """
        logging.info("=== MONITORANDO GOVERNANÇA DE DADOS ===")

        cursor = self.conn.cursor()

        governance_metrics = {}

        # 1. Catalogação de dados - metadados disponíveis
        cursor.execute("""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN title IS NOT NULL THEN 1 ELSE 0 END) as has_title,
                SUM(CASE WHEN overview IS NOT NULL AND overview != '' THEN 1 ELSE 0 END) as has_description,
                SUM(CASE WHEN original_language IS NOT NULL THEN 1 ELSE 0 END) as has_language,
                SUM(CASE WHEN release_date IS NOT NULL THEN 1 ELSE 0 END) as has_date
            FROM movies
        """)
        metadata_stats = cursor.fetchone()

        # Score de catalogação
        total = metadata_stats['total']
        catalog_score = (
            (metadata_stats['has_title'] + metadata_stats['has_description'] +
             metadata_stats['has_language'] + metadata_stats['has_date']) / (total * 4) * 100
        ) if total > 0 else 0

        # 2. Linhagem de dados - rastreabilidade
        cursor.execute("SELECT COUNT(*) FROM movies WHERE original_id IS NOT NULL")
        traceable_records = cursor.fetchone()[0]
        lineage_score = (traceable_records / total * 100) if total > 0 else 0

        # 3. Qualidade de taxonomia - classificação por gêneros
        cursor.execute("""
            SELECT
                COUNT(DISTINCT m.id) as movies_classified,
                (SELECT COUNT(*) FROM movies) as total_movies
            FROM movies m
            JOIN movie_genres mg ON m.id = mg.movie_id
        """)
        taxonomy_data = cursor.fetchone()
        taxonomy_score = (taxonomy_data['movies_classified'] / taxonomy_data['total_movies'] * 100) if taxonomy_data['total_movies'] > 0 else 0

        governance_metrics = {
            'data_cataloging': round(catalog_score, 2),
            'data_lineage': round(lineage_score, 2),
            'taxonomy_quality': round(taxonomy_score, 2),
            'metadata_completeness': {
                'title': round(metadata_stats['has_title'] / total * 100, 2),
                'description': round(metadata_stats['has_description'] / total * 100, 2),
                'language': round(metadata_stats['has_language'] / total * 100, 2),
                'date': round(metadata_stats['has_date'] / total * 100, 2)
            }
        }

        # Score geral de governança
        governance_score = np.mean([catalog_score, lineage_score, taxonomy_score])

        self.governance_metrics = governance_metrics
        self.governance_metrics['governance_score'] = round(governance_score, 2)

        logging.info(f"Score de Governança: {governance_score:.2f}%")
        return governance_metrics

    # EXECUÇÃO COMPLETA DO MONITORAMENTO
    def run_full_quality_assessment(self):
        """
        Executa todas as dimensões de qualidade e governança
        """
        logging.info("🚀 INICIANDO AVALIAÇÃO COMPLETA DE QUALIDADE DE DADOS")

        # Executa todas as dimensões
        self.monitor_completeness()
        self.monitor_consistency()
        self.monitor_accuracy()
        self.monitor_timeliness()
        self.monitor_integrity()
        self.monitor_uniqueness()
        self.monitor_compliance()
        self.monitor_data_governance()

        # Calcula score geral
        quality_scores = [
            self.quality_metrics.get('completeness_score', 0),
            self.quality_metrics.get('consistency_score', 0),
            self.quality_metrics.get('accuracy_score', 0),
            self.quality_metrics.get('timeliness_score', 0),
            self.quality_metrics.get('integrity_score', 0),
            self.quality_metrics.get('uniqueness_score', 0),
            self.quality_metrics.get('compliance_score', 0)
        ]

        overall_quality_score = np.mean(quality_scores)
        governance_score = self.governance_metrics.get('governance_score', 0)

        self.quality_metrics['overall_score'] = round(overall_quality_score, 2)

        logging.info(f"📊 SCORE GERAL DE QUALIDADE: {overall_quality_score:.2f}%")
        logging.info(f"🏛️ SCORE DE GOVERNANÇA: {governance_score:.2f}%")

        return {
            'quality_score': overall_quality_score,
            'governance_score': governance_score,
            'individual_scores': quality_scores
        }

    # GERAÇÃO DE DASHBOARDS
    def generate_quality_dashboard(self):
        """
        Gera dashboard visual com todas as métricas de qualidade
        """
        logging.info("📈 GERANDO DASHBOARD DE QUALIDADE DE DADOS")

        # Configuração da figura
        fig, axes = plt.subplots(3, 3, figsize=(20, 15))
        fig.suptitle('Dashboard de Qualidade de Dados - Gestão Estratégica', fontsize=20, fontweight='bold')

        # 1. Gráfico de Scores Gerais (Radar Chart)
        ax1 = axes[0, 0]
        dimensions = ['Completude', 'Consistência', 'Precisão', 'Atualidade', 'Integridade', 'Unicidade', 'Conformidade']
        scores = [
            self.quality_metrics.get('completeness_score', 0),
            self.quality_metrics.get('consistency_score', 0),
            self.quality_metrics.get('accuracy_score', 0),
            self.quality_metrics.get('timeliness_score', 0),
            self.quality_metrics.get('integrity_score', 0),
            self.quality_metrics.get('uniqueness_score', 0),
            self.quality_metrics.get('compliance_score', 0)
        ]

        # Gráfico de barras para scores
        bars = ax1.bar(range(len(dimensions)), scores, color=plt.cm.viridis(np.linspace(0, 1, len(dimensions))))
        ax1.set_title('Scores por Dimensão de Qualidade', fontweight='bold')
        ax1.set_ylabel('Score (%)')
        ax1.set_xticks(range(len(dimensions)))
        ax1.set_xticklabels(dimensions, rotation=45, ha='right')
        ax1.set_ylim(0, 100)

        # Adiciona valores nas barras
        for bar, score in zip(bars, scores):
            height = bar.get_height()
            ax1.text(bar.get_x() + bar.get_width()/2., height + 1,
                    f'{score:.1f}%', ha='center', va='bottom', fontweight='bold')

        # 2. Completude por Campo
        ax2 = axes[0, 1]
        if 'completeness' in self.quality_metrics:
            completeness_data = self.quality_metrics['completeness']
            fields = list(completeness_data.keys())
            percentages = [data['percentage'] for data in completeness_data.values()]

            bars = ax2.barh(fields, percentages, color='skyblue')
            ax2.set_title('Completude por Campo', fontweight='bold')
            ax2.set_xlabel('Completude (%)')
            ax2.set_xlim(0, 100)

            # Adiciona valores nas barras
            for bar, pct in zip(bars, percentages):
                width = bar.get_width()
                ax2.text(width + 1, bar.get_y() + bar.get_height()/2.,
                        f'{pct:.1f}%', ha='left', va='center')

        # 3. Problemas de Consistência
        ax3 = axes[0, 2]
        if 'consistency' in self.quality_metrics:
            consistency_data = self.quality_metrics['consistency']
            issues = list(consistency_data.keys())
            counts = list(consistency_data.values())

            wedges, texts, autotexts = ax3.pie(counts, labels=issues, autopct='%1.0f', startangle=90)
            ax3.set_title('Distribuição de Problemas de Consistência', fontweight='bold')

        # 4. Distribuição Temporal (Atualidade)
        ax4 = axes[1, 0]
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT
                strftime('%Y', release_date) as year,
                COUNT(*) as count
            FROM movies
            WHERE release_date IS NOT NULL
            GROUP BY strftime('%Y', release_date)
            ORDER BY year
        """)
        year_data = cursor.fetchall()

        if year_data:
            years = [int(row['year']) for row in year_data[-20:]]  # Últimos 20 anos
            counts = [row['count'] for row in year_data[-20:]]

            ax4.plot(years, counts, marker='o', linewidth=2, markersize=4)
            ax4.set_title('Distribuição Temporal dos Dados', fontweight='bold')
            ax4.set_xlabel('Ano')
            ax4.set_ylabel('Número de Filmes')
            ax4.grid(True, alpha=0.3)

        # 5. Métricas de Precisão
        ax5 = axes[1, 1]
        if 'accuracy' in self.quality_metrics:
            accuracy_data = self.quality_metrics['accuracy']
            metrics = list(accuracy_data.keys())
            values = list(accuracy_data.values())

            bars = ax5.bar(metrics, values, color='lightcoral')
            ax5.set_title('Métricas de Precisão', fontweight='bold')
            ax5.set_ylabel('Precisão (%)')
            ax5.set_xticklabels(metrics, rotation=45, ha='right')

            for bar, val in zip(bars, values):
                height = bar.get_height()
                ax5.text(bar.get_x() + bar.get_width()/2., height + 1,
                        f'{val:.1f}%', ha='center', va='bottom')

        # 6. Integridade Referencial
        ax6 = axes[1, 2]
        if 'integrity' in self.quality_metrics:
            integrity_data = self.quality_metrics['integrity']

            # Gráfico de gauge para integridade
            score = self.quality_metrics.get('integrity_score', 0)

            # Simula um gauge com arco
            theta = np.linspace(0, np.pi, 100)
            r = np.ones_like(theta)

            ax6.plot(theta, r, 'k-', linewidth=8, alpha=0.3)

            # Arco colorido baseado no score
            score_theta = np.linspace(0, np.pi * score/100, int(score))
            score_r = np.ones_like(score_theta)

            color = 'red' if score < 50 else 'orange' if score < 80 else 'green'
            ax6.plot(score_theta, score_r, color=color, linewidth=8)

            ax6.set_ylim(0, 1.2)
            ax6.set_xlim(-0.2, np.pi + 0.2)
            ax6.set_title(f'Score de Integridade: {score:.1f}%', fontweight='bold')
            ax6.axis('off')

            # Adiciona texto no centro
            ax6.text(np.pi/2, 0.5, f'{score:.1f}%', ha='center', va='center',
                    fontsize=16, fontweight='bold')

        # 7. Governança de Dados
        ax7 = axes[2, 0]
        if hasattr(self, 'governance_metrics') and self.governance_metrics:
            gov_aspects = ['Catalogação', 'Linhagem', 'Taxonomia']
            gov_scores = [
                self.governance_metrics.get('data_cataloging', 0),
                self.governance_metrics.get('data_lineage', 0),
                self.governance_metrics.get('taxonomy_quality', 0)
            ]

            bars = ax7.bar(gov_aspects, gov_scores, color='mediumpurple')
            ax7.set_title('Aspectos de Governança', fontweight='bold')
            ax7.set_ylabel('Score (%)')
            ax7.set_ylim(0, 100)

            for bar, score in zip(bars, gov_scores):
                height = bar.get_height()
                ax7.text(bar.get_x() + bar.get_width()/2., height + 1,
                        f'{score:.1f}%', ha='center', va='bottom')

        # 8. Conformidade LGPD
        ax8 = axes[2, 1]
        if 'compliance' in self.quality_metrics:
            compliance_score = self.quality_metrics.get('compliance_score', 0)

            # Gráfico de rosca para conformidade
            sizes = [compliance_score, 100 - compliance_score]
            colors = ['lightgreen', 'lightcoral']
            labels = ['Conforme', 'Não Conforme']

            wedges, texts, autotexts = ax8.pie(sizes, labels=labels, colors=colors,
                                              autopct='%1.1f%%', startangle=90,
                                              wedgeprops=dict(width=0.5))
            ax8.set_title('Conformidade LGPD', fontweight='bold')

        # 9. Score Geral
        ax9 = axes[2, 2]
        overall_score = self.quality_metrics.get('overall_score', 0)
        governance_score = self.governance_metrics.get('governance_score', 0) if hasattr(self, 'governance_metrics') else 0

        categories = ['Qualidade\nGeral', 'Governança']
        scores = [overall_score, governance_score]
        colors = ['gold', 'silver']

        bars = ax9.bar(categories, scores, color=colors)
        ax9.set_title('Scores Finais', fontweight='bold', fontsize=14)
        ax9.set_ylabel('Score (%)')
        ax9.set_ylim(0, 100)

        for bar, score in zip(bars, scores):
            height = bar.get_height()
            ax9.text(bar.get_x() + bar.get_width()/2., height + 2,
                    f'{score:.1f}%', ha='center', va='bottom',
                    fontsize=12, fontweight='bold')

        plt.tight_layout()
        plt.savefig('dashboard_qualidade_dados.png', dpi=300, bbox_inches='tight')
        plt.show()

        logging.info("✅ Dashboard salvo como 'dashboard_qualidade_dados.png'")

        return fig

    # RELATÓRIO DETALHADO
    def generate_detailed_report(self):
        """
        Gera relatório detalhado em texto para análise estratégica
        """
        logging.info("📋 GERANDO RELATÓRIO DETALHADO")

        report = []
        report.append("=" * 80)
        report.append("RELATÓRIO DE QUALIDADE DE DADOS E GOVERNANÇA")
        report.append("Exercício 2 - Gestão Estratégica de Dados")
        report.append("=" * 80)
        report.append(f"Data/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
        report.append("")

        # Resumo Executivo
        overall_score = self.quality_metrics.get('overall_score', 0)
        governance_score = self.governance_metrics.get('governance_score', 0) if hasattr(self, 'governance_metrics') else 0

        report.append("RESUMO EXECUTIVO")
        report.append("-" * 40)
        report.append(f"Score Geral de Qualidade: {overall_score:.2f}%")
        report.append(f"Score de Governança: {governance_score:.2f}%")

        # Classificação
        if overall_score >= 90:
            classification = "EXCELENTE"
        elif overall_score >= 80:
            classification = "BOM"
        elif overall_score >= 70:
            classification = "REGULAR"
        elif overall_score >= 60:
            classification = "RUIM"
        else:
            classification = "CRÍTICO"

        report.append(f"Classificação Geral: {classification}")
        report.append("")

        # Detalhamento por Dimensão
        report.append("ANÁLISE POR DIMENSÃO DE QUALIDADE")
        report.append("-" * 40)

        dimensions = [
            ('Completude', 'completeness_score', 'completeness'),
            ('Consistência', 'consistency_score', 'consistency'),
            ('Precisão', 'accuracy_score', 'accuracy'),
            ('Atualidade', 'timeliness_score', 'timeliness'),
            ('Integridade', 'integrity_score', 'integrity'),
            ('Unicidade', 'uniqueness_score', 'uniqueness'),
            ('Conformidade', 'compliance_score', 'compliance')
        ]

        for dim_name, score_key, data_key in dimensions:
            score = self.quality_metrics.get(score_key, 0)
            status = "✅" if score >= 80 else "⚠️" if score >= 60 else "❌"

            report.append(f"{status} {dim_name}: {score:.2f}%")

            # Detalhes específicos por dimensão
            if data_key in self.quality_metrics:
                data = self.quality_metrics[data_key]
                if dim_name == "Completude" and isinstance(data, dict):
                    worst_field = min(data.items(), key=lambda x: x[1]['percentage'] if isinstance(x[1], dict) else 0)
                    report.append(f"   • Campo com menor completude: {worst_field[0]} ({worst_field[1]['percentage']:.1f}%)")

                elif dim_name == "Consistência" and isinstance(data, dict):
                    total_issues = sum(data.values())
                    report.append(f"   • Total de inconsistências encontradas: {total_issues}")

                elif dim_name == "Unicidade" and isinstance(data, dict):
                    duplicates = data.get('duplicate_records', 0)
                    report.append(f"   • Registros duplicados: {duplicates}")

        report.append("")

        # Governança
        if hasattr(self, 'governance_metrics') and self.governance_metrics:
            report.append("ANÁLISE DE GOVERNANÇA DE DADOS")
            report.append("-" * 40)

            gov_score = self.governance_metrics.get('governance_score', 0)
            status = "✅" if gov_score >= 80 else "⚠️" if gov_score >= 60 else "❌"

            report.append(f"{status} Score Geral de Governança: {gov_score:.2f}%")
            report.append(f"   • Catalogação de Dados: {self.governance_metrics.get('data_cataloging', 0):.2f}%")
            report.append(f"   • Linhagem de Dados: {self.governance_metrics.get('data_lineage', 0):.2f}%")
            report.append(f"   • Qualidade da Taxonomia: {self.governance_metrics.get('taxonomy_quality', 0):.2f}%")
            report.append("")

        # Recomendações Estratégicas
        report.append("RECOMENDAÇÕES ESTRATÉGICAS")
        report.append("-" * 40)

        recommendations = []

        # Recomendações baseadas nos scores
        if self.quality_metrics.get('completeness_score', 0) < 80:
            recommendations.append("🔧 PRIORIDADE ALTA: Implementar validações de entrada para melhorar completude")

        if self.quality_metrics.get('consistency_score', 0) < 80:
            recommendations.append("🔧 PRIORIDADE ALTA: Estabelecer regras de negócio para validação de consistência")

        if self.quality_metrics.get('uniqueness_score', 0) < 90:
            recommendations.append("🔧 PRIORIDADE MÉDIA: Implementar processo de deduplicação")

        if self.quality_metrics.get('compliance_score', 0) < 90:
            recommendations.append("⚖️ PRIORIDADE ALTA: Revisar conformidade com LGPD/GDPR")

        if governance_score < 80:
            recommendations.append("🏛️ PRIORIDADE MÉDIA: Fortalecer práticas de governança de dados")

        if not recommendations:
            recommendations.append("✅ Parabéns! Todos os indicadores estão em níveis aceitáveis")

        for rec in recommendations:
            report.append(f"   {rec}")

        report.append("")

        # Aspectos de Ética e Privacidade (LGPD)
        report.append("ASPECTOS DE ÉTICA E PRIVACIDADE (LGPD)")
        report.append("-" * 40)

        if 'compliance' in self.quality_metrics:
            compliance_data = self.quality_metrics['compliance']

            report.append("Verificações realizadas:")
            report.append(f"   • Rastreabilidade dos dados: {compliance_data.get('data_traceability', 0):.2f}%")
            report.append(f"   • Conformidade de retenção: {compliance_data.get('retention_compliance', 0):.2f}%")
            report.append(f"   • Dados potencialmente pessoais: {compliance_data.get('potential_personal_data', 0)}")

            report.append("")
            report.append("Recomendações LGPD:")
            report.append("   • Implementar política de retenção de dados")
            report.append("   • Documentar base legal para tratamento")
            report.append("   • Estabelecer processo de anonimização")
            report.append("   • Criar mecanismo de exercício de direitos")

        report.append("")
        report.append("=" * 80)
        report.append("Relatório gerado pelo Sistema de Monitoramento de Qualidade de Dados")
        report.append("Exercício 2 - Gestão de Dados UFG")
        report.append("=" * 80)

        # Salva o relatório
        report_text = "\n".join(report)
        with open('relatorio_qualidade_dados.txt', 'w', encoding='utf-8') as f:
            f.write(report_text)

        logging.info("✅ Relatório detalhado salvo como 'relatorio_qualidade_dados.txt'")

        return report_text

    # EXPORTAÇÃO DE MÉTRICAS
    def export_metrics_json(self):
        """
        Exporta todas as métricas em formato JSON para integração
        """
        all_metrics = {
            'timestamp': datetime.now().isoformat(),
            'database': self.db_path,
            'quality_metrics': self.quality_metrics,
            'governance_metrics': self.governance_metrics if hasattr(self, 'governance_metrics') else {}
        }

        with open('metricas_qualidade_dados.json', 'w', encoding='utf-8') as f:
            json.dump(all_metrics, f, indent=2, ensure_ascii=False)

        logging.info("✅ Métricas exportadas como 'metricas_qualidade_dados.json'")
        return all_metrics


# FUNÇÃO PRINCIPAL DE EXECUÇÃO
def main():
    """
    Função principal que executa todo o processo de monitoramento
    """
    print("🚀 SISTEMA DE MONITORAMENTO DE QUALIDADE DE DADOS")
    print("📊 Exercício 2 - Gestão Estratégica de Dados")
    print("=" * 60)

    try:
        # Verifica se o banco existe
        if not Path('movies.db').exists():
            print("❌ ERRO: Banco de dados 'movies.db' não encontrado!")
            print("   Execute primeiro o Exercício 1 para criar o banco.")
            return

        # Executa o monitoramento
        with DataQualityMonitor('movies.db') as monitor:
            print("📈 Executando avaliação completa de qualidade...")

            # Executa todas as dimensões
            results = monitor.run_full_quality_assessment()

            print(f"\n✅ RESULTADOS FINAIS:")
            print(f"   🎯 Score de Qualidade: {results['quality_score']:.2f}%")
            print(f"   🏛️ Score de Governança: {results['governance_score']:.2f}%")

            # Gera visualizações
            print("\n📊 Gerando dashboard visual...")
            monitor.generate_quality_dashboard()

            # Gera relatório detalhado
            print("📋 Gerando relatório detalhado...")
            monitor.generate_detailed_report()

            # Exporta métricas
            print("💾 Exportando métricas...")
            monitor.export_metrics_json()

            print("\n🎉 PROCESSO CONCLUÍDO COM SUCESSO!")
            print("\nArquivos gerados:")
            print("   📊 dashboard_qualidade_dados.png - Dashboard visual")
            print("   📋 relatorio_qualidade_dados.txt - Relatório detalhado")
            print("   💾 metricas_qualidade_dados.json - Métricas em JSON")
            print("   📝 quality_monitor.log - Log de execução")

    except Exception as e:
        logging.error(f"Erro durante execução: {str(e)}")
        print(f"❌ ERRO: {str(e)}")
        raise


if __name__ == "__main__":
    main()
