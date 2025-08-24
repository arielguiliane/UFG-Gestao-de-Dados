#!/usr/bin/env python3
"""
Demonstração do Exercício 2 - Sistema de Monitoramento de Qualidade de Dados
Este script demonstra como usar o sistema de monitoramento implementado.
"""

from data_quality_monitor import DataQualityMonitor
import matplotlib.pyplot as plt
from pathlib import Path

def demo_individual_dimensions():
    """
    Demonstra o monitoramento individual de cada dimensão
    """
    print("🔍 DEMONSTRAÇÃO: Monitoramento Individual das Dimensões")
    print("=" * 60)
    
    with DataQualityMonitor('movies.db') as monitor:
        
        # 1. Completude
        print("\n1️⃣ DIMENSÃO: COMPLETUDE")
        print("-" * 30)
        completeness = monitor.monitor_completeness()
        
        print("Completude por campo:")
        for field, data in completeness.items():
            print(f"   • {field}: {data['percentage']:.1f}% ({data['filled']}/{data['total']})")
        
        # 2. Consistência
        print("\n2️⃣ DIMENSÃO: CONSISTÊNCIA")
        print("-" * 30)
        consistency = monitor.monitor_consistency()
        
        print("Problemas encontrados:")
        for issue, count in consistency.items():
            if count > 0:
                print(f"   • {issue.replace('_', ' ').title()}: {count} casos")
        
        # 3. Precisão
        print("\n3️⃣ DIMENSÃO: PRECISÃO")
        print("-" * 30)
        accuracy = monitor.monitor_accuracy()
        
        print("Métricas de precisão:")
        for metric, value in accuracy.items():
            print(f"   • {metric.replace('_', ' ').title()}: {value:.1f}%")
        
        # 4. Atualidade
        print("\n4️⃣ DIMENSÃO: ATUALIDADE")
        print("-" * 30)
        timeliness = monitor.monitor_timeliness()
        
        print(f"   • Dados recentes (últimos 10 anos): {timeliness['recent_data_percentage']:.1f}%")
        print(f"   • Idade média dos dados: {timeliness['average_age_years']:.1f} anos")
        
        # 5. Integridade
        print("\n5️⃣ DIMENSÃO: INTEGRIDADE")
        print("-" * 30)
        integrity = monitor.monitor_integrity()
        
        print(f"   • Filmes com gêneros: {integrity['genre_relationship_integrity']:.1f}%")
        print(f"   • Filmes com palavras-chave: {integrity['keyword_relationship_integrity']:.1f}%")
        print(f"   • IDs duplicados: {integrity['duplicate_ids']}")
        
        # 6. Unicidade
        print("\n6️⃣ DIMENSÃO: UNICIDADE")
        print("-" * 30)
        uniqueness = monitor.monitor_uniqueness()
        
        print(f"   • Registros únicos: {uniqueness['uniqueness_percentage']:.1f}%")
        print(f"   • Títulos duplicados: {uniqueness['title_duplicates']}")
        print(f"   • Duplicatas por título+ano: {uniqueness['title_year_duplicates']}")
        
        # 7. Conformidade
        print("\n7️⃣ DIMENSÃO: CONFORMIDADE (LGPD)")
        print("-" * 30)
        compliance = monitor.monitor_compliance()
        
        print(f"   • Rastreabilidade: {compliance['data_traceability']:.1f}%")
        print(f"   • Conformidade de retenção: {compliance['retention_compliance']:.1f}%")
        print(f"   • Dados potencialmente pessoais: {compliance['potential_personal_data']}")

def demo_governance():
    """
    Demonstra o monitoramento de governança
    """
    print("\n🏛️ DEMONSTRAÇÃO: Governança de Dados")
    print("=" * 60)
    
    with DataQualityMonitor('movies.db') as monitor:
        governance = monitor.monitor_data_governance()
        
        print("Aspectos de Governança:")
        print(f"   • Catalogação de dados: {governance['data_cataloging']:.1f}%")
        print(f"   • Linhagem de dados: {governance['data_lineage']:.1f}%")
        print(f"   • Qualidade da taxonomia: {governance['taxonomy_quality']:.1f}%")
        
        print("\nCompletude de Metadados:")
        metadata = governance['metadata_completeness']
        for field, percentage in metadata.items():
            print(f"   • {field.title()}: {percentage:.1f}%")

