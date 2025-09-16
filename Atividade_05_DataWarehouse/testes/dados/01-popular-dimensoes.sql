-- =====================================================
-- Dados de Teste - Popular Dimensões
-- =====================================================

-- Popular Dimensão Cliente
INSERT INTO DIM_CLIENTE (
    id_cliente_natural, nome_cliente, email, telefone, data_nascimento,
    genero, estado_civil, profissao, renda_estimada, segmento_cliente,
    cidade, estado, cep, data_inicio_vigencia, data_fim_vigencia, registro_ativo
) VALUES
('CLI001', 'João Silva', 'joao.silva@email.com', '11999887766', '1985-03-15', 'M', 'Casado', 'Engenheiro', 8500.00, 'Premium', 'São Paulo', 'SP', '01234567', '2020-01-01', NULL, TRUE),
('CLI002', 'Maria Santos', 'maria.santos@email.com', '11888776655', '1990-07-22', 'F', 'Solteira', 'Advogada', 12000.00, 'VIP', 'Rio de Janeiro', 'RJ', '20123456', '2020-01-01', NULL, TRUE),
('CLI003', 'Pedro Oliveira', 'pedro.oliveira@email.com', '11777665544', '1988-11-08', 'M', 'Casado', 'Professor', 4500.00, 'Regular', 'Belo Horizonte', 'MG', '30123456', '2020-01-01', NULL, TRUE),
('CLI004', 'Ana Costa', 'ana.costa@email.com', '11666554433', '1992-05-30', 'F', 'Solteira', 'Designer', 6000.00, 'Premium', 'Porto Alegre', 'RS', '90123456', '2020-01-01', NULL, TRUE),
('CLI005', 'Carlos Ferreira', 'carlos.ferreira@email.com', '11555443322', '1980-12-12', 'M', 'Divorciado', 'Médico', 15000.00, 'VIP', 'Salvador', 'BA', '40123456', '2020-01-01', NULL, TRUE),
('CLI006', 'Lucia Mendes', 'lucia.mendes@email.com', '11444332211', '1995-09-18', 'F', 'Solteira', 'Estudante', 2000.00, 'Básico', 'Fortaleza', 'CE', '60123456', '2020-01-01', NULL, TRUE),
('CLI007', 'Roberto Lima', 'roberto.lima@email.com', '11333221100', '1987-04-25', 'M', 'Casado', 'Contador', 7000.00, 'Premium', 'Recife', 'PE', '50123456', '2020-01-01', NULL, TRUE),
('CLI008', 'Fernanda Rocha', 'fernanda.rocha@email.com', '11222110099', '1993-08-14', 'F', 'Casada', 'Jornalista', 5500.00, 'Regular', 'Curitiba', 'PR', '80123456', '2020-01-01', NULL, TRUE),
('CLI009', 'Marcos Alves', 'marcos.alves@email.com', '11111009988', '1991-01-07', 'M', 'Solteiro', 'Programador', 9000.00, 'Premium', 'Brasília', 'DF', '70123456', '2020-01-01', NULL, TRUE),
('CLI010', 'Juliana Barbosa', 'juliana.barbosa@email.com', '11000998877', '1989-06-03', 'F', 'Casada', 'Arquiteta', 8000.00, 'Premium', 'Goiânia', 'GO', '74123456', '2020-01-01', NULL, TRUE);

