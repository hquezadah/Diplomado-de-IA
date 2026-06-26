import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const SLIDE = { width: 1280, height: 720 };
const COLORS = {
  canvas: "#FFFFFF",
  ink: "#000000",
  muted: "#555555",
  panel: "#EDEDED",
  panel2: "#F7F7F7",
  rule: "#B8BCC4",
  accent: "#FF6B35",
  softAccent: "#FFF0EA",
};

const OUTPUT_DIR = process.env.OUTPUT_DIR
  ? path.resolve(process.env.OUTPUT_DIR)
  : path.resolve(process.cwd(), "presentaciones");
const QA_DIR = process.env.QA_DIR
  ? path.resolve(process.env.QA_DIR)
  : path.resolve(process.cwd(), "qa");

function line(fill = "none", width = 0) {
  return { style: "solid", fill, width };
}

function addBox(slide, name, position, fill = COLORS.panel, stroke = "none") {
  return slide.shapes.add({
    geometry: "rect",
    name,
    position,
    fill,
    line: line(stroke, stroke === "none" ? 0 : 1),
  });
}

function addText(slide, name, text, position, style = {}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    name,
    position,
    fill: "none",
    line: line(),
  });
  shape.text = text;
  shape.text.style = {
    fontSize: style.fontSize ?? 22,
    color: style.color ?? COLORS.ink,
    bold: style.bold ?? false,
    alignment: style.alignment ?? "left",
  };
  return shape;
}