def demo_custom_analysis():
    """
    Demonstra análises customizadas
    """
    print("\n🔬 DEMONSTRAÇÃO: Análises Customizadas")
    print("=" * 60)
    
    with DataQualityMonitor('movies.db') as monitor:
        cursor = monitor.conn.cursor()
        
        # Análise 1: Top 10 filmes com melhor ROI
        print("\n📈 TOP 10 FILMES COM MELHOR ROI:")
        cursor.execute("""
            SELECT title, budget, revenue, 
                   ROUND(((revenue - budget) * 100.0 / budget), 2) as roi
            FROM movies 
            WHERE budget > 100000 AND revenue > budget
            ORDER BY roi DESC
            LIMIT 10
        """)
        
        roi_results = cursor.fetchall()
        for i, movie in enumerate(roi_results, 1):
            print(f"   {i:2d}. {movie['title'][:40]:<40} ROI: {movie['roi']:>8.1f}%")
        
        # Análise 2: Distribuição de qualidade por década
        print("\n📊 QUALIDADE POR DÉCADA:")
        cursor.execute("""
            SELECT 
                CASE 
                    WHEN strftime('%Y', release_date) BETWEEN '2020' AND '2029' THEN '2020s'
                    WHEN strftime('%Y', release_date) BETWEEN '2010' AND '2019' THEN '2010s'
                    WHEN strftime('%Y', release_date) BETWEEN '2000' AND '2009' THEN '2000s'
                    WHEN strftime('%Y', release_date) BETWEEN '1990' AND '1999' THEN '1990s'
                    ELSE 'Anterior'
                END as decade,
                COUNT(*) as total,
                AVG(vote_average) as avg_rating,
                COUNT(CASE WHEN budget > 0 THEN 1 END) as with_budget,
                COUNT(CASE WHEN revenue > 0 THEN 1 END) as with_revenue
            FROM movies 
            WHERE release_date IS NOT NULL
            GROUP BY decade
            ORDER BY decade DESC
        """)
        
        decade_results = cursor.fetchall()
        for decade in decade_results:
            budget_pct = (decade['with_budget'] / decade['total'] * 100) if decade['total'] > 0 else 0
            revenue_pct = (decade['with_revenue'] / decade['total'] * 100) if decade['total'] > 0 else 0
            
            print(f"   {decade['decade']}: {decade['total']:4d} filmes | "
                  f"Nota média: {decade['avg_rating']:.1f} | "
                  f"Com orçamento: {budget_pct:.1f}% | "
                  f"Com receita: {revenue_pct:.1f}%")

def demo_alerts_and_recommendations():
    """
    Demonstra sistema de alertas e recomendações
    """
    print("\n🚨 DEMONSTRAÇÃO: Alertas e Recomendações")
    print("=" * 60)
    
    with DataQualityMonitor('movies.db') as monitor:
        # Executa avaliação completa
        results = monitor.run_full_quality_assessment()
        
        # Gera alertas baseados nos scores
        alerts = []
        recommendations = []
        
        # Verifica cada dimensão
        dimensions = [
            ('Completude', monitor.quality_metrics.get('completeness_score', 0)),
            ('Consistência', monitor.quality_metrics.get('consistency_score', 0)),
            ('Precisão', monitor.quality_metrics.get('accuracy_score', 0)),
            ('Atualidade', monitor.quality_metrics.get('timeliness_score', 0)),
            ('Integridade', monitor.quality_metrics.get('integrity_score', 0)),
            ('Unicidade', monitor.quality_metrics.get('uniqueness_score', 0)),
            ('Conformidade', monitor.quality_metrics.get('compliance_score', 0))
        ]
        
        for dim_name, score in dimensions:
            if score < 60:
                alerts.append(f"🔴 CRÍTICO: {dim_name} com score muito baixo ({score:.1f}%)")
                recommendations.append(f"   → Ação imediata necessária para {dim_name.lower()}")
            elif score < 80:
                alerts.append(f"🟡 ATENÇÃO: {dim_name} precisa de melhoria ({score:.1f}%)")
                recommendations.append(f"   → Planejar melhorias para {dim_name.lower()}")
        
        # Exibe alertas
        if alerts:
            print("ALERTAS IDENTIFICADOS:")
            for alert in alerts:
                print(f"   {alert}")
        else:
            print("✅ Nenhum alerta crítico identificado!")
        
        # Exibe recomendações
        if recommendations:
            print("\nRECOMENDAÇÕES:")
            for rec in recommendations:
                print(f"   {rec}")
        
        # Score geral
        overall_score = results['quality_score']
        governance_score = results['governance_score']
        
        print(f"\n📊 RESUMO FINAL:")
        print(f"   🎯 Qualidade Geral: {overall_score:.1f}%")
        print(f"   🏛️ Governança: {governance_score:.1f}%")
        
        # Classificação final
        if overall_score >= 90:
            classification = "🏆 EXCELENTE"
        elif overall_score >= 80:
            classification = "✅ BOM"
        elif overall_score >= 70:
            classification = "⚠️ REGULAR"
        elif overall_score >= 60:
            classification = "❌ RUIM"
        else:
            classification = "🚨 CRÍTICO"
        
        print(f"   📈 Classificação: {classification}")

def main():
    """
    Executa todas as demonstrações
    """
    print("🎬 DEMONSTRAÇÃO COMPLETA - EXERCÍCIO 2")
    print("Sistema de Monitoramento de Qualidade de Dados")
    print("=" * 80)
    
    # Verifica se o banco existe
    if not Path('movies.db').exists():
        print("❌ ERRO: Banco de dados 'movies.db' não encontrado!")
        print("   Execute primeiro o Exercício 1 para criar o banco.")
        return
    
    try:
        # Executa demonstrações
        demo_individual_dimensions()
        demo_governance()
        demo_custom_analysis()
        demo_alerts_and_recommendations()
        
        print("\n" + "=" * 80)
        print("🎉 DEMONSTRAÇÃO CONCLUÍDA!")
        print("\nPara executar o sistema completo, use:")
        print("   python data_quality_monitor.py")
        print("\nIsso gerará:")
        print("   📊 Dashboard visual (PNG)")
        print("   📋 Relatório detalhado (TXT)")
        print("   💾 Métricas em JSON")
        print("   📝 Log de execução")
        
    except Exception as e:
        print(f"❌ ERRO durante demonstração: {str(e)}")
        raise

if __name__ == "__main__":
    main()
