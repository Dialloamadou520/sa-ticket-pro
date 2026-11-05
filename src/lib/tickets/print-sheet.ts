import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { SITE } from "@/lib/constants";

export interface PrintSheetTicket {
  number: number;
  qrToken: string;
}

export interface PrintSheetEvent {
  title: string;
  date: string;
  location: string;
  category: string;
  price: string;
  color: [number, number, number];
}

export type PrintFormat = "tickets" | "labels";

const A4_W = 210;
const A4_H = 297;

/** jsPDF (polices standard) ne connaît pas les espaces insécables fines. */
function pdfText(value: string): string {
  return value.replace(/[\u202f\u00a0]/g, " ");
}

export function ticketNumber(n: number): string {
  return String(n).padStart(4, "0");
}

export function ticketReference(token: string): string {
  return token.slice(0, 8).toUpperCase();
}

export function verifyUrl(token: string): string {
  return `${SITE.url}/verifier/${token}`;
}

async function qrDataUrl(token: string): Promise<string> {
  return QRCode.toDataURL(verifyUrl(token), {
    width: 360,
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#ffffff" },
  });
}

function fitText(doc: jsPDF, text: string, maxWidth: number): string {
  let out = pdfText(text);
  if (doc.getTextWidth(out) <= maxWidth) return out;
  while (out.length > 4 && doc.getTextWidth(`${out}…`) > maxWidth) out = out.slice(0, -1);
  return `${out.trimEnd()}…`;
}

/** Coupe le texte en `max` lignes, avec « … » si le reste ne tient pas. */
function wrapLines(doc: jsPDF, text: string, maxWidth: number, max: number): string[] {
  const lines = doc.splitTextToSize(pdfText(text), maxWidth) as string[];
  if (lines.length <= max) return lines;
  const kept = lines.slice(0, max);
  kept[max - 1] = fitText(doc, `${kept[max - 1]} ${lines[max]}`, maxWidth);
  return kept;
}

function cropMarks(doc: jsPDF, x: number, y: number, w: number, h: number) {
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([1, 1], 0);
  doc.rect(x, y, w, h);
  doc.setLineDashPattern([], 0);
}

/** Billet complet (8 par page A4) : infos événement + QR + numéro. */
function drawTicket(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  event: PrintSheetEvent,
  ticket: PrintSheetTicket,
  qr: string
) {
  cropMarks(doc, x, y, w, h);
  const pad = 4;
  const [r, g, b] = event.color;

  doc.setFillColor(r, g, b);
  doc.rect(x, y, 6, h, "F");

  const qrSize = h - 2 * pad - 8;
  const qrX = x + w - pad - qrSize;
  const textX = x + 6 + pad;
  const textW = qrX - textX - 3;

  doc.setTextColor(r, g, b);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(fitText(doc, `${SITE.name.toUpperCase()} · ${event.category.toUpperCase()}`, textW), textX, y + pad + 3);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  const title = wrapLines(doc, event.title, textW, 2);
  doc.text(title, textX, y + pad + 9);

  let ty = y + pad + 9 + title.length * 4.6 + 1;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const date = wrapLines(doc, event.date, textW, 2);
  doc.text(date, textX, ty);
  ty += date.length * 3.4 + 0.6;
  doc.text(wrapLines(doc, event.location, textW, 2), textX, ty);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(fitText(doc, event.price, textW), textX, y + h - pad - 7);

  doc.setFont("courier", "bold");
  doc.setFontSize(10);
  doc.text(`N° ${ticketNumber(ticket.number)}`, textX, y + h - pad - 1.5);

  doc.addImage(qr, "PNG", qrX, y + pad, qrSize, qrSize);
  doc.setFont("courier", "normal");
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`RÉF. ${ticketReference(ticket.qrToken)}`, qrX + qrSize / 2, y + h - pad - 1.5, {
    align: "center",
  });
}

