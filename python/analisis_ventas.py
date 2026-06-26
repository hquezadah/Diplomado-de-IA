from __future__ import annotations

import csv
from collections import defaultdict
from pathlib import Path


DATASET_PATH = Path(__file__).resolve().parents[1] / "datasets" / "ventas_ejemplo.csv"


def cargar_ventas(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as archivo:
        return list(csv.DictReader(archivo))


def ingreso(fila: dict[str, str]) -> float:
    return int(fila["unidades"]) * float(fila["precio_unitario"])


def agrupar_ingresos(filas: list[dict[str, str]], campo: str) -> dict[str, float]:
    totales: dict[str, float] = defaultdict(float)
    for fila in filas:
        totales[fila[campo]] += ingreso(fila)
    return dict(sorted(totales.items(), key=lambda item: item[1], reverse=True))


def imprimir_ranking(titulo: str, totales: dict[str, float]) -> None:
    print(f"\n{titulo}")
    print("-" * len(titulo))
    for nombre, total in totales.items():
        print(f"{nombre:15} RD$ {total:,.2f}")


def main() -> None:
    ventas = cargar_ventas(DATASET_PATH)
    total_general = sum(ingreso(fila) for fila in ventas)

    print("Analisis de ventas")
    print("==================")
    print(f"Registros: {len(ventas)}")
    print(f"Ingreso total: RD$ {total_general:,.2f}")

    imprimir_ranking("Ingresos por region", agrupar_ingresos(ventas, "region"))
    imprimir_ranking("Ingresos por categoria", agrupar_ingresos(ventas, "categoria"))
    imprimir_ranking("Ingresos por vendedor", agrupar_ingresos(ventas, "vendedor"))
    imprimir_ranking("Ingresos por canal", agrupar_ingresos(ventas, "canal"))


if __name__ == "__main__":
    main()
