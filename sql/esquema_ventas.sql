-- Tabla sugerida para el dataset ventas_ejemplo.csv
CREATE TABLE ventas (
    fecha DATE,
    region VARCHAR(80),
    categoria VARCHAR(80),
    vendedor VARCHAR(80),
    unidades INTEGER,
    precio_unitario NUMERIC(10, 2),
    canal VARCHAR(80)
);

-- Ingreso total por region
SELECT
    region,
    SUM(unidades * precio_unitario) AS ingreso_total
FROM ventas
GROUP BY region
ORDER BY ingreso_total DESC;

-- Ingreso total por categoria y canal
SELECT
    categoria,
    canal,
    SUM(unidades * precio_unitario) AS ingreso_total
FROM ventas
GROUP BY categoria, canal
ORDER BY ingreso_total DESC;

-- Desempeno por vendedor
SELECT
    vendedor,
    SUM(unidades) AS unidades_vendidas,
    SUM(unidades * precio_unitario) AS ingreso_total
FROM ventas
GROUP BY vendedor
ORDER BY ingreso_total DESC;