/** Étiquette QR seule (24 par page A4) à coller ou imprimer sur un ticket existant. */
function drawLabel(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  event: PrintSheetEvent,
  ticket: PrintSheetTicket,
  qr: string
) {
  cropMarks(doc, x, y, w, h);
  const qrSize = Math.min(w - 8, h - 14);
  doc.addImage(qr, "PNG", x + (w - qrSize) / 2, y + 3, qrSize, qrSize);
  doc.setTextColor(15, 23, 42);
  doc.setFont("courier", "bold");
  doc.setFontSize(9);
  doc.text(`N° ${ticketNumber(ticket.number)}`, x + w / 2, y + qrSize + 7, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(71, 85, 105);
  doc.text(
    fitText(doc, `${event.category} · RÉF. ${ticketReference(ticket.qrToken)}`, w - 4),
    x + w / 2,
    y + qrSize + 10.5,
    { align: "center" }
  );
}

const LAYOUTS: Record<PrintFormat, { cols: number; rows: number; margin: number }> = {
  tickets: { cols: 2, rows: 5, margin: 8 },
  labels: { cols: 4, rows: 6, margin: 8 },
};

/**
 * Génère le PDF d'impression (A4) d'un lot de billets physiques.
 * `onProgress` reçoit le nombre de QR déjà dessinés.
 */
export async function buildPrintSheet(
  format: PrintFormat,
  event: PrintSheetEvent,
  tickets: PrintSheetTicket[],
  onProgress?: (done: number) => void
): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const { cols, rows, margin } = LAYOUTS[format];
  const cellW = (A4_W - 2 * margin) / cols;
  const cellH = (A4_H - 2 * margin) / rows;
  const perPage = cols * rows;
  const draw = format === "tickets" ? drawTicket : drawLabel;

  for (let i = 0; i < tickets.length; i++) {
    if (i > 0 && i % perPage === 0) doc.addPage();
    const slot = i % perPage;
    const x = margin + (slot % cols) * cellW;
    const y = margin + Math.floor(slot / cols) * cellH;
    const qr = await qrDataUrl(tickets[i].qrToken);
    draw(doc, x, y, cellW, cellH, event, tickets[i], qr);
    if (onProgress && (i % 20 === 19 || i === tickets.length - 1)) {
      onProgress(i + 1);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
  return doc;
}

/** CSV pour un imprimeur (impression de données variables). */
export function buildPrintCsv(event: PrintSheetEvent, tickets: PrintSheetTicket[]): string {
  const header = ["Numero", "Categorie", "Reference", "Contenu QR"];
  const lines = tickets.map((t) =>
    [ticketNumber(t.number), event.category, ticketReference(t.qrToken), verifyUrl(t.qrToken)]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header.join(","), ...lines].join("\n");
}

/** Design de billet importé par l'organisateur, avec la position du QR et du numéro. */
export interface CustomTicketDesign {
  /** Image du billet (data URL JPEG). */
  image: string;
  widthMm: number;
  heightMm: number;
  /** Coin haut-gauche (fraction du billet) et côté (fraction de la largeur). */
  qr: { x: number; y: number; size: number };
  /** Centre du numéro (fraction du billet), taille en points. */
  number: { show: boolean; x: number; y: number; sizePt: number; light: boolean };
}

const CUSTOM_MARGIN = 5;
/** Format maximal d'un billet pour tenir sur une A4 portrait (marges comprises). */
export const CUSTOM_MAX_W_MM = A4_W - 2 * CUSTOM_MARGIN;
export const CUSTOM_MAX_H_MM = A4_H - 2 * CUSTOM_MARGIN;

/** Disposition des billets sur une page A4 portrait. */
export function customTicketGrid(widthMm: number, heightMm: number) {
  const cols = Math.floor((CUSTOM_MAX_W_MM + 0.001) / widthMm);
  const rows = Math.floor((CUSTOM_MAX_H_MM + 0.001) / heightMm);
  return {
    cols,
    rows,
    offsetX: (A4_W - cols * widthMm) / 2,
    offsetY: (A4_H - rows * heightMm) / 2,
  };
}

/**
 * PDF des billets d'un lot sur le design de l'organisateur : l'image est
 * répétée (intégrée une seule fois) et chaque billet reçoit son QR et son numéro.
 */
export async function buildCustomDesignSheet(
  design: CustomTicketDesign,
  tickets: PrintSheetTicket[],
  onProgress?: (done: number) => void
): Promise<jsPDF> {
  const w = design.widthMm;
  const h = design.heightMm;
  const grid = customTicketGrid(w, h);
  if (grid.cols < 1 || grid.rows < 1) {
    throw new Error(`Billet trop grand pour une A4 portrait (max ${CUSTOM_MAX_W_MM} × ${CUSTOM_MAX_H_MM} mm).`);
  }
  const doc = new jsPDF({ unit: "mm", orientation: "portrait", format: "a4" });
  const perPage = grid.cols * grid.rows;
  const qrSize = design.qr.size * w;
  const quiet = Math.max(1, qrSize * 0.06);

  for (let i = 0; i < tickets.length; i++) {
    if (i > 0 && i % perPage === 0) doc.addPage();
    const slot = i % perPage;
    const x = grid.offsetX + (slot % grid.cols) * w;
    const y = grid.offsetY + Math.floor(slot / grid.cols) * h;

    doc.addImage(design.image, "JPEG", x, y, w, h, "ticket-design", "FAST");
    cropMarks(doc, x, y, w, h);

    const qx = x + design.qr.x * w;
    const qy = y + design.qr.y * h;
    doc.setFillColor(255, 255, 255);
    doc.rect(qx - quiet, qy - quiet, qrSize + 2 * quiet, qrSize + 2 * quiet, "F");
    doc.addImage(await qrDataUrl(tickets[i].qrToken), "PNG", qx, qy, qrSize, qrSize, undefined, "FAST");

    if (design.number.show) {
      const light = design.number.light;
      doc.setTextColor(light ? 255 : 15, light ? 255 : 23, light ? 255 : 42);
      doc.setFont("courier", "bold");
      doc.setFontSize(design.number.sizePt);
      doc.text(
        `N° ${ticketNumber(tickets[i].number)}`,
        x + design.number.x * w,
        y + design.number.y * h,
        { align: "center", baseline: "middle" }
      );
    }

    if (onProgress && (i % 20 === 19 || i === tickets.length - 1)) {
      onProgress(i + 1);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
  return doc;
}
