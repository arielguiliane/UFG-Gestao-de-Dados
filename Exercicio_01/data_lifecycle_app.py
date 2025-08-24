#!/usr/bin/env python3
"""
Aplicação de Gestão do Ciclo de Vida de Dados - Exercício 1
Implementa as 5 fases do ciclo de vida de dados:
1. Coleta - Leitura do arquivo CSV
2. Armazenamento - Criação de estrutura SQL
3. Processamento - Limpeza e padronização
4. Uso - Análises e relatórios
5. Retenção/Descarte - Políticas de retenção
"""

import pandas as pd
import sqlite3
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
import re

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('data_lifecycle.log'),
        logging.StreamHandler()
    ]
)

class DataLifecycleManager:
    """Gerenciador do ciclo de vida de dados para filmes"""
    
    def __init__(self, csv_file='movies.csv', db_file='movies.db'):
        self.csv_file = csv_file
        self.db_file = db_file
        self.conn = None
        self.raw_data = None
        self.processed_data = None
        
    def __enter__(self):
        """Context manager para conexão com banco"""
        self.conn = sqlite3.connect(self.db_file)
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Fecha conexão com banco"""
        if self.conn:
            self.conn.close()
    
    # FASE 1: COLETA DE DADOS
    def collect_data(self):
        """
        Fase 1: Coleta de dados do arquivo CSV
        Simula a recepção de dados externos não padronizados
        """
        logging.info("=== FASE 1: COLETA DE DADOS ===")
        
        try:
            # Lê o arquivo CSV
            self.raw_data = pd.read_csv(self.csv_file)
            logging.info(f"Dados coletados: {len(self.raw_data)} registros")
            logging.info(f"Colunas encontradas: {list(self.raw_data.columns)}")
            
            # Mostra estatísticas básicas dos dados coletados
            logging.info(f"Dados faltantes por coluna:")
            missing_data = self.raw_data.isnull().sum()
            for col, missing in missing_data.items():
                if missing > 0:
                    logging.info(f"  {col}: {missing} valores faltantes")
                    
            return True
            
        except Exception as e:
            logging.error(f"Erro na coleta de dados: {e}")
            return False
    
    # FASE 2: ARMAZENAMENTO
    def create_database_structure(self):
        """
        Fase 2: Armazenamento - Cria estrutura de tabelas SQL
        Define esquema normalizado para armazenamento eficiente
        """
        logging.info("=== FASE 2: ARMAZENAMENTO - CRIAÇÃO DE ESTRUTURA ===")
        
        try:
            cursor = self.conn.cursor()
            
            # Tabela principal de filmes
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS movies (
                    id INTEGER PRIMARY KEY,
                    original_id INTEGER UNIQUE,
                    title TEXT NOT NULL,
                    original_title TEXT,
                    overview TEXT,
                    release_date DATE,
                    budget INTEGER,
                    revenue INTEGER,
                    runtime REAL,
                    vote_average REAL,
                    vote_count INTEGER,
                    popularity REAL,
                    original_language TEXT,
                    status TEXT,
                    tagline TEXT,
                    homepage TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Tabela de gêneros (normalizada)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS genres (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL
                )
            ''')
            
            # Tabela de relacionamento filme-gênero
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS movie_genres (
                    movie_id INTEGER,
                    genre_id INTEGER,
                    PRIMARY KEY (movie_id, genre_id),
                    FOREIGN KEY (movie_id) REFERENCES movies(id),
                    FOREIGN KEY (genre_id) REFERENCES genres(id)
                )
            ''')
            
            # Tabela de palavras-chave
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS keywords (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    keyword TEXT UNIQUE NOT NULL
                )
            ''')
            
            # Tabela de relacionamento filme-palavra-chave
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS movie_keywords (
                    movie_id INTEGER,
                    keyword_id INTEGER,
                    PRIMARY KEY (movie_id, keyword_id),
                    FOREIGN KEY (movie_id) REFERENCES movies(id),
                    FOREIGN KEY (keyword_id) REFERENCES keywords(id)
                )
            ''')
            
            # Tabela de auditoria para rastreamento de mudanças
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS audit_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    table_name TEXT NOT NULL,
                    operation TEXT NOT NULL,
                    record_id INTEGER,
                    old_values TEXT,
                    new_values TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Índices para performance
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_movies_release_date ON movies(release_date)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_movies_budget ON movies(budget)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_movies_revenue ON movies(revenue)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_movies_vote_average ON movies(vote_average)')
            
            self.conn.commit()
            logging.info("Estrutura do banco de dados criada com sucesso")
            return True
            
        except Exception as e:
            logging.error(f"Erro na criação da estrutura: {e}")
            return False
    
    # FASE 3: PROCESSAMENTO
    def process_and_clean_data(self):
        """
        Fase 3: Processamento - Limpeza e padronização dos dados
        Trata dados inconsistentes e prepara para inserção
        """
        logging.info("=== FASE 3: PROCESSAMENTO E LIMPEZA ===")
        
        try:
            self.processed_data = self.raw_data.copy()
            
            # 1. Limpeza de dados nulos e inconsistentes
            logging.info("Limpando dados nulos e inconsistentes...")
            
            # Substitui valores nulos por padrões apropriados
            self.processed_data['budget'] = self.processed_data['budget'].fillna(0)
            self.processed_data['revenue'] = self.processed_data['revenue'].fillna(0)
            self.processed_data['runtime'] = self.processed_data['runtime'].fillna(0)
            self.processed_data['vote_average'] = self.processed_data['vote_average'].fillna(0)
            self.processed_data['vote_count'] = self.processed_data['vote_count'].fillna(0)
            self.processed_data['popularity'] = self.processed_data['popularity'].fillna(0)
            
            # 2. Padronização de datas
            logging.info("Padronizando datas...")
            self.processed_data['release_date'] = pd.to_datetime(
                self.processed_data['release_date'], 
                errors='coerce'
            )
            
            # 3. Limpeza de texto
            logging.info("Limpando campos de texto...")
            text_columns = ['title', 'original_title', 'overview', 'tagline']
            for col in text_columns:
                if col in self.processed_data.columns:
                    # Remove caracteres especiais excessivos e normaliza espaços
                    self.processed_data[col] = self.processed_data[col].astype(str)
                    self.processed_data[col] = self.processed_data[col].str.replace(r'\s+', ' ', regex=True)
                    self.processed_data[col] = self.processed_data[col].str.strip()
            
            # 4. Validação de dados numéricos
            logging.info("Validando dados numéricos...")
            
            # Remove valores negativos inválidos
            numeric_columns = ['budget', 'revenue', 'runtime', 'vote_average', 'vote_count']
            for col in numeric_columns:
                if col in self.processed_data.columns:
                    self.processed_data[col] = pd.to_numeric(self.processed_data[col], errors='coerce')
                    self.processed_data[col] = self.processed_data[col].clip(lower=0)
            
            # Validação específica para vote_average (deve estar entre 0 e 10)
            if 'vote_average' in self.processed_data.columns:
                self.processed_data['vote_average'] = self.processed_data['vote_average'].clip(upper=10)
            
            # 5. Processamento de campos complexos (JSON)
            logging.info("Processando campos complexos...")
            self._process_genres()
            self._process_keywords()
            
            logging.info(f"Processamento concluído: {len(self.processed_data)} registros processados")
            return True
            
        except Exception as e:
            logging.error(f"Erro no processamento: {e}")
            return False
    
    def _process_genres(self):
        """Processa e normaliza gêneros dos filmes"""
        if 'genres' not in self.processed_data.columns:
            return
            
        # Extrai gêneros únicos
        all_genres = set()
        for genres_str in self.processed_data['genres'].dropna():
            if isinstance(genres_str, str) and genres_str.strip():
                # Assume que gêneros estão separados por espaço
                genres = genres_str.split()
                all_genres.update(genres)
        
        # Insere gêneros na tabela
        cursor = self.conn.cursor()
        for genre in all_genres:
            cursor.execute('INSERT OR IGNORE INTO genres (name) VALUES (?)', (genre,))
        self.conn.commit()
        
        logging.info(f"Processados {len(all_genres)} gêneros únicos")
    
    def _process_keywords(self):
        """Processa e normaliza palavras-chave dos filmes"""
        if 'keywords' not in self.processed_data.columns:
            return
            
        # Extrai palavras-chave únicas
        all_keywords = set()
        for keywords_str in self.processed_data['keywords'].dropna():
            if isinstance(keywords_str, str) and keywords_str.strip():
                # Assume que keywords estão separadas por espaço
                keywords = keywords_str.split()
                all_keywords.update(keywords)
        
        # Insere keywords na tabela
        cursor = self.conn.cursor()
        for keyword in all_keywords:
            cursor.execute('INSERT OR IGNORE INTO keywords (keyword) VALUES (?)', (keyword,))
        self.conn.commit()
        
        logging.info(f"Processadas {len(all_keywords)} palavras-chave únicas")

    def store_processed_data(self):
        """
        Armazena os dados processados no banco de dados
        """
        logging.info("Armazenando dados processados no banco...")

        try:
            cursor = self.conn.cursor()

            for _, row in self.processed_data.iterrows():
                # Converte valores para tipos compatíveis com SQLite
                release_date = row.get('release_date')
                if pd.isna(release_date):
                    release_date = None
                elif hasattr(release_date, 'strftime'):
                    release_date = release_date.strftime('%Y-%m-%d')

                # Insere filme principal
                cursor.execute('''
                    INSERT OR REPLACE INTO movies (
                        original_id, title, original_title, overview, release_date,
                        budget, revenue, runtime, vote_average, vote_count,
                        popularity, original_language, status, tagline, homepage
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    int(row.get('id', 0)) if pd.notna(row.get('id')) else None,
                    str(row.get('title', '')) if pd.notna(row.get('title')) else None,
                    str(row.get('original_title', '')) if pd.notna(row.get('original_title')) else None,
                    str(row.get('overview', '')) if pd.notna(row.get('overview')) else None,
                    release_date,
                    int(row.get('budget', 0)) if pd.notna(row.get('budget')) else 0,
                    int(row.get('revenue', 0)) if pd.notna(row.get('revenue')) else 0,
                    float(row.get('runtime', 0)) if pd.notna(row.get('runtime')) else 0,
                    float(row.get('vote_average', 0)) if pd.notna(row.get('vote_average')) else 0,
                    int(row.get('vote_count', 0)) if pd.notna(row.get('vote_count')) else 0,
                    float(row.get('popularity', 0)) if pd.notna(row.get('popularity')) else 0,
                    str(row.get('original_language', '')) if pd.notna(row.get('original_language')) else None,
                    str(row.get('status', '')) if pd.notna(row.get('status')) else None,
                    str(row.get('tagline', '')) if pd.notna(row.get('tagline')) else None,
                    str(row.get('homepage', '')) if pd.notna(row.get('homepage')) else None
                ))

                movie_id = cursor.lastrowid

                # Relaciona gêneros
                if pd.notna(row.get('genres')):
                    genres = str(row['genres']).split()
                    for genre in genres:
                        cursor.execute('SELECT id FROM genres WHERE name = ?', (genre,))
                        genre_result = cursor.fetchone()
                        if genre_result:
                            cursor.execute('''
                                INSERT OR IGNORE INTO movie_genres (movie_id, genre_id)
                                VALUES (?, ?)
                            ''', (movie_id, genre_result[0]))

                # Relaciona palavras-chave
                if pd.notna(row.get('keywords')):
                    keywords = str(row['keywords']).split()
                    for keyword in keywords:
                        cursor.execute('SELECT id FROM keywords WHERE keyword = ?', (keyword,))
                        keyword_result = cursor.fetchone()
                        if keyword_result:
                            cursor.execute('''
                                INSERT OR IGNORE INTO movie_keywords (movie_id, keyword_id)
                                VALUES (?, ?)
                            ''', (movie_id, keyword_result[0]))

            self.conn.commit()
            logging.info("Dados armazenados com sucesso")
            return True

        except Exception as e:
            logging.error(f"Erro no armazenamento: {e}")
            return False

    # FASE 4: USO DOS DADOS
    def generate_reports(self):
        """
        Fase 4: Uso - Gera relatórios e análises dos dados
        """
        logging.info("=== FASE 4: USO DOS DADOS - GERAÇÃO DE RELATÓRIOS ===")

        try:
            reports = {}

            # Relatório 1: Estatísticas gerais
            reports['estatisticas_gerais'] = self._generate_general_stats()

            # Relatório 2: Top filmes por receita
            reports['top_filmes_receita'] = self._generate_top_revenue_movies()

            # Relatório 3: Análise por gênero
            reports['analise_generos'] = self._generate_genre_analysis()

            # Relatório 4: Tendências temporais
            reports['tendencias_temporais'] = self._generate_temporal_trends()

            # Relatório 5: Análise de qualidade
            reports['analise_qualidade'] = self._generate_quality_analysis()

            # Salva relatórios em arquivo
            self._save_reports(reports)

            logging.info("Relatórios gerados com sucesso")
            return reports

        except Exception as e:
            logging.error(f"Erro na geração de relatórios: {e}")
            return None

    def _generate_general_stats(self):
        """Gera estatísticas gerais dos filmes"""
        cursor = self.conn.cursor()

        stats = {}

        # Total de filmes
        cursor.execute('SELECT COUNT(*) FROM movies')
        stats['total_filmes'] = cursor.fetchone()[0]

        # Orçamento médio
        cursor.execute('SELECT AVG(budget) FROM movies WHERE budget > 0')
        result = cursor.fetchone()
        stats['orcamento_medio'] = round(result[0], 2) if result[0] else 0

        # Receita média
        cursor.execute('SELECT AVG(revenue) FROM movies WHERE revenue > 0')
        result = cursor.fetchone()
        stats['receita_media'] = round(result[0], 2) if result[0] else 0

        # Nota média
        cursor.execute('SELECT AVG(vote_average) FROM movies WHERE vote_average > 0')
        result = cursor.fetchone()
        stats['nota_media'] = round(result[0], 2) if result[0] else 0

        # Duração média
        cursor.execute('SELECT AVG(runtime) FROM movies WHERE runtime > 0')
        result = cursor.fetchone()
        stats['duracao_media'] = round(result[0], 2) if result[0] else 0

        return stats

    def _generate_top_revenue_movies(self, limit=10):
        """Gera lista dos filmes com maior receita"""
        cursor = self.conn.cursor()

        cursor.execute('''
            SELECT title, revenue, budget, (revenue - budget) as profit
            FROM movies
            WHERE revenue > 0
            ORDER BY revenue DESC
            LIMIT ?
        ''', (limit,))

        results = cursor.fetchall()
        return [
            {
                'titulo': row[0],
                'receita': row[1],
                'orcamento': row[2],
                'lucro': row[3]
            }
            for row in results
        ]

    def _generate_genre_analysis(self):
        """Análise por gênero"""
        cursor = self.conn.cursor()

        cursor.execute('''
            SELECT g.name,
                   COUNT(*) as total_filmes,
                   AVG(m.vote_average) as nota_media,
                   AVG(m.revenue) as receita_media,
                   AVG(m.budget) as orcamento_medio
            FROM genres g
            JOIN movie_genres mg ON g.id = mg.genre_id
            JOIN movies m ON mg.movie_id = m.id
            WHERE m.vote_average > 0
            GROUP BY g.name
            ORDER BY total_filmes DESC
        ''')

        results = cursor.fetchall()
        return [
            {
                'genero': row[0],
                'total_filmes': row[1],
                'nota_media': round(row[2], 2),
                'receita_media': round(row[3], 2) if row[3] else 0,
                'orcamento_medio': round(row[4], 2) if row[4] else 0
            }
            for row in results
        ]

    def _generate_temporal_trends(self):
        """Análise de tendências temporais"""
        cursor = self.conn.cursor()

        cursor.execute('''
            SELECT strftime('%Y', release_date) as ano,
                   COUNT(*) as total_filmes,
                   AVG(budget) as orcamento_medio,
                   AVG(revenue) as receita_media,
                   AVG(vote_average) as nota_media
            FROM movies
            WHERE release_date IS NOT NULL
            AND strftime('%Y', release_date) BETWEEN '2000' AND '2020'
            GROUP BY strftime('%Y', release_date)
            ORDER BY ano
        ''')

        results = cursor.fetchall()
        return [
            {
                'ano': row[0],
                'total_filmes': row[1],
                'orcamento_medio': round(row[2], 2) if row[2] else 0,
                'receita_media': round(row[3], 2) if row[3] else 0,
                'nota_media': round(row[4], 2) if row[4] else 0
            }
            for row in results
        ]

    def _generate_quality_analysis(self):
        """Análise de qualidade dos dados"""
        cursor = self.conn.cursor()

        analysis = {}

        # Completude dos dados
        cursor.execute('SELECT COUNT(*) FROM movies')
        total = cursor.fetchone()[0]

        fields_to_check = [
            'title', 'release_date', 'budget', 'revenue',
            'runtime', 'vote_average', 'overview'
        ]

        completeness = {}
        for field in fields_to_check:
            cursor.execute(f'''
                SELECT COUNT(*) FROM movies
                WHERE {field} IS NOT NULL
                AND {field} != ''
                AND {field} != 0
            ''')
            count = cursor.fetchone()[0]
            completeness[field] = round((count / total) * 100, 2)

        analysis['completude'] = completeness

        # Consistência
        cursor.execute('''
            SELECT COUNT(*) FROM movies
            WHERE revenue > 0 AND budget > 0 AND revenue < budget
        ''')
        inconsistent_profit = cursor.fetchone()[0]

        analysis['inconsistencias'] = {
            'filmes_com_receita_menor_que_orcamento': inconsistent_profit
        }

        return analysis

    def _save_reports(self, reports):
        """Salva relatórios em arquivo JSON"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'relatorios_filmes_{timestamp}.json'

        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(reports, f, indent=2, ensure_ascii=False, default=str)

        logging.info(f"Relatórios salvos em: {filename}")

    # FASE 5: RETENÇÃO E DESCARTE
    def implement_retention_policy(self):
        """
        Fase 5: Retenção/Descarte - Implementa políticas de retenção
        """
        logging.info("=== FASE 5: RETENÇÃO E DESCARTE ===")

        try:
            # Política 1: Arquivar filmes muito antigos (antes de 1980)
            archived_count = self._archive_old_movies()

            # Política 2: Remover dados de auditoria antigos (mais de 1 ano)
            cleaned_audit_count = self._clean_old_audit_logs()

            # Política 3: Backup de dados importantes
            backup_success = self._backup_important_data()

            # Política 4: Limpeza de dados duplicados
            duplicates_removed = self._remove_duplicates()

            retention_summary = {
                'filmes_arquivados': archived_count,
                'logs_auditoria_removidos': cleaned_audit_count,
                'backup_realizado': backup_success,
                'duplicatas_removidas': duplicates_removed,
                'data_execucao': datetime.now().isoformat()
            }

            # Registra no log de auditoria
            self._log_retention_activity(retention_summary)

            logging.info(f"Política de retenção aplicada: {retention_summary}")
            return retention_summary

        except Exception as e:
            logging.error(f"Erro na aplicação da política de retenção: {e}")
            return None

    def _archive_old_movies(self):
        """Arquiva filmes muito antigos"""
        cursor = self.conn.cursor()

        # Cria tabela de arquivo se não existir
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS movies_archive (
                id INTEGER PRIMARY KEY,
                original_id INTEGER,
                title TEXT,
                release_date DATE,
                archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Move filmes antes de 1980 para arquivo
        cursor.execute('''
            INSERT INTO movies_archive (original_id, title, release_date)
            SELECT original_id, title, release_date
            FROM movies
            WHERE release_date < '1980-01-01'
        ''')

        archived_count = cursor.rowcount

        # Remove da tabela principal
        cursor.execute("DELETE FROM movies WHERE release_date < '1980-01-01'")

        self.conn.commit()
        return archived_count

    def _clean_old_audit_logs(self):
        """Remove logs de auditoria antigos"""
        cursor = self.conn.cursor()

        one_year_ago = datetime.now() - timedelta(days=365)
        cursor.execute(
            "DELETE FROM audit_log WHERE timestamp < ?",
            (one_year_ago,)
        )

        cleaned_count = cursor.rowcount
        self.conn.commit()
        return cleaned_count

    def _backup_important_data(self):
        """Cria backup dos dados importantes"""
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_file = f'backup_movies_{timestamp}.sql'

            # Backup usando sqlite3
            with open(backup_file, 'w') as f:
                for line in self.conn.iterdump():
                    f.write('%s\n' % line)

            logging.info(f"Backup criado: {backup_file}")
            return True

        except Exception as e:
            logging.error(f"Erro no backup: {e}")
            return False

    def _remove_duplicates(self):
        """Remove filmes duplicados baseado no título e ano"""
        cursor = self.conn.cursor()

        cursor.execute('''
            DELETE FROM movies
            WHERE id NOT IN (
                SELECT MIN(id)
                FROM movies
                GROUP BY title, strftime('%Y', release_date)
            )
        ''')

        duplicates_removed = cursor.rowcount
        self.conn.commit()
        return duplicates_removed

    def _log_retention_activity(self, summary):
        """Registra atividade de retenção no log de auditoria"""
        cursor = self.conn.cursor()

        cursor.execute('''
            INSERT INTO audit_log (table_name, operation, new_values)
            VALUES (?, ?, ?)
        ''', ('retention_policy', 'RETENTION_APPLIED', json.dumps(summary)))

        self.conn.commit()

    # MÉTODO PRINCIPAL
    def run_complete_lifecycle(self):
        """
        Executa o ciclo completo de vida dos dados
        """
        logging.info("=== INICIANDO CICLO COMPLETO DE VIDA DOS DADOS ===")

        success_steps = []

        # Fase 1: Coleta
        if self.collect_data():
            success_steps.append("Coleta")
        else:
            logging.error("Falha na coleta de dados. Interrompendo processo.")
            return False

        # Fase 2: Armazenamento
        if self.create_database_structure():
            success_steps.append("Armazenamento")
        else:
            logging.error("Falha na criação da estrutura. Interrompendo processo.")
            return False

        # Fase 3: Processamento
        if self.process_and_clean_data() and self.store_processed_data():
            success_steps.append("Processamento")
        else:
            logging.error("Falha no processamento. Interrompendo processo.")
            return False

        # Fase 4: Uso
        reports = self.generate_reports()
        if reports:
            success_steps.append("Uso")
        else:
            logging.error("Falha na geração de relatórios. Continuando...")

        # Fase 5: Retenção
        retention_result = self.implement_retention_policy()
        if retention_result:
            success_steps.append("Retenção")
        else:
            logging.error("Falha na política de retenção. Continuando...")

        logging.info(f"Ciclo concluído. Fases executadas: {', '.join(success_steps)}")
        return True


def main():
    """Função principal"""
    print("=== APLICAÇÃO DE GESTÃO DO CICLO DE VIDA DE DADOS ===")
    print("Exercício 1 - Gestão de Dados")
    print()

    # Verifica se o arquivo CSV existe
    if not Path('movies.csv').exists():
        print("ERRO: Arquivo 'movies.csv' não encontrado!")
        print("Certifique-se de que o arquivo está na mesma pasta da aplicação.")
        return

    # Executa o ciclo completo
    with DataLifecycleManager() as dlm:
        success = dlm.run_complete_lifecycle()

        if success:
            print("\n✅ Ciclo de vida dos dados executado com sucesso!")
            print("\nArquivos gerados:")
            print("- movies.db (banco de dados)")
            print("- relatorios_filmes_*.json (relatórios)")
            print("- backup_movies_*.sql (backup)")
            print("- data_lifecycle.log (log de execução)")
        else:
            print("\n❌ Erro durante a execução do ciclo de vida dos dados.")
            print("Verifique o arquivo de log para mais detalhes.")


if __name__ == "__main__":
    main()
