-- =====================================================
-- ESTRUTURA DO BANCO DE DADOS - GESTÃO DE FILMES
-- Exercício 1 - Gestão de Dados
-- =====================================================

-- Tabela principal de filmes
-- Armazena informações básicas de cada filme
CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_id INTEGER UNIQUE,                -- ID original do dataset
    title TEXT NOT NULL,                       -- Título do filme
    original_title TEXT,                       -- Título original
    overview TEXT,                             -- Sinopse
    release_date DATE,                         -- Data de lançamento
    budget INTEGER DEFAULT 0,                  -- Orçamento
    revenue INTEGER DEFAULT 0,                 -- Receita
    runtime REAL DEFAULT 0,                    -- Duração em minutos
    vote_average REAL DEFAULT 0,               -- Nota média (0-10)
    vote_count INTEGER DEFAULT 0,              -- Número de votos
    popularity REAL DEFAULT 0,                 -- Índice de popularidade
    original_language TEXT,                    -- Idioma original
    status TEXT,                               -- Status (Released, etc.)
    tagline TEXT,                              -- Slogan do filme
    homepage TEXT,                             -- Site oficial
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de gêneros (normalizada)
-- Evita redundância armazenando gêneros únicos
CREATE TABLE IF NOT EXISTS genres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL                  -- Nome do gênero
);

-- Tabela de relacionamento filme-gênero (N:N)
-- Um filme pode ter múltiplos gêneros
CREATE TABLE IF NOT EXISTS movie_genres (
    movie_id INTEGER,
    genre_id INTEGER,
    PRIMARY KEY (movie_id, genre_id),
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
);

-- Tabela de palavras-chave (normalizada)
-- Armazena keywords únicas para classificação
CREATE TABLE IF NOT EXISTS keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT UNIQUE NOT NULL              -- Palavra-chave
);

-- Tabela de relacionamento filme-palavra-chave (N:N)
-- Um filme pode ter múltiplas palavras-chave
CREATE TABLE IF NOT EXISTS movie_keywords (
    movie_id INTEGER,
    keyword_id INTEGER,
    PRIMARY KEY (movie_id, keyword_id),
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (keyword_id) REFERENCES keywords(id) ON DELETE CASCADE
);

-- Tabela de auditoria
-- Rastreia todas as mudanças nos dados para compliance
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,                 -- Tabela afetada
    operation TEXT NOT NULL,                  -- Operação (INSERT, UPDATE, DELETE)
    record_id INTEGER,                        -- ID do registro afetado
    old_values TEXT,                          -- Valores antigos (JSON)
    new_values TEXT,                          -- Valores novos (JSON)
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de arquivo para dados antigos
-- Implementa política de retenção movendo dados antigos
CREATE TABLE IF NOT EXISTS movies_archive (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_id INTEGER,
    title TEXT,
    release_date DATE,
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archive_reason TEXT DEFAULT 'OLD_DATA'    -- Motivo do arquivamento
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices na tabela principal
CREATE INDEX IF NOT EXISTS idx_movies_release_date ON movies(release_date);
CREATE INDEX IF NOT EXISTS idx_movies_budget ON movies(budget);
CREATE INDEX IF NOT EXISTS idx_movies_revenue ON movies(revenue);
CREATE INDEX IF NOT EXISTS idx_movies_vote_average ON movies(vote_average);
CREATE INDEX IF NOT EXISTS idx_movies_popularity ON movies(popularity);
CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title);

-- Índices nas tabelas de relacionamento
CREATE INDEX IF NOT EXISTS idx_movie_genres_movie ON movie_genres(movie_id);
CREATE INDEX IF NOT EXISTS idx_movie_genres_genre ON movie_genres(genre_id);
CREATE INDEX IF NOT EXISTS idx_movie_keywords_movie ON movie_keywords(movie_id);
CREATE INDEX IF NOT EXISTS idx_movie_keywords_keyword ON movie_keywords(keyword_id);

-- Índices na tabela de auditoria
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_log(table_name);

-- =====================================================
-- VIEWS PARA RELATÓRIOS
-- =====================================================

-- View com informações completas dos filmes
CREATE VIEW IF NOT EXISTS vw_movies_complete AS
SELECT 
    m.id,
    m.title,
    m.original_title,
    m.release_date,
    m.budget,
    m.revenue,
    (m.revenue - m.budget) AS profit,
    m.runtime,
    m.vote_average,
    m.vote_count,
    m.popularity,
    m.original_language,
    m.status,
    GROUP_CONCAT(DISTINCT g.name, ', ') AS genres,
    GROUP_CONCAT(DISTINCT k.keyword, ', ') AS keywords