-- Popular Dimensão Produto
INSERT INTO DIM_PRODUTO (
    id_produto_natural, nome_produto, descricao_produto, categoria_nivel1,
    categoria_nivel2, categoria_nivel3, marca, fornecedor, cor, tamanho,
    peso, preco_sugerido, status_produto
) VALUES
('PROD001', 'Smartphone Galaxy S23', 'Smartphone Samsung Galaxy S23 128GB', 'Eletrônicos', 'Celulares', 'Smartphones', 'Samsung', 'Samsung Brasil', 'Preto', 'Único', 0.168, 2499.99, 'ATIVO'),
('PROD002', 'Notebook Dell Inspiron', 'Notebook Dell Inspiron 15 i5 8GB 256GB SSD', 'Eletrônicos', 'Informática', 'Notebooks', 'Dell', 'Dell Brasil', 'Prata', 'Único', 1.850, 3299.99, 'ATIVO'),
('PROD003', 'Camiseta Nike Dri-Fit', 'Camiseta esportiva Nike Dri-Fit masculina', 'Roupas', 'Masculino', 'Camisetas', 'Nike', 'Nike Brasil', 'Azul', 'M', 0.200, 89.99, 'ATIVO'),
('PROD004', 'Tênis Adidas Ultraboost', 'Tênis de corrida Adidas Ultraboost 22', 'Calçados', 'Esportivos', 'Corrida', 'Adidas', 'Adidas Brasil', 'Branco', '42', 0.350, 699.99, 'ATIVO'),
('PROD005', 'Livro "Clean Code"', 'Livro Clean Code - Robert C. Martin', 'Livros', 'Técnicos', 'Programação', 'Pearson', 'Editora Pearson', 'Único', 'Único', 0.500, 89.90, 'ATIVO'),
('PROD006', 'Fone JBL Tune 510BT', 'Fone de ouvido Bluetooth JBL Tune 510BT', 'Eletrônicos', 'Áudio', 'Fones', 'JBL', 'JBL Brasil', 'Preto', 'Único', 0.160, 199.99, 'ATIVO'),
('PROD007', 'Cafeteira Nespresso', 'Cafeteira Nespresso Essenza Mini', 'Casa', 'Cozinha', 'Cafeteiras', 'Nespresso', 'Nestlé', 'Vermelha', 'Único', 2.300, 299.99, 'ATIVO'),
('PROD008', 'Mochila Jansport', 'Mochila Jansport SuperBreak 25L', 'Acessórios', 'Mochilas', 'Escolares', 'Jansport', 'VF Corporation', 'Azul', 'Único', 0.400, 149.99, 'ATIVO'),
('PROD009', 'Mouse Logitech MX Master', 'Mouse sem fio Logitech MX Master 3', 'Eletrônicos', 'Informática', 'Periféricos', 'Logitech', 'Logitech Brasil', 'Grafite', 'Único', 0.141, 449.99, 'ATIVO'),
('PROD010', 'Perfume Natura Homem', 'Perfume Natura Homem Essence 100ml', 'Beleza', 'Perfumaria', 'Masculino', 'Natura', 'Natura Cosméticos', 'Único', 'Único', 0.300, 159.90, 'ATIVO');

-- Popular Dimensão Canal de Venda
INSERT INTO DIM_CANAL_VENDA (
    id_canal_natural, nome_canal, tipo_canal, descricao_canal, comissao_canal
) VALUES
('ONLINE', 'Loja Online', 'E-commerce', 'Vendas através do site oficial', 2.5),
('LOJA_SP', 'Loja São Paulo', 'Loja Física', 'Loja física no centro de São Paulo', 0.0),
('LOJA_RJ', 'Loja Rio de Janeiro', 'Loja Física', 'Loja física em Copacabana', 0.0),
('MOBILE', 'App Mobile', 'Mobile App', 'Aplicativo móvel iOS e Android', 1.8),
('MARKETPLACE', 'Marketplace', 'Marketplace', 'Vendas em marketplaces parceiros', 8.5),
('TELEFONE', 'Televendas', 'Call Center', 'Vendas por telefone', 3.2);

-- Popular Dimensão Promoção
INSERT INTO DIM_PROMOCAO (
    id_promocao_natural, nome_promocao, tipo_promocao, percentual_desconto,
    valor_desconto, data_inicio, data_fim, status_promocao
) VALUES
('SEM_PROMO', 'Sem Promoção', 'Nenhuma', 0.00, 0.00, '2020-01-01', '2030-12-31', 'ATIVA'),
('BLACK_FRIDAY', 'Black Friday 2024', 'Desconto Percentual', 30.00, 0.00, '2024-11-24', '2024-11-30', 'ATIVA'),
('NATAL_2024', 'Promoção de Natal', 'Desconto Percentual', 15.00, 0.00, '2024-12-01', '2024-12-25', 'ATIVA'),
('FRETE_GRATIS', 'Frete Grátis', 'Frete', 0.00, 50.00, '2024-01-01', '2024-12-31', 'ATIVA'),
('PRIMEIRA_COMPRA', 'Primeira Compra', 'Desconto Valor', 0.00, 100.00, '2024-01-01', '2024-12-31', 'ATIVA'),
('LIQUIDACAO', 'Liquidação Verão', 'Desconto Percentual', 40.00, 0.00, '2024-01-15', '2024-02-29', 'INATIVA');

-- Verificar dados inseridos
SELECT 'Clientes inseridos:' as Tabela, COUNT(*) as Total FROM DIM_CLIENTE
UNION ALL
SELECT 'Produtos inseridos:', COUNT(*) FROM DIM_PRODUTO
UNION ALL
SELECT 'Canais inseridos:', COUNT(*) FROM DIM_CANAL_VENDA
UNION ALL
SELECT 'Promoções inseridas:', COUNT(*) FROM DIM_PROMOCAO
UNION ALL
SELECT 'Registros Tempo:', COUNT(*) FROM DIM_TEMPO;