function bullet(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

function numbered(items) {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function addFooter(slide, deck, index, total) {
  addText(
    slide,
    "footer-left",
    deck.footer,
    { left: 42, top: 660, width: 760, height: 28 },
    { fontSize: 15, color: COLORS.muted, bold: true },
  );
  addText(
    slide,
    "footer-right",
    `${String(index).padStart(2, "0")} / ${String(total).padStart(2, "0")}`,
    { left: 1110, top: 660, width: 128, height: 28 },
    { fontSize: 15, color: COLORS.muted, alignment: "right", bold: true },
  );
}

function setNotes(slide, notes) {
  slide.speakerNotes.textFrame.setText(notes);
  slide.speakerNotes.setVisible(true);
}

function beginSlide(presentation, deck, index, total) {
  const slide = presentation.slides.add();
  slide.background.fill = COLORS.canvas;
  addFooter(slide, deck, index, total);
  return slide;
}

function titleSlide(presentation, deck, index, total) {
  const slide = beginSlide(presentation, deck, index, total);
  addBox(slide, "accent-bar", { left: 42, top: 54, width: 18, height: 548 }, COLORS.accent);
  addText(slide, "module-label", deck.kicker, { left: 82, top: 56, width: 430, height: 34 }, {
    fontSize: 18,
    color: COLORS.muted,
    bold: true,
  });
  addText(slide, "title", deck.title, { left: 82, top: 132, width: 760, height: 190 }, {
    fontSize: 62,
    bold: true,
  });
  addText(slide, "subtitle", deck.subtitle, { left: 84, top: 355, width: 690, height: 92 }, {
    fontSize: 25,
    color: COLORS.muted,
  });
  addBox(slide, "right-field", { left: 865, top: 80, width: 330, height: 500 }, COLORS.panel);
  addText(slide, "right-field-title", deck.coverCallout.title, { left: 908, top: 140, width: 245, height: 78 }, {
    fontSize: 36,
    bold: true,
  });
  addText(slide, "right-field-body", deck.coverCallout.body, { left: 910, top: 260, width: 238, height: 210 }, {
    fontSize: 22,
    color: COLORS.muted,
  });
  setNotes(slide, deck.notes.cover);
}

function agendaSlide(presentation, deck, index, total) {
  const slide = beginSlide(presentation, deck, index, total);
  addText(slide, "title", "Ruta de aprendizaje", { left: 42, top: 44, width: 430, height: 96 }, {
    fontSize: 44,
    bold: true,
  });
  addText(slide, "agenda", numbered(deck.agenda), { left: 625, top: 48, width: 560, height: 455 }, {
    fontSize: 34,
  });
  addText(slide, "rhythm", "Cada bloque combina concepto, demostracion, practica y reflexion.", {
    left: 42,
    top: 505,
    width: 520,
    height: 86,
  }, { fontSize: 24, color: COLORS.muted });
  setNotes(slide, "Use esta diapositiva para mostrar que la sesion no sera teorica solamente. Anticipe los productos que el participante ira construyendo.");
}

function outcomesSlide(presentation, deck, index, total) {
  const slide = beginSlide(presentation, deck, index, total);
  addText(slide, "title", "Al finalizar podras", { left: 42, top: 44, width: 820, height: 62 }, {
    fontSize: 44,
    bold: true,
  });
  deck.outcomes.forEach((item, i) => {
    const left = 42 + i * 300;
    addBox(slide, `outcome-box-${i}`, { left, top: 165, width: 260, height: 285 }, i === 1 ? COLORS.softAccent : COLORS.panel);
    addText(slide, `outcome-num-${i}`, `0${i + 1}`, { left: left + 22, top: 190, width: 86, height: 50 }, {
      fontSize: 34,
      bold: true,
      color: i === 1 ? COLORS.accent : COLORS.ink,
    });
    addText(slide, `outcome-${i}`, item, { left: left + 22, top: 260, width: 210, height: 138 }, {
      fontSize: 24,
      bold: i === 1,
    });
  });
  addText(slide, "evidence", `Evidencia del modulo: ${deck.moduleEvidence}`, {
    left: 42,
    top: 505,
    width: 960,
    height: 52,
  }, { fontSize: 26, bold: true });
  setNotes(slide, "Conecte cada resultado con una accion observable. Pida que los participantes identifiquen cual resultado les parece mas valioso para su trabajo.");
}

function coreConceptsSlide(presentation, deck, index, total) {
  const slide = beginSlide(presentation, deck, index, total);
  addText(slide, "title", deck.coreTitle, { left: 42, top: 44, width: 1040, height: 62 }, {
    fontSize: 44,
    bold: true,
  });
  deck.coreConcepts.forEach((item, i) => {
    const top = 145 + i * 105;
    addBox(slide, `concept-box-${i}`, { left: 42, top, width: 410, height: 76 }, i === 0 ? COLORS.softAccent : COLORS.panel2, COLORS.rule);
    addText(slide, `concept-title-${i}`, item.term, { left: 66, top: top + 15, width: 160, height: 36 }, {
      fontSize: 25,
      bold: true,
      color: i === 0 ? COLORS.accent : COLORS.ink,
    });
    addText(slide, `concept-desc-${i}`, item.meaning, { left: 252, top: top + 15, width: 850, height: 46 }, {
      fontSize: 21,
      color: COLORS.muted,
    });
  });
  setNotes(slide, deck.notes.core);
}

function exampleSlide(presentation, deck, index, total) {
  const slide = beginSlide(presentation, deck, index, total);
  addText(slide, "title", deck.example.title, { left: 42, top: 44, width: 860, height: 62 }, {
    fontSize: 44,
    bold: true,
  });
  addText(slide, "context-label", "Contexto", { left: 42, top: 142, width: 210, height: 32 }, {
    fontSize: 24,
    bold: true,
  });
  addText(slide, "context", deck.example.context, { left: 42, top: 190, width: 470, height: 160 }, {
    fontSize: 23,
    color: COLORS.muted,
  });
  addBox(slide, "action-panel", { left: 580, top: 145, width: 600, height: 390 }, COLORS.panel);
  addText(slide, "action-label", "Como se aplica IA", { left: 615, top: 180, width: 320, height: 34 }, {
    fontSize: 26,
    bold: true,
  });
  addText(slide, "action-list", bullet(deck.example.actions), { left: 615, top: 242, width: 520, height: 210 }, {
    fontSize: 24,
  });
  addText(slide, "result", `Resultado esperado: ${deck.example.result}`, { left: 42, top: 470, width: 480, height: 82 }, {
    fontSize: 25,
    bold: true,
  });
  setNotes(slide, deck.notes.example);
}

function processSlide(presentation, deck, index, total) {
  const slide = beginSlide(presentation, deck, index, total);
  addText(slide, "title", deck.process.title, { left: 42, top: 44, width: 880, height: 62 }, {
    fontSize: 44,
    bold: true,
  });
  deck.process.steps.forEach((step, i) => {
    const left = 42 + i * 300;
    addText(slide, `step-number-${i}`, `0${i + 1}`, { left, top: 148, width: 92, height: 58 }, {
      fontSize: 42,
      bold: true,
      color: i === 2 ? COLORS.accent : COLORS.ink,
    });
    addBox(slide, `step-rule-${i}`, { left, top: 224, width: 245, height: 2 }, i === 2 ? COLORS.accent : COLORS.rule);
    addText(slide, `step-title-${i}`, step.title, { left, top: 250, width: 245, height: 74 }, {
      fontSize: 29,
      bold: true,
    });
    addText(slide, `step-body-${i}`, step.body, { left, top: 345, width: 242, height: 120 }, {
      fontSize: 21,
      color: COLORS.muted,
    });
  });
  addText(slide, "control", deck.process.control, { left: 42, top: 535, width: 1020, height: 48 }, {
    fontSize: 24,
    bold: true,
  });
  setNotes(slide, deck.notes.process);
}

function promptSlide(presentation, deck, index, total) {
  const slide = beginSlide(presentation, deck, index, total);
  addText(slide, "title", "Prompt de practica", { left: 42, top: 44, width: 860, height: 62 }, {
    fontSize: 44,
    bold: true,
  });
  addBox(slide, "prompt-panel", { left: 42, top: 140, width: 720, height: 410 }, COLORS.panel2, COLORS.rule);
  addText(slide, "prompt", deck.prompt.text, { left: 78, top: 172, width: 645, height: 320 }, {
    fontSize: 20,
    color: COLORS.ink,
  });
  addText(slide, "checks-title", "Criterios de revision", { left: 820, top: 150, width: 330, height: 36 }, {
    fontSize: 28,
    bold: true,
  });
  addText(slide, "checks", bullet(deck.prompt.checks), { left: 822, top: 215, width: 340, height: 230 }, {
    fontSize: 23,
    color: COLORS.muted,
  });
  addText(slide, "tip", deck.prompt.tip, { left: 822, top: 492, width: 340, height: 62 }, {
    fontSize: 24,
    bold: true,
    color: COLORS.accent,
  });
  setNotes(slide, deck.notes.prompt);
}

function practiceSlide(presentation, deck, index, total) {
  const slide = beginSlide(presentation, deck, index, total);
  addText(slide, "title", deck.practice.title, { left: 42, top: 44, width: 900, height: 62 }, {
    fontSize: 44,
    bold: true,
  });
  addText(slide, "objective", deck.practice.objective, { left: 42, top: 130, width: 980, height: 58 }, {
    fontSize: 26,
    color: COLORS.muted,
  });
  deck.practice.steps.forEach((step, i) => {
    const top = 225 + i * 68;
    addBox(slide, `practice-num-${i}`, { left: 42, top, width: 48, height: 48 }, i === 0 ? COLORS.accent : COLORS.ink);
    addText(slide, `practice-num-text-${i}`, `${i + 1}`, { left: 42, top: top + 6, width: 48, height: 36 }, {
      fontSize: 26,
      bold: true,
      color: COLORS.canvas,
      alignment: "center",
    });
    addText(slide, `practice-step-${i}`, step, { left: 118, top: top + 4, width: 875, height: 44 }, {
      fontSize: 25,
    });
  });
  addBox(slide, "deliverable-panel", { left: 850, top: 438, width: 330, height: 112 }, COLORS.softAccent);
  addText(slide, "deliverable-label", "Entregable", { left: 880, top: 460, width: 260, height: 34 }, {
    fontSize: 24,
    bold: true,
    color: COLORS.accent,
  });
  addText(slide, "deliverable", deck.practice.deliverable, { left: 880, top: 500, width: 258, height: 48 }, {
    fontSize: 20,
  });
  setNotes(slide, deck.notes.practice);
}

function tableSlide(presentation, deck, index, total) {
  const slide = beginSlide(presentation, deck, index, total);
  addText(slide, "title", deck.table.title, { left: 42, top: 44, width: 1020, height: 62 }, {
    fontSize: 44,
    bold: true,
  });
  const values = deck.table.rows;
  const table = slide.tables.add({
    rows: values.length,
    columns: values[0].length,
    left: 42,
    top: 150,
    width: 1110,
    height: 365,
    values,
    columnTracks: deck.table.columnTracks,
  });
  table.styleOptions = { headerRow: true, bandedRows: true };
  table.borders.assign({ style: "solid", fill: COLORS.rule, width: 1 });
  for (let c = 0; c < values[0].length; c += 1) {
    table.getCell(0, c).fill = COLORS.panel;
    table.getCell(0, c).text.style = { fontSize: 16, bold: true, color: COLORS.ink };
  }
  addText(slide, "table-note", deck.table.note, { left: 42, top: 548, width: 980, height: 45 }, {
    fontSize: 22,
    color: COLORS.muted,
  });
  setNotes(slide, deck.notes.table);
}

function checklistSlide(presentation, deck, index, total) {
  const slide = beginSlide(presentation, deck, index, total);
  addText(slide, "title", deck.checklist.title, { left: 42, top: 44, width: 960, height: 62 }, {
    fontSize: 44,
    bold: true,
  });
  deck.checklist.items.forEach((item, i) => {
    const left = i % 2 === 0 ? 42 : 660;
    const top = 150 + Math.floor(i / 2) * 112;
    addBox(slide, `check-box-${i}`, { left, top, width: 32, height: 32 }, i < 2 ? COLORS.accent : COLORS.ink);
    addText(slide, `check-title-${i}`, item.title, { left: left + 58, top: top - 2, width: 420, height: 36 }, {
      fontSize: 25,
      bold: true,
    });
    addText(slide, `check-body-${i}`, item.body, { left: left + 58, top: top + 44, width: 455, height: 50 }, {
      fontSize: 20,
      color: COLORS.muted,
    });
  });
  setNotes(slide, deck.notes.checklist);
}

function chartSlide(presentation, deck, index, total) {
  const slide = beginSlide(presentation, deck, index, total);
  addText(slide, "title", deck.chart.title, { left: 42, top: 44, width: 900, height: 62 }, {
    fontSize: 44,
    bold: true,
  });
  slide.charts.add(deck.chart.type ?? "bar", {
    position: { left: 42, top: 150, width: 710, height: 370 },
    categories: deck.chart.categories,
    series: deck.chart.series,
    barOptions: { direction: "bar", grouping: "clustered", gapWidth: 48 },
    hasLegend: deck.chart.hasLegend ?? false,
    xAxis: { visible: false, majorGridlines: null },
    yAxis: {
      textStyle: { fill: COLORS.muted, fontSize: 16 },
      line: { style: "solid", fill: COLORS.rule, width: 1 },
    },
    dataLabels: {
      showValue: true,
      position: "outEnd",
      textStyle: { fill: COLORS.ink, fontSize: 16, bold: true },
    },
  });
  addText(slide, "chart-insight-title", "Lectura ejecutiva", { left: 820, top: 150, width: 330, height: 34 }, {
    fontSize: 28,
    bold: true,
  });
  addText(slide, "chart-insight", bullet(deck.chart.insights), { left: 822, top: 215, width: 350, height: 230 }, {
    fontSize: 24,
    color: COLORS.muted,
  });
  addText(slide, "chart-warning", deck.chart.warning, { left: 822, top: 488, width: 342, height: 72 }, {
    fontSize: 22,
    bold: true,
    color: COLORS.accent,
  });
  setNotes(slide, deck.notes.chart);
}

function mistakesSlide(presentation, deck, index, total) {
  const slide = beginSlide(presentation, deck, index, total);
  addText(slide, "title", "Errores frecuentes", { left: 42, top: 44, width: 850, height: 62 }, {
    fontSize: 44,
    bold: true,
  });
  deck.mistakes.forEach((item, i) => {
    const left = 42 + i * 385;
    addText(slide, `mistake-number-${i}`, `0${i + 1}`, { left, top: 155, width: 92, height: 54 }, {
      fontSize: 38,
      bold: true,
      color: COLORS.accent,
    });
    addText(slide, `mistake-title-${i}`, item.title, { left, top: 230, width: 300, height: 68 }, {
      fontSize: 29,
      bold: true,
    });
    addText(slide, `mistake-fix-${i}`, item.fix, { left, top: 322, width: 305, height: 142 }, {
      fontSize: 22,
      color: COLORS.muted,
    });
  });
  addText(slide, "closing-note", "La meta no es usar IA en todo: es usarla donde mejora una decision, un proceso o una entrega.", {
    left: 42,
    top: 530,
    width: 1010,
    height: 55,
  }, { fontSize: 26, bold: true });
  setNotes(slide, deck.notes.mistakes);
}

function closeSlide(presentation, deck, index, total) {
  const slide = beginSlide(presentation, deck, index, total);
  addText(slide, "title", deck.close.title, { left: 42, top: 70, width: 950, height: 112 }, {
    fontSize: 54,
    bold: true,
  });
  addText(slide, "next", bullet(deck.close.next), { left: 42, top: 235, width: 650, height: 220 }, {
    fontSize: 30,
  });
  addBox(slide, "final-panel", { left: 775, top: 190, width: 390, height: 285 }, COLORS.panel);
  addText(slide, "final-panel-title", deck.close.panelTitle, { left: 815, top: 240, width: 305, height: 74 }, {
    fontSize: 34,
    bold: true,
  });
  addText(slide, "final-panel-body", deck.close.panelBody, { left: 817, top: 342, width: 292, height: 88 }, {
    fontSize: 22,
    color: COLORS.muted,
  });
  setNotes(slide, deck.notes.close);
}

function buildDeck(deck) {
  const presentation = Presentation.create({ slideSize: SLIDE });
  const total = 13;
  titleSlide(presentation, deck, 1, total);
  agendaSlide(presentation, deck, 2, total);
  outcomesSlide(presentation, deck, 3, total);
  coreConceptsSlide(presentation, deck, 4, total);
  exampleSlide(presentation, deck, 5, total);
  processSlide(presentation, deck, 6, total);
  promptSlide(presentation, deck, 7, total);
  practiceSlide(presentation, deck, 8, total);
  tableSlide(presentation, deck, 9, total);
  chartSlide(presentation, deck, 10, total);
  checklistSlide(presentation, deck, 11, total);
  mistakesSlide(presentation, deck, 12, total);
  closeSlide(presentation, deck, 13, total);
  return presentation;
}

const decks = [
  {
    file: "modulo-01-fundamentos-ia.pptx",
    footer: "Modulo I - Fundamentos de IA",
    kicker: "Modulo I",
    title: "Introduccion y potencial aplicado de la IA",
    subtitle: "Fundamentos, casos de uso, limites, riesgos y criterios de aplicacion en el trabajo.",
    coverCallout: {
      title: "Pensar antes de automatizar",
      body: "El valor surge cuando conectamos tecnologia, proceso, datos y juicio profesional.",
    },
    agenda: [
      "Que es IA y que no es",
      "De machine learning a IA generativa",
      "Casos de uso laborales",
      "Riesgos, limites y privacidad",
      "Mapa de oportunidades",
      "Practica guiada",
    ],
    outcomes: [
      "Distinguir IA, ML, deep learning e IA generativa.",
      "Identificar procesos con potencial real de mejora.",
      "Reconocer riesgos y controles minimos.",
      "Priorizar oportunidades con impacto y esfuerzo.",
    ],
    moduleEvidence: "matriz de oportunidades y riesgos para un proceso laboral.",
    coreTitle: "Marco basico para entender IA",
    coreConcepts: [
      { term: "IA", meaning: "Sistemas que ejecutan tareas asociadas a razonamiento, lenguaje, vision o decision." },
      { term: "ML", meaning: "Modelos que aprenden patrones desde datos historicos para predecir o clasificar." },
      { term: "Deep learning", meaning: "Redes neuronales profundas utiles para lenguaje, imagen, audio y patrones complejos." },
      { term: "IA generativa", meaning: "Modelos que crean texto, codigo, imagenes o estructuras a partir de instrucciones." },
    ],
    example: {
      title: "Ejemplo aplicado: atencion ciudadana",
      context: "Una institucion recibe solicitudes repetitivas por correo y formularios. Los tiempos de respuesta varian segun area y persona.",
      actions: [
        "Clasificar solicitudes por tema y urgencia.",
        "Sugerir borradores de respuesta con base institucional.",
        "Detectar temas frecuentes para mejorar servicios.",
        "Mantener revision humana antes de enviar.",
      ],
      result: "respuestas mas consistentes y trazables, sin delegar decisiones sensibles.",
    },
    process: {
      title: "Metodo para seleccionar casos de uso",
      steps: [
        { title: "Describir", body: "Nombre del proceso, frecuencia, entrada, salida y responsable." },
        { title: "Medir", body: "Tiempo, costo, errores, volumen o impacto percibido." },
        { title: "Evaluar", body: "Datos disponibles, privacidad, riesgo y necesidad de supervision." },
        { title: "Priorizar", body: "Elegir el caso con alto valor, bajo riesgo y aprendizaje rapido." },
      ],
      control: "Control clave: ninguna salida de IA debe usarse sin validacion cuando afecta derechos, dinero o reputacion.",
    },
    prompt: {
      text: `Actua como consultor de transformacion digital. Analiza estos procesos y prioriza oportunidades de uso de IA considerando impacto, esfuerzo, riesgos, datos requeridos y supervision humana.\n\nProcesos:\n[pegar lista]\n\nEntrega una tabla con puntuacion de 1 a 5, justificacion breve y recomendacion.`,
      checks: [
        "El prompt define rol y objetivo.",
        "Incluye criterios de priorizacion.",
        "Pide riesgos y supervision.",
        "La salida es una tabla comparable.",
      ],
      tip: "Mejor prompt = mejor criterio, no mas palabras.",
    },
    practice: {
      title: "Practica: mapa de oportunidades",
      objective: "Convertir tareas reales del participante en una cartera inicial de casos de uso.",
      steps: [
        "Listar 5 procesos repetitivos o intensivos en informacion.",
        "Describir dolor, datos, responsable y salida esperada.",
        "Puntuar impacto, esfuerzo, riesgo y frecuencia.",
        "Elegir una oportunidad para explorar durante el diplomado.",
      ],
      deliverable: "Matriz priorizada con controles minimos.",
    },
    table: {
      title: "Matriz de priorizacion inicial",
      rows: [
        ["Proceso", "Impacto", "Esfuerzo", "Riesgo", "Decision"],
        ["Responder solicitudes", "Alto", "Medio", "Medio", "Piloto controlado"],
        ["Resumir reuniones", "Medio", "Bajo", "Bajo", "Implementar"],
        ["Evaluar candidatos", "Alto", "Alto", "Alto", "Solo apoyo documental"],
        ["Crear reportes", "Alto", "Medio", "Medio", "Probar con datos sinteticos"],
      ],
      columnTracks: [{ mode: "fr", value: 2.1 }, { mode: "fr", value: 1 }, { mode: "fr", value: 1 }, { mode: "fr", value: 1 }, { mode: "fr", value: 1.5 }],
      note: "La decision no depende solo del impacto: el riesgo cambia la ruta de implementacion.",
    },
    chart: {
      title: "Priorizacion visual del grupo",
      categories: ["Resumir reuniones", "Crear reportes", "Responder solicitudes", "Evaluar candidatos"],
      series: [{ name: "Viabilidad", values: [88, 76, 64, 36], fill: COLORS.accent }],
      insights: [
        "Empezar con tareas reversibles y de bajo riesgo.",
        "Subir complejidad cuando exista evidencia.",
        "Separar automatizacion de decision final.",
      ],
      warning: "Alta viabilidad no elimina la obligacion de revisar.",
    },
    checklist: {
      title: "Checklist de uso responsable",
      items: [
        { title: "Datos", body: "No cargar informacion sensible sin autorizacion." },
        { title: "Proposito", body: "Explicar para que se usa IA y que queda fuera." },
        { title: "Revision", body: "Validar hechos, calculos y tono antes de publicar." },
        { title: "Trazabilidad", body: "Guardar prompt, fuente y version del resultado." },
        { title: "Sesgos", body: "Preguntar quien podria quedar mal representado." },
        { title: "Escalamiento", body: "Definir cuando interviene una persona responsable." },
      ],
    },
    mistakes: [
      { title: "Confundir fluidez con verdad", fix: "Una respuesta bien redactada puede estar equivocada. Verifique fuentes y datos." },
      { title: "Automatizar sin proceso", fix: "Primero entienda entradas, reglas, responsables y excepciones." },
      { title: "Ignorar privacidad", fix: "Use datos sinteticos o anonimizados para pruebas y demostraciones." },
    ],
    close: {
      title: "Cierre del modulo",
      next: [
        "Selecciona un proceso real.",
        "Define impacto, datos y riesgos.",
        "Trae una oportunidad priorizada al Modulo II.",
      ],
      panelTitle: "Producto listo",
      panelBody: "Mapa inicial de oportunidades de IA para tu entorno laboral.",
    },
    notes: {
      cover: "Abra con una pregunta: que tarea repetitiva les consume mas energia cada semana. Use sus respuestas para conectar con el resto del modulo.",
      core: "No convierta esta parte en historia larga. El objetivo es que puedan clasificar herramientas y entender limites.",
      example: "Invite al grupo a identificar que parte del caso si automatizarian y que parte conservarian con supervision humana.",
      process: "Pida ejemplos concretos. Si un caso requiere datos sensibles desde el inicio, marque el riesgo y proponga una version sintetica.",
      prompt: "Haga una demostracion en vivo si hay conexion. Compare una respuesta inicial con una version mejorada.",
      practice: "Trabaje en parejas. Una persona describe el proceso y otra cuestiona riesgos y datos.",
      table: "Use la tabla para discutir que no siempre gana el caso mas atractivo.",
      chart: "Explique que esta escala es pedagogica. El objetivo es visualizar priorizacion, no presentar una metrica absoluta.",
      checklist: "Convierta el checklist en habito: antes de usar IA, revisar datos, proposito, supervision y trazabilidad.",
      mistakes: "Cierre con humildad tecnologica: IA ayuda mucho, pero necesita criterio humano.",
      close: "Pida que documenten su oportunidad porque sera insumo para los proximos modulos.",
    },
  },
  {
    file: "modulo-02-productividad-automatizacion.pptx",
    footer: "Modulo II - Productividad y automatizacion",
    kicker: "Modulo II",
    title: "IA para productividad y automatizacion profesional",
    subtitle: "Documentos, correos, minutas, organizacion del trabajo y flujos no-code con control humano.",
    coverCallout: {
      title: "Menos friccion, mas criterio",
      body: "La IA debe reducir trabajo repetitivo, no reemplazar la responsabilidad profesional.",
    },
    agenda: [
      "Productividad aumentada",
      "Documentos, correos y minutas",
      "Flujos de trabajo con IA",
      "Automatizacion no-code",
      "Metricas y controles",
      "Laboratorio aplicado",
    ],
    outcomes: [
      "Transformar notas en documentos utiles.",
      "Disenar un flujo asistido por IA.",
      "Identificar puntos de revision humana.",
      "Medir ahorro, calidad y consistencia.",
    ],
    moduleEvidence: "flujo de productividad optimizado con controles y entregable profesional.",
    coreTitle: "Productividad aumentada en 4 niveles",
    coreConcepts: [
      { term: "Asistir", meaning: "La IA sugiere, resume, redacta o transforma contenido bajo supervision." },
      { term: "Estandarizar", meaning: "Plantillas, criterios y formatos reducen variacion entre personas." },
      { term: "Automatizar", meaning: "Herramientas no-code conectan entradas, acciones y salidas repetibles." },
      { term: "Medir", meaning: "Tiempo, retrabajo, calidad y satisfaccion muestran si el flujo agrega valor." },
    ],
    example: {
      title: "Ejemplo aplicado: minuta a tareas",
      context: "Un equipo tiene reuniones semanales, pero los acuerdos quedan dispersos en notas, chats y correos.",
      actions: [
        "Convertir notas en minuta estructurada.",
        "Extraer acuerdos, responsables y fechas.",
        "Crear tareas en Planner, Trello o Notion.",
        "Enviar resumen validado al equipo.",
      ],
      result: "menos perdida de acuerdos y mejor seguimiento semanal.",
    },
    process: {
      title: "Flujo recomendado para automatizar",
      steps: [
        { title: "Capturar", body: "Reunir texto, correo, formulario, audio o documento de entrada." },
        { title: "Transformar", body: "Usar IA para resumir, clasificar, corregir o convertir formato." },
        { title: "Validar", body: "Revisar exactitud, tono, destinatario, datos y excepciones." },
        { title: "Distribuir", body: "Guardar, notificar, crear tarea o enviar solo tras aprobacion." },
      ],
      control: "Regla practica: automatice acciones repetibles; mantenga aprobacion humana en decisiones sensibles.",
    },
    prompt: {
      text: `Actua como asistente ejecutivo. Convierte estas notas en una minuta profesional con: contexto, acuerdos, responsables, fechas, riesgos y pendientes. Marca cualquier punto ambiguo que requiera confirmacion.\n\nNotas:\n[pegar notas]\n\nFormato: tabla de acuerdos y resumen ejecutivo breve.`,
      checks: [
        "Extrae responsables y fechas.",
        "Distingue acuerdo de comentario.",
        "Marca dudas sin inventar datos.",
        "Produce salida util para seguimiento.",
      ],
      tip: "Pedir ambiguedades evita tareas falsas.",
    },
    practice: {
      title: "Practica: flujo de productividad",
      objective: "Redisenar una tarea repetitiva para reducir pasos manuales y mejorar trazabilidad.",
      steps: [
        "Describir el proceso actual en 5 a 8 pasos.",
        "Marcar donde IA ayuda a transformar informacion.",
        "Definir herramienta, responsable y control por paso.",
        "Estimar metrica de mejora: tiempo, errores o consistencia.",
      ],
      deliverable: "Diagrama o tabla del flujo futuro.",
    },
    table: {
      title: "Tareas de oficina y tipo de apoyo",
      rows: [
        ["Tarea", "IA aporta", "Automatizar", "Control"],
        ["Correo de respuesta", "Borrador y tono", "Parcial", "Revision antes de enviar"],
        ["Minuta", "Sintesis y acuerdos", "Alta", "Confirmar responsables"],
        ["Informe mensual", "Estructura y narrativa", "Media", "Validar cifras"],
        ["Archivo documental", "Clasificacion", "Media", "Revisar permisos"],
      ],
      columnTracks: [{ mode: "fr", value: 1.7 }, { mode: "fr", value: 1.8 }, { mode: "fr", value: 1 }, { mode: "fr", value: 1.8 }],
      note: "La IA no elimina el diseno del proceso; lo vuelve mas importante.",
    },
    chart: {
      title: "Donde suele aparecer ahorro",
      categories: ["Redaccion", "Sintesis", "Busqueda", "Seguimiento", "Aprobacion"],
      series: [{ name: "Potencial", values: [76, 82, 58, 64, 24], fill: COLORS.accent }],
      insights: [
        "Mayor valor en sintesis y redaccion estructurada.",
        "Seguimiento mejora cuando hay responsables claros.",
        "Aprobacion sigue siendo humana.",
      ],
      warning: "No medir ahorro puede convertir la automatizacion en ruido.",
    },
    checklist: {
      title: "Controles para flujos con IA",
      items: [
        { title: "Entrada", body: "Definir que datos entran y que datos nunca entran." },
        { title: "Formato", body: "Estandarizar la salida para que sea revisable." },
        { title: "Excepciones", body: "Definir que casos no se procesan automaticamente." },
        { title: "Aprobacion", body: "Asignar responsable antes de enviar o publicar." },
        { title: "Registro", body: "Guardar versiones, prompts y cambios relevantes." },
        { title: "Metricas", body: "Comparar antes y despues con evidencia simple." },
      ],
    },
    mistakes: [
      { title: "Automatizar ruido", fix: "Si el proceso esta mal definido, la IA escala el desorden." },
      { title: "Enviar sin revisar", fix: "Todo mensaje externo requiere validacion de tono, hechos y destinatario." },
      { title: "No medir impacto", fix: "Defina una metrica simple antes del piloto." },
    ],
    close: {
      title: "Cierre del modulo",
      next: [
        "Documenta tu flujo futuro.",
        "Prueba un prompt con datos no sensibles.",
        "Trae un antes y despues al Modulo III.",
      ],
      panelTitle: "Producto listo",
      panelBody: "Flujo profesional asistido por IA con controles y metrica.",
    },
    notes: {
      cover: "Enfatice que productividad no es solo hacer mas rapido. Tambien es reducir errores y dar mas claridad.",
      core: "Use ejemplos cotidianos: correo, minuta, reporte y agenda. Pregunte que tareas repetitivas aparecen cada semana.",
      example: "Si el grupo usa Teams, Google Meet o Zoom, conecte el ejemplo con su realidad.",
      process: "Haga que cada participante marque el paso donde ocurren mas errores humanos.",
      prompt: "Demuestre que pedir dudas y ambiguedades es tan importante como pedir el entregable.",
      practice: "Sugiera trabajar con informacion ficticia o anonima. Evite que copien correos reales con datos sensibles.",
      table: "Use esta tabla para escoger tareas adecuadas para pilotos pequenos.",
      chart: "Explique que los valores son orientativos: cada organizacion debe medir su propio flujo.",
      checklist: "Pida que conviertan el checklist en requisitos del piloto.",
      mistakes: "Cuente un ejemplo de automatizacion que crea mas pasos por falta de aprobacion clara.",
      close: "Deje una tarea concreta: probar una version manual y una version asistida.",
    },
  },
  {
    file: "modulo-03-comunicacion-contenidos.pptx",
    footer: "Modulo III - Comunicacion y contenidos",
    kicker: "Modulo III",
    title: "IA generativa para comunicacion, marketing y contenidos",
    subtitle: "Prompts, storytelling, audiencias, contenidos multicanal y revision editorial responsable.",
    coverCallout: {
      title: "Crear no es publicar",
      body: "La IA acelera borradores; la calidad final depende de criterio, contexto y revision.",
    },
    agenda: [
      "Prompt engineering aplicado",
      "Audiencia, tono y canal",
      "Storytelling y copywriting",
      "Piezas multiformato",
      "Riesgos reputacionales",
      "Laboratorio de contenido",
    ],
    outcomes: [
      "Crear mensajes adaptados a audiencia y canal.",
      "Iterar prompts para mejorar calidad.",
      "Revisar tono, precision y riesgos.",
      "Preparar un paquete de comunicacion.",
    ],
    moduleEvidence: "paquete de comunicacion con prompts, variantes y version final editada.",
    coreTitle: "De instruccion vaga a sistema de comunicacion",
    coreConcepts: [
      { term: "Audiencia", meaning: "Quien recibe el mensaje, que sabe, que necesita y que objeciones tiene." },
      { term: "Objetivo", meaning: "Informar, persuadir, convocar, explicar, vender, sensibilizar o rendir cuentas." },
      { term: "Tono", meaning: "Formal, cercano, institucional, tecnico, educativo o comercial segun contexto." },
      { term: "Canal", meaning: "Correo, informe, redes, presentacion, video o pieza grafica condicionan formato." },
    ],
    example: {
      title: "Ejemplo aplicado: campana interna",
      context: "Una organizacion quiere promover buenas practicas de uso de IA sin sonar prohibitiva ni demasiado tecnica.",
      actions: [
        "Definir audiencia: personal administrativo y tecnico.",
        "Crear mensaje central con beneficios y limites.",
        "Adaptar a correo, infografia y post interno.",
        "Revisar riesgos de promesas exageradas.",
      ],
      result: "comunicacion clara, accionable y alineada con politicas internas.",
    },
    process: {
      title: "Proceso editorial asistido por IA",
      steps: [
        { title: "Brief", body: "Objetivo, audiencia, canal, tono, mensaje y restricciones." },
        { title: "Borrador", body: "Generar variantes y pedir explicacion de decisiones." },
        { title: "Edicion", body: "Recortar, ajustar tono, validar datos y mejorar claridad." },
        { title: "Publicacion", body: "Aprobar, adaptar formatos y medir respuesta." },
      ],
      control: "Regla practica: la IA propone; la marca, la institucion o el profesional decide.",
    },
    prompt: {
      text: `Actua como estratega de comunicacion institucional. Crea tres versiones de un mensaje para [audiencia] con el objetivo de [objetivo]. El tono debe ser [tono]. Evita exageraciones, promesas no verificables y lenguaje tecnico innecesario.\n\nInformacion base:\n[pegar informacion]\n\nIncluye version breve, extendida, redes sociales y riesgos de interpretacion.`,
      checks: [
        "Incluye audiencia y objetivo.",
        "Define tono y restricciones.",
        "Pide varias versiones.",
        "Solicita riesgos antes de publicar.",
      ],
      tip: "Un buen brief vale mas que diez retoques.",
    },
    practice: {
      title: "Practica: paquete de comunicacion",
      objective: "Crear mensajes coherentes para distintos canales desde un mismo objetivo.",
      steps: [
        "Definir audiencia, objetivo, tono y canal.",
        "Generar tres variantes con IA.",
        "Evaluar claridad, precision, sesgo y riesgo reputacional.",
        "Editar una version final lista para revision.",
      ],
      deliverable: "Paquete con prompt, variantes y version final.",
    },
    table: {
      title: "Adaptacion por canal",
      rows: [
        ["Canal", "Extension", "Clave de calidad", "Riesgo"],
        ["Correo", "Media", "Asunto claro y llamado a accion", "Ambiguedad"],
        ["Red social", "Breve", "Gancho y claridad inmediata", "Exageracion"],
        ["Informe", "Larga", "Evidencia y estructura", "Datos no verificados"],
        ["Presentacion", "Sintetica", "Mensaje visual por slide", "Saturacion"],
      ],
      columnTracks: [{ mode: "fr", value: 1.3 }, { mode: "fr", value: 1 }, { mode: "fr", value: 2.2 }, { mode: "fr", value: 1.2 }],
      note: "El mismo mensaje debe cambiar de forma sin cambiar de fondo.",
    },
    chart: {
      title: "Calidad percibida por iteracion",
      categories: ["Prompt inicial", "Con audiencia", "Con tono", "Con riesgos", "Version editada"],
      series: [{ name: "Calidad", values: [42, 58, 71, 82, 92], fill: COLORS.accent }],
      insights: [
        "La calidad sube cuando el prompt gana contexto.",
        "La revision humana aporta el salto final.",
        "Riesgos reducen mensajes imprudentes.",
      ],
      warning: "No publique una salida sin revisar hechos y tono.",
    },
    checklist: {
      title: "Checklist editorial",
      items: [
        { title: "Claridad", body: "El mensaje principal se entiende en una lectura." },
        { title: "Audiencia", body: "El lenguaje se ajusta al conocimiento del receptor." },
        { title: "Veracidad", body: "Cifras, fechas y promesas estan verificadas." },
        { title: "Tono", body: "No contradice marca, institucion o contexto." },
        { title: "Accion", body: "El lector sabe que hacer despues." },
        { title: "Riesgo", body: "Se revisaron sesgos, exageraciones y malinterpretaciones." },
      ],
    },
    mistakes: [
      { title: "Publicar el primer borrador", fix: "Trate la salida como materia prima, no como pieza final." },
      { title: "No definir audiencia", fix: "Sin audiencia, el modelo produce texto generico." },
      { title: "Prometer demasiado", fix: "Pida explicitamente evitar afirmaciones no verificables." },
    ],
    close: {
      title: "Cierre del modulo",
      next: [
        "Guarda tu biblioteca de prompts.",
        "Documenta versiones y criterios de edicion.",
        "Prepara una pieza para validar con un par.",
      ],
      panelTitle: "Producto listo",
      panelBody: "Paquete comunicacional revisado y adaptable a varios canales.",
    },
    notes: {
      cover: "Explique que velocidad no equivale a calidad. La promesa del modulo es producir mejor con mas control.",
      core: "Use un mensaje simple y muestre como cambia al modificar audiencia, objetivo, tono y canal.",
      example: "Pida al grupo que identifique frases que podrian sonar demasiado promocionales o vagas.",
      process: "Subraye que el brief es una herramienta profesional, no solo una instruccion a la IA.",
      prompt: "Muestre como se puede pedir al modelo que critique su propia salida antes de mejorarla.",
      practice: "Sugiera trabajar en grupos por canal: correo, redes, informe o presentacion.",
      table: "Use la tabla para discutir por que copiar y pegar entre canales suele fallar.",
      chart: "Explique que el grafico ilustra aprendizaje iterativo; no representa datos empiricos.",
      checklist: "Invite a convertir el checklist en una plantilla de aprobacion editorial.",
      mistakes: "Refuerce que la responsabilidad del mensaje siempre queda en la persona o institucion.",
      close: "Pida que el paquete de comunicacion se conecte con el proyecto final si aplica.",
    },
  },
  {
    file: "modulo-04-analisis-datos.pptx",
    footer: "Modulo IV - Analisis de datos y decisiones",
    kicker: "Modulo IV",
    title: "IA para analisis de datos y toma de decisiones",
    subtitle: "Preguntas analiticas, Excel, SQL, Python, dashboards, validacion y narrativa ejecutiva.",
    coverCallout: {
      title: "Datos primero, IA despues",
      body: "La IA acelera exploracion y comunicacion, pero los calculos deben ser verificables.",
    },
    agenda: [
      "Pregunta de negocio",
      "Calidad y preparacion de datos",
      "IA con Excel, SQL y Python",
      "Visualizaciones y dashboards",
      "Validacion de hallazgos",
      "Informe ejecutivo",
    ],
    outcomes: [
      "Formular preguntas analiticas utiles.",
      "Usar IA para apoyar formulas, SQL y codigo.",
      "Validar resultados antes de decidir.",
      "Comunicar hallazgos con claridad ejecutiva.",
    ],
    moduleEvidence: "informe de hallazgos con visualizacion, validacion y recomendacion.",
    coreTitle: "Cadena de valor del analisis con IA",
    coreConcepts: [
      { term: "Pregunta", meaning: "Sin una decision a apoyar, el analisis se vuelve exploracion sin foco." },
      { term: "Datos", meaning: "Estructura, calidad, definiciones y permisos determinan confiabilidad." },
      { term: "Modelo", meaning: "IA ayuda a escribir formulas, consultas, codigo y explicaciones." },
      { term: "Decision", meaning: "El resultado debe traducirse en accion, riesgo y siguiente paso." },
    ],
    example: {
      title: "Ejemplo aplicado: ventas por region",
      context: "La gerencia quiere saber donde enfocar esfuerzos comerciales usando un dataset de ventas por region, canal y categoria.",
      actions: [
        "Calcular ingreso total y unidades vendidas.",
        "Comparar region, categoria, canal y vendedor.",
        "Crear visualizaciones para patrones principales.",
        "Redactar recomendacion con supuestos y limites.",
      ],
      result: "decision comercial respaldada por datos y no solo por intuicion.",
    },
    process: {
      title: "Flujo analitico asistido por IA",
      steps: [
        { title: "Preguntar", body: "Definir decision, metrica, periodo y nivel de detalle." },
        { title: "Preparar", body: "Revisar tipos, valores faltantes, duplicados y calculos." },
        { title: "Analizar", body: "Usar formulas, SQL, Python o BI con apoyo de IA." },
        { title: "Validar", body: "Comparar resultados, revisar supuestos y explicar limites." },
      ],
      control: "Regla practica: no presentar un hallazgo que no pueda recalcular o explicar.",
    },
    prompt: {
      text: `Actua como analista de datos. Tengo un dataset de ventas con columnas fecha, region, categoria, vendedor, unidades, precio_unitario y canal. Ayudame a formular un plan de analisis exploratorio, metricas clave, visualizaciones y validaciones antes de presentar resultados.`,
      checks: [
        "Pregunta por metricas y visualizaciones.",
        "Incluye validaciones tecnicas.",
        "No pide conclusiones sin ver datos.",
        "Orienta hacia decision ejecutiva.",
      ],
      tip: "La IA tambien debe ayudar a dudar.",
    },
    practice: {
      title: "Practica: analisis de ventas",
      objective: "Convertir un dataset sintetico en hallazgos ejecutivos verificables.",
      steps: [
        "Cargar ventas_ejemplo.csv en Excel, Python o BI.",
        "Crear columna ingreso = unidades x precio_unitario.",
        "Comparar ingreso por region, categoria y canal.",
        "Redactar tres hallazgos, limites y recomendacion.",
      ],
      deliverable: "Informe ejecutivo de una pagina.",
    },
    table: {
      title: "Validaciones minimas antes de presentar",
      rows: [
        ["Validacion", "Pregunta", "Ejemplo de control", "Riesgo si falta"],
        ["Tipos", "La fecha es fecha?", "Convertir y ordenar", "Meses mal agrupados"],
        ["Faltantes", "Hay campos vacios?", "Conteo por columna", "Totales incompletos"],
        ["Calculo", "Ingreso esta correcto?", "Unidades x precio", "Cifras falsas"],
        ["Segmento", "Categorias consistentes?", "Normalizar nombres", "Comparaciones invalidas"],
      ],
      columnTracks: [{ mode: "fr", value: 1.1 }, { mode: "fr", value: 1.6 }, { mode: "fr", value: 1.6 }, { mode: "fr", value: 1.5 }],
      note: "Validar no es burocracia: es proteger la decision.",
    },
    chart: {
      title: "Ejemplo: ingresos por region",
      categories: ["Santo Domingo", "Santiago", "La Vega", "Puerto Plata", "San Pedro"],
      series: [{ name: "Ingreso", values: [19410, 12680, 7020, 6040, 3290], fill: COLORS.accent }],
      insights: [
        "Santo Domingo lidera por amplio margen.",
        "Santiago concentra una segunda oportunidad.",
        "Regiones menores requieren hipotesis adicionales.",
      ],
      warning: "No inferir causa sin contexto comercial.",
    },
    checklist: {
      title: "Checklist de narrativa de datos",
      items: [
        { title: "Hallazgo", body: "Que cambio, donde y cuanto." },
        { title: "Evidencia", body: "Tabla, grafico o calculo reproducible." },
        { title: "Interpretacion", body: "Que podria explicar el patron." },
        { title: "Limite", body: "Que no se puede afirmar con estos datos." },
        { title: "Decision", body: "Accion recomendada y responsable." },
        { title: "Seguimiento", body: "Metrica para saber si funciono." },
      ],
    },
    mistakes: [
      { title: "Preguntar sin objetivo", fix: "Conecte el analisis con una decision concreta." },
      { title: "Confiar en codigo no revisado", fix: "Ejecute, lea y valide cada formula o consulta." },
      { title: "Confundir correlacion y causa", fix: "Use lenguaje prudente y proponga hipotesis verificables." },
    ],
    close: {
      title: "Cierre del modulo",
      next: [
        "Prepara tu informe ejecutivo.",
        "Guarda formulas, consultas o codigo.",
        "Lleva una recomendacion al proyecto final.",
      ],
      panelTitle: "Producto listo",
      panelBody: "Analisis reproducible con hallazgos y limites claros.",
    },
    notes: {
      cover: "Abra con una advertencia positiva: la IA es excelente para acelerar, pero mala para asumir responsabilidad por datos.",
      core: "Pregunte que decision concreta quieren apoyar antes de hablar de herramientas.",
      example: "Use el dataset del repositorio para que la practica sea reproducible.",
      process: "Insista en que validacion debe ocurrir antes de la narrativa ejecutiva.",
      prompt: "Muestre que el prompt no pide que invente resultados; pide un plan y controles.",
      practice: "Permita varias herramientas. Lo importante es que puedan explicar el calculo.",
      table: "Use esta diapositiva como lista de chequeo antes de entregar cualquier dashboard.",
      chart: "Los valores vienen del dataset sintetico incluido en el repositorio.",
      checklist: "Convierta cada hallazgo en una mini historia: dato, interpretacion, limite y accion.",
      mistakes: "Pida a los participantes identificar una conclusion que seria tentadora pero no demostrable.",
      close: "Conecte el informe de datos con el proyecto final del Modulo V.",
    },
  },
  {
    file: "modulo-05-proyecto-final.pptx",
    footer: "Modulo V - Proyecto aplicado",
    kicker: "Modulo V",
    title: "Desarrollo y presentacion de un proyecto aplicado con IA",
    subtitle: "Diagnostico, diseno, prototipo, evidencia, riesgos, implementacion y comunicacion ejecutiva.",
    coverCallout: {
      title: "De idea a solucion",
      body: "El proyecto final demuestra criterio: problema claro, IA pertinente y evidencia verificable.",
    },
    agenda: [
      "Seleccion del problema",
      "Alcance y objetivos",
      "Flujo de trabajo con IA",
      "Prototipo y evidencia",
      "Riesgos e implementacion",
      "Presentacion final",
    ],
    outcomes: [
      "Delimitar un problema laboral relevante.",
      "Disenar una solucion asistida por IA.",
      "Documentar evidencia y resultados.",
      "Presentar impacto, riesgos y plan de accion.",
    ],
    moduleEvidence: "proyecto aplicado completo con prototipo, documentacion y presentacion.",
    coreTitle: "Anatomia de un buen proyecto final",
    coreConcepts: [
      { term: "Problema", meaning: "Debe doler, repetirse o afectar una decision, servicio o entrega." },
      { term: "Solucion", meaning: "Explica como IA mejora el flujo sin ocultar supervision humana." },
      { term: "Evidencia", meaning: "Muestra pruebas, versiones, resultados y limites." },
      { term: "Impacto", meaning: "Traduce beneficios en tiempo, calidad, costo, riesgo o experiencia." },
    ],
    example: {
      title: "Ejemplo aplicado: asistente de reportes",
      context: "Un area prepara reportes mensuales manualmente desde hojas de calculo y tarda varios dias en producir narrativa ejecutiva.",
      actions: [
        "Estandarizar dataset y metricas principales.",
        "Usar IA para generar borrador de hallazgos.",
        "Validar cifras contra calculos reproducibles.",
        "Crear plantilla de informe y aprobacion.",
      ],
      result: "ciclo de reporte mas rapido, con control sobre datos y narrativa.",
    },
    process: {
      title: "Ruta del proyecto",
      steps: [
        { title: "Diagnostico", body: "Problema, actores, datos, restricciones y criterios de exito." },
        { title: "Diseno", body: "Flujo futuro, herramientas, prompts, controles y roles." },
        { title: "Prototipo", body: "Prueba controlada con datos sinteticos o anonimizados." },
        { title: "Entrega", body: "Resultados, riesgos, recomendaciones y plan de implementacion." },
      ],
      control: "Regla practica: si no hay evidencia del proceso, el proyecto parece una idea, no una solucion.",
    },
    prompt: {
      text: `Actua como asesor de proyectos de IA aplicada. Revisa esta idea de proyecto y ayudame a mejorarla. Evalua problema, objetivo, alcance, flujo de trabajo, datos requeridos, riesgos, controles, metricas e implementacion.\n\nIdea:\n[describir proyecto]\n\nDevuelve una tabla con mejoras y preguntas criticas.`,
      checks: [
        "Evalua problema y alcance.",
        "Incluye datos, riesgos y controles.",
        "Propone metricas de impacto.",
        "Formula preguntas criticas.",
      ],
      tip: "Un buen proyecto resiste preguntas dificiles.",
    },
    practice: {
      title: "Practica: sprint de proyecto",
      objective: "Convertir la oportunidad priorizada en una propuesta presentable y verificable.",
      steps: [
        "Redactar problema, objetivo general y alcance.",
        "Dibujar el flujo actual y el flujo futuro.",
        "Construir una prueba con un caso controlado.",
        "Documentar evidencia, riesgos y recomendacion.",
      ],
      deliverable: "Plantilla de proyecto aplicada completa.",
    },
    table: {
      title: "Rúbrica ejecutiva del proyecto",
      rows: [
        ["Criterio", "Pregunta guia", "Evidencia esperada", "Peso"],
        ["Problema", "Esta bien delimitado?", "Contexto, dolor, usuarios", "15%"],
        ["Solucion", "IA aporta valor real?", "Flujo, herramientas, controles", "20%"],
        ["Prototipo", "Se puede observar?", "Prueba, capturas, datos", "20%"],
        ["Impacto", "Vale la pena?", "Metricas y recomendacion", "15%"],
      ],
      columnTracks: [{ mode: "fr", value: 1.2 }, { mode: "fr", value: 1.8 }, { mode: "fr", value: 1.8 }, { mode: "fr", value: 0.7 }],
      note: "La presentacion final debe mostrar decision, no solo descripcion.",
    },
    chart: {
      title: "Balance recomendado del proyecto",
      categories: ["Problema", "Diseno", "Prototipo", "Impacto", "Riesgos"],
      series: [{ name: "Atencion", values: [22, 24, 24, 16, 14], fill: COLORS.accent }],
      insights: [
        "El prototipo pesa tanto como el diseno.",
        "Riesgos deben estar integrados, no al final.",
        "Impacto necesita metrica o evidencia.",
      ],
      warning: "Una demo sin control de riesgos queda incompleta.",
    },
    checklist: {
      title: "Checklist antes de presentar",
      items: [
        { title: "Problema", body: "Se entiende en menos de un minuto." },
        { title: "Alcance", body: "Queda claro que incluye y que no incluye." },
        { title: "Evidencia", body: "Hay pruebas visibles del prototipo." },
        { title: "Metricas", body: "Se muestra beneficio esperado o medido." },
        { title: "Riesgos", body: "Incluye controles concretos y responsables." },
        { title: "Siguiente paso", body: "La audiencia sabe que aprobar o probar." },
      ],
    },
    mistakes: [
      { title: "Problema demasiado grande", fix: "Acote a un proceso, usuario y resultado medible." },
      { title: "Demo sin evidencia", fix: "Guarde capturas, prompts, datos y versiones." },
      { title: "Ignorar implementacion", fix: "Incluya responsables, plazos, riesgos y adopcion." },
    ],
    close: {
      title: "Cierre del diplomado",
      next: [
        "Presenta problema, solucion y evidencia.",
        "Explica riesgos y controles.",
        "Propone un piloto realista.",
      ],
      panelTitle: "Producto final",
      panelBody: "Proyecto aplicado con IA listo para evaluacion y mejora.",
    },
    notes: {
      cover: "Presente el modulo como integrador. Todo lo anterior alimenta el proyecto final.",
      core: "Haga que cada participante diga su problema en una frase. Si no cabe en una frase, aun falta delimitar.",
      example: "Use este ejemplo para mostrar como datos, productividad y comunicacion se integran.",
      process: "Refuerce que prototipo no significa sistema completo. Una prueba controlada bien documentada basta.",
      prompt: "Use el prompt como evaluador critico. Pida que el modelo haga preguntas incomodas.",
      practice: "Dedique tiempo de taller. El facilitador debe circular y ayudar a acotar proyectos.",
      table: "Explique la rubrica antes de que construyan la entrega, no solo al final.",
      chart: "El grafico sugiere balance de esfuerzo. No abandonar riesgos ni impacto por enfocarse solo en demo.",
      checklist: "Use la lista como ensayo final antes de presentar.",
      mistakes: "Ayude a convertir ideas grandes en pilotos de 2 a 4 semanas.",
      close: "Cierre celebrando que el valor no esta en usar muchas herramientas, sino en resolver un problema real.",
    },
  },
];

async function writeBlob(filePath, blob) {
  await fs.writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
}

async function exportDeck(deck) {
  const presentation = buildDeck(deck);
  const pptxPath = path.join(OUTPUT_DIR, deck.file);
  const deckQaDir = path.join(QA_DIR, deck.file.replace(/\.pptx$/, ""));
  await fs.mkdir(deckQaDir, { recursive: true });

  for (const [index, slide] of presentation.slides.items.entries()) {
    const stem = `slide-${String(index + 1).padStart(2, "0")}`;
    const png = await presentation.export({ slide, format: "png", scale: 1 });
    await writeBlob(path.join(deckQaDir, `${stem}.png`), png);
    const layout = await slide.export({ format: "layout" });
    await fs.writeFile(path.join(deckQaDir, `${stem}.layout.json`), await layout.text());
  }

  const montage = await presentation.export({ format: "webp", montage: true, scale: 1 });
  await writeBlob(path.join(deckQaDir, "montage.webp"), montage);

  const pptx = await PresentationFile.exportPptx(presentation);
  await pptx.save(pptxPath);
  await fs.rm(`${pptxPath}.inspect.ndjson`, { force: true });
  return { pptxPath, montagePath: path.join(deckQaDir, "montage.webp") };
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.mkdir(QA_DIR, { recursive: true });
  const manifest = [];
  for (const deck of decks) {
    const result = await exportDeck(deck);
    manifest.push(result);
    console.log(`Created ${result.pptxPath}`);
  }
  await fs.writeFile(path.join(QA_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