FROM movies m
LEFT JOIN movie_genres mg ON m.id = mg.movie_id
LEFT JOIN genres g ON mg.genre_id = g.id
LEFT JOIN movie_keywords mk ON m.id = mk.movie_id
LEFT JOIN keywords k ON mk.keyword_id = k.id
GROUP BY m.id;

-- View de estatísticas por gênero
CREATE VIEW IF NOT EXISTS vw_genre_stats AS
SELECT 
    g.name AS genre,
    COUNT(*) AS total_movies,
    AVG(m.vote_average) AS avg_rating,
    AVG(m.budget) AS avg_budget,
    AVG(m.revenue) AS avg_revenue,
    AVG(m.revenue - m.budget) AS avg_profit,
    AVG(m.runtime) AS avg_runtime
FROM genres g
JOIN movie_genres mg ON g.id = mg.genre_id
JOIN movies m ON mg.movie_id = m.id
WHERE m.vote_average > 0
GROUP BY g.id, g.name
ORDER BY total_movies DESC;

-- View de tendências anuais
CREATE VIEW IF NOT EXISTS vw_yearly_trends AS
SELECT 
    strftime('%Y', release_date) AS year,
    COUNT(*) AS total_movies,
    AVG(budget) AS avg_budget,
    AVG(revenue) AS avg_revenue,
    AVG(vote_average) AS avg_rating,
    AVG(runtime) AS avg_runtime
FROM movies 
WHERE release_date IS NOT NULL
GROUP BY strftime('%Y', release_date)
ORDER BY year;

-- =====================================================
-- TRIGGERS PARA AUDITORIA AUTOMÁTICA
-- =====================================================

-- Trigger para auditoria de inserções
CREATE TRIGGER IF NOT EXISTS trg_movies_insert_audit
AFTER INSERT ON movies
BEGIN
    INSERT INTO audit_log (table_name, operation, record_id, new_values)
    VALUES ('movies', 'INSERT', NEW.id, 
            json_object('title', NEW.title, 'budget', NEW.budget, 'revenue', NEW.revenue));
END;

-- Trigger para auditoria de atualizações
CREATE TRIGGER IF NOT EXISTS trg_movies_update_audit
AFTER UPDATE ON movies
BEGIN
    INSERT INTO audit_log (table_name, operation, record_id, old_values, new_values)
    VALUES ('movies', 'UPDATE', NEW.id,
            json_object('title', OLD.title, 'budget', OLD.budget, 'revenue', OLD.revenue),
            json_object('title', NEW.title, 'budget', NEW.budget, 'revenue', NEW.revenue));
END;

-- Trigger para auditoria de exclusões
CREATE TRIGGER IF NOT EXISTS trg_movies_delete_audit
AFTER DELETE ON movies
BEGIN
    INSERT INTO audit_log (table_name, operation, record_id, old_values)
    VALUES ('movies', 'DELETE', OLD.id,
            json_object('title', OLD.title, 'budget', OLD.budget, 'revenue', OLD.revenue));
END;

-- =====================================================
-- CONSULTAS ÚTEIS PARA ANÁLISE
-- =====================================================

-- Top 10 filmes por receita
-- SELECT title, revenue, budget, (revenue - budget) as profit 
-- FROM movies 
-- WHERE revenue > 0 
-- ORDER BY revenue DESC 
-- LIMIT 10;

-- Filmes por década
-- SELECT 
--     CASE 
--         WHEN strftime('%Y', release_date) BETWEEN '1980' AND '1989' THEN '1980s'
--         WHEN strftime('%Y', release_date) BETWEEN '1990' AND '1999' THEN '1990s'
--         WHEN strftime('%Y', release_date) BETWEEN '2000' AND '2009' THEN '2000s'
--         WHEN strftime('%Y', release_date) BETWEEN '2010' AND '2019' THEN '2010s'
--         ELSE 'Other'
--     END as decade,
--     COUNT(*) as total_movies,
--     AVG(vote_average) as avg_rating
-- FROM movies 
-- WHERE release_date IS NOT NULL
-- GROUP BY decade
-- ORDER BY decade;

-- Análise de ROI (Return on Investment)
-- SELECT title, budget, revenue,
--        ROUND(((revenue - budget) * 100.0 / budget), 2) as roi_percentage
-- FROM movies 
-- WHERE budget > 0 AND revenue > 0
-- ORDER BY roi_percentage DESC
-- LIMIT 20;
