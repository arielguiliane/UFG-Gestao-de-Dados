-- =====================================================
-- ETL - Carga da Dimensão Tempo
-- =====================================================

-- Procedure para popular a dimensão tempo
DELIMITER //

CREATE PROCEDURE PopularDimensaoTempo(
    IN data_inicio DATE,
    IN data_fim DATE
)
BEGIN
    DECLARE v_data DATE;
    DECLARE v_sk_tempo INTEGER;
    DECLARE v_ano INTEGER;
    DECLARE v_mes INTEGER;
    DECLARE v_dia INTEGER;
    DECLARE v_trimestre INTEGER;
    DECLARE v_semestre INTEGER;
    DECLARE v_dia_semana VARCHAR(20);
    DECLARE v_nome_mes VARCHAR(20);
    DECLARE v_eh_feriado BOOLEAN;
    DECLARE v_eh_fim_semana BOOLEAN;

    SET v_data = data_inicio;

    WHILE v_data <= data_fim DO
        -- Calcular valores derivados
        SET v_sk_tempo = CAST(DATE_FORMAT(v_data, '%Y%m%d') AS UNSIGNED);
        SET v_ano = YEAR(v_data);
        SET v_mes = MONTH(v_data);
        SET v_dia = DAY(v_data);
        SET v_trimestre = QUARTER(v_data);
        SET v_semestre = CASE WHEN v_mes <= 6 THEN 1 ELSE 2 END;

        -- Dia da semana
        SET v_dia_semana = CASE DAYOFWEEK(v_data)
            WHEN 1 THEN 'Domingo'
            WHEN 2 THEN 'Segunda-feira'
            WHEN 3 THEN 'Terça-feira'
            WHEN 4 THEN 'Quarta-feira'
            WHEN 5 THEN 'Quinta-feira'
            WHEN 6 THEN 'Sexta-feira'
            WHEN 7 THEN 'Sábado'
        END;

        -- Nome do mês
        SET v_nome_mes = CASE v_mes
            WHEN 1 THEN 'Janeiro'
            WHEN 2 THEN 'Fevereiro'
            WHEN 3 THEN 'Março'
            WHEN 4 THEN 'Abril'
            WHEN 5 THEN 'Maio'
            WHEN 6 THEN 'Junho'
            WHEN 7 THEN 'Julho'
            WHEN 8 THEN 'Agosto'
            WHEN 9 THEN 'Setembro'
            WHEN 10 THEN 'Outubro'
            WHEN 11 THEN 'Novembro'
            WHEN 12 THEN 'Dezembro'
        END;

        -- Verificar se é fim de semana
        SET v_eh_fim_semana = CASE WHEN DAYOFWEEK(v_data) IN (1, 7) THEN TRUE ELSE FALSE END;

        -- Verificar feriados (exemplo básico)
        SET v_eh_feriado = CASE
            WHEN (v_mes = 1 AND v_dia = 1) THEN TRUE  -- Ano Novo
            WHEN (v_mes = 4 AND v_dia = 21) THEN TRUE -- Tiradentes
            WHEN (v_mes = 9 AND v_dia = 7) THEN TRUE  -- Independência
            WHEN (v_mes = 12 AND v_dia = 25) THEN TRUE -- Natal
            ELSE FALSE
        END;

        -- Inserir registro
        INSERT INTO DIM_TEMPO (
            sk_tempo, data_completa, ano, mes, dia, trimestre, semestre,
            dia_semana, nome_mes, eh_feriado, eh_fim_semana
        ) VALUES (
            v_sk_tempo, v_data, v_ano, v_mes, v_dia, v_trimestre, v_semestre,
            v_dia_semana, v_nome_mes, v_eh_feriado, v_eh_fim_semana
        )
        ON DUPLICATE KEY UPDATE
            data_completa = v_data,
            ano = v_ano,
            mes = v_mes,
            dia = v_dia,
            trimestre = v_trimestre,
            semestre = v_semestre,
            dia_semana = v_dia_semana,
            nome_mes = v_nome_mes,
            eh_feriado = v_eh_feriado,
            eh_fim_semana = v_eh_fim_semana;

        SET v_data = DATE_ADD(v_data, INTERVAL 1 DAY);
    END WHILE;

END //

DELIMITER ;

-- Executar para popular os próximos 5 anos
CALL PopularDimensaoTempo('2020-01-01', '2025-12-31');
