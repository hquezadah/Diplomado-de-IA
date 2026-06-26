# Power BI y Looker Studio

Guía para construir dashboards a partir del dataset de ventas.

## Modelo sugerido

- Tabla principal: `ventas`.
- Medida principal: ingreso total.
- Dimensiones: fecha, región, categoría, vendedor y canal.

## Medidas DAX sugeridas

```text
Ingreso Total = SUMX(ventas, ventas[unidades] * ventas[precio_unitario])
Unidades Vendidas = SUM(ventas[unidades])
Precio Promedio = AVERAGE(ventas[precio_unitario])
```

## Visualizaciones recomendadas

- Tarjetas: ingreso total, unidades vendidas y ticket promedio.
- Barras: ingreso por región.
- Columnas: ingreso por categoría.
- Línea: evolución mensual.
- Segmentadores: canal, vendedor y región.

## Narrativa ejecutiva

Complementa el dashboard con un texto breve que explique:

- Qué cambió.
- Qué región o categoría lidera.
- Qué hipótesis deben validarse.
- Qué decisión se recomienda.
