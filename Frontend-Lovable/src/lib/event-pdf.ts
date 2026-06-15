import type { ApiEvento } from "@/lib/api";
import type { Language } from "@/lib/language/language-context";
import logoSvg from "@/assets/Logotipo.svg";

export type EventPdfTextSize = "standard" | "large" | "extraLarge";

export type EventPdfOptions = {
  language: Language;
  categoryNames: string[];
  eventIds: string[];
  textSize: EventPdfTextSize;
  startDate?: string;
  endDate?: string;
};

export type EventPdfLabels = {
  title: string;
  subtitle: string;
  generated: string;
  empty: string;
  featured: string;
  date: string;
  time: string;
  category: string;
  location: string;
  noDate: string;
  dateRange: string;
  upcomingOnly: string;
  from: string;
  to: string;
};

type PdfPage = {
  commands: string[];
  y: number;
};

type EventGroup = {
  name: string;
  events: ApiEvento[];
};

type PdfImage = {
  id: string;
  bytes: Uint8Array;
  width: number;
  height: number;
};

const pageWidth = 595.28;
const pageHeight = 841.89;
const margin = 44;
const contentWidth = pageWidth - margin * 2;

const rgb = {
  cream: [247, 241, 222],
  card: [252, 250, 244],
  tan: [217, 189, 145],
  tanDark: [184, 147, 104],
  forest: [31, 90, 60],
  coffee: [77, 57, 45],
  muted: [104, 92, 78],
};

const textSizeScale: Record<EventPdfTextSize, number> = {
  standard: 1,
  large: 1.16,
  extraLarge: 1.32,
};

function localizedText(language: Language, spanish?: string | null, english?: string | null) {
  if (language === "en" && english?.trim()) return english;
  return spanish ?? "";
}

export function getTodayIso() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateToTime(value?: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day).getTime();
}

export function isEventWithinDateRange(event: ApiEvento, startDate?: string, endDate?: string) {
  const eventTime = dateToTime(event.fecha);
  if (!eventTime) return true;
  const startTime = dateToTime(startDate);
  const endTime = dateToTime(endDate);
  if (startTime && eventTime < startTime) return false;
  if (endTime && eventTime > endTime) return false;
  return true;
}

function formatGeneratedDate(language: Language) {
  const locale = language === "en" ? "en-US" : "es-CR";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

function formatEventDate(value: string | undefined, language: Language, fallback: string) {
  if (!value) return fallback;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  const locale = language === "en" ? "en-US" : "es-CR";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(year, month - 1, day));
}

function formatDateRange(options: EventPdfOptions, labels: EventPdfLabels) {
  if (options.startDate === getTodayIso() && !options.endDate) {
    return labels.upcomingOnly;
  }
  if (options.startDate && options.endDate) {
    return `${labels.dateRange}: ${labels.from} ${formatEventDate(options.startDate, options.language, options.startDate)} ${labels.to} ${formatEventDate(options.endDate, options.language, options.endDate)}`;
  }
  if (options.startDate) {
    return `${labels.dateRange}: ${labels.from} ${formatEventDate(options.startDate, options.language, options.startDate)}`;
  }
  if (options.endDate) {
    return `${labels.dateRange}: ${labels.to} ${formatEventDate(options.endDate, options.language, options.endDate)}`;
  }
  return labels.upcomingOnly;
}

function sanitizeText(value: string) {
  return value
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\s+/g, " ")
    .trim();
}

function escapePdfText(value: string) {
  return sanitizeText(value)
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      if (char === "\\" || char === "(" || char === ")") return `\\${char}`;
      if (char === "\n") return "\\n";
      if (code <= 255) return char;
      return "?";
    })
    .join("");
}

function color(name: keyof typeof rgb) {
  const [r, g, b] = rgb[name].map((part) => (part / 255).toFixed(3));
  return `${r} ${g} ${b}`;
}

function rect(page: PdfPage, x: number, y: number, width: number, height: number, fill: keyof typeof rgb) {
  page.commands.push(`${color(fill)} rg ${x} ${y} ${width} ${height} re f`);
}

function line(page: PdfPage, x1: number, y1: number, x2: number, y2: number, stroke: keyof typeof rgb, width = 1) {
  page.commands.push(`${color(stroke)} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S`);
}

function text(
  page: PdfPage,
  value: string,
  x: number,
  y: number,
  options: { size: number; font?: "regular" | "serif" | "bold"; fill?: keyof typeof rgb },
) {
  const font = options.font === "bold" ? "F3" : options.font === "serif" ? "F2" : "F1";
  page.commands.push(
    `BT /${font} ${options.size.toFixed(2)} Tf ${color(options.fill ?? "coffee")} rg ${x.toFixed(2)} ${y.toFixed(2)} Td (${escapePdfText(value)}) Tj ET`,
  );
}

function image(page: PdfPage, imageId: string, x: number, y: number, width: number, height: number) {
  page.commands.push(`q ${width.toFixed(2)} 0 0 ${height.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /${imageId} Do Q`);
}

function estimateWidth(value: string, size: number) {
  return sanitizeText(value).split("").reduce((total, char) => {
    if (char === " ") return total + size * 0.25;
    if ("il.,'".includes(char)) return total + size * 0.24;
    if ("mwMW".includes(char)) return total + size * 0.78;
    if (char === char.toUpperCase() && /[A-Z]/.test(char)) return total + size * 0.58;
    return total + size * 0.5;
  }, 0);
}

function wrapText(value: string, maxWidth: number, size: number) {
  const words = sanitizeText(value).split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (estimateWidth(next, size) <= maxWidth) {
      current = next;
      return;
    }
    if (current) lines.push(current);
    current = word;
  });

  if (current) lines.push(current);
  return lines;
}

function createPage(): PdfPage {
  return { commands: [], y: pageHeight - margin };
}

function addPage(pages: PdfPage[]) {
  const page = createPage();
  rect(page, 0, 0, pageWidth, pageHeight, "cream");
  pages.push(page);
  return page;
}

function ensureSpace(pages: PdfPage[], required: number) {
  let page = pages[pages.length - 1];
  if (page.y - required < margin) page = addPage(pages);
  return page;
}

function getSelectedEvents(events: ApiEvento[], options: EventPdfOptions) {
  const selectedCategories = new Set(options.categoryNames);
  const selectedEvents = new Set(options.eventIds);
  return events
    .filter((event) => selectedEvents.has(event._id))
    .filter((event) => selectedCategories.has(event.categoria || "Otro"))
    .filter((event) => isEventWithinDateRange(event, options.startDate, options.endDate));
}

function groupEvents(events: ApiEvento[], options: EventPdfOptions): EventGroup[] {
  const groups: EventGroup[] = [];

  getSelectedEvents(events, options).forEach((event) => {
    const groupName = localizedText(options.language, event.categoria || "Otro", event.categoria_en);
    const existing = groups.find((group) => group.name === groupName);
    if (existing) existing.events.push(event);
    else groups.push({ name: groupName, events: [event] });
  });

  return groups;
}

function drawHeader(page: PdfPage, labels: EventPdfLabels, options: EventPdfOptions, eventCount: number, logo?: PdfImage | null) {
  rect(page, 0, pageHeight - 156, pageWidth, 156, "forest");
  rect(page, pageWidth - 156, pageHeight - 156, 156, 156, "tan");
  if (logo) {
    image(page, logo.id, pageWidth - 141, pageHeight - 112, 126, 66);
  }

  text(page, "Amorena", margin, pageHeight - 72, { size: 34, font: "serif", fill: "cream" });
  text(page, labels.title, margin, pageHeight - 104, { size: 18, font: "bold", fill: "cream" });
  text(page, labels.subtitle, margin, pageHeight - 126, { size: 10.5, fill: "cream" });

  const eventLabel = options.language === "en"
    ? eventCount === 1 ? "event" : "events"
    : eventCount === 1 ? "evento" : "eventos";
  const summary = `${eventCount} ${eventLabel} - ${labels.generated} ${formatGeneratedDate(options.language)}`;
  text(page, summary, margin, pageHeight - 146, { size: 9.5, fill: "tan" });
  page.y = pageHeight - 188;

  const rangeText = formatDateRange(options, labels);
  rect(page, margin, page.y - 22, contentWidth, 26, "card");
  text(page, rangeText, margin + 12, page.y - 8, { size: 9.5, fill: "coffee" });
  page.y -= 48;
}

function drawCategory(page: PdfPage, categoryName: string, scale: number) {
  const categorySize = 22 * scale;
  text(page, categoryName, margin, page.y, { size: categorySize, font: "serif", fill: "forest" });
  line(page, margin + estimateWidth(categoryName, categorySize) + 16, page.y + 5, pageWidth - margin, page.y + 5, "tanDark", 0.8);
  page.y -= 28 * scale;
}

function drawEvent(
  page: PdfPage,
  event: ApiEvento,
  labels: EventPdfLabels,
  options: EventPdfOptions,
  scale: number,
  images: Map<string, PdfImage>,
) {
  const title = localizedText(options.language, event.nombre, event.nombre_en);
  const description = localizedText(options.language, event.descripcion, event.descripcion_en);
  const category = localizedText(options.language, event.categoria || "Otro", event.categoria_en);
  const eventImage = images.get(event._id);
  const titleSize = 13.4 * scale;
  const bodySize = 9.7 * scale;
  const metaSize = 8.8 * scale;
  const cardX = margin - 10;
  const cardWidth = contentWidth + 20;
  const leftPadding = 16 * scale;
  const rightPadding = 18 * scale;
  const topPadding = 17 * scale;
  const bottomPadding = 13 * scale;
  const contentX = cardX + leftPadding;
  const imageWidth = eventImage ? 104 * scale : 0;
  const imageGap = eventImage ? 16 * scale : 0;
  const contentMaxWidth = cardWidth - leftPadding - rightPadding - imageWidth - imageGap;
  const titleLines = wrapText(title, contentMaxWidth - 92 * scale, titleSize).slice(0, 2);
  const descLines = description ? wrapText(description, contentMaxWidth, bodySize).slice(0, 4) : [];
  const dateText = formatEventDate(event.fecha, options.language, labels.noDate);
  const timeText = event.hora ? `${labels.time}: ${event.hora}` : "";
  const metaLine = [`${labels.date}: ${dateText}`, timeText, labels.location].filter(Boolean).join(" - ");
  const featuredTag = event.destacado ? labels.featured : "";
  const contentHeight =
    titleLines.length * 15 * scale +
    descLines.length * 12 * scale +
    26 * scale +
    (featuredTag ? 12 * scale : 0);
  const imageHeight = eventImage ? 78 * scale : 0;
  const height = Math.max(76 * scale, topPadding + Math.max(contentHeight, imageHeight) + bottomPadding);
  const cardTop = page.y;
  const cardBottom = cardTop - height;

  rect(page, cardX, cardBottom, cardWidth, height, "card");
  line(page, cardX, cardBottom, cardX, cardTop, "tanDark", 2.5);

  let cursor = cardTop - topPadding;
  const chipText = category || labels.category;
  const chipWidth = Math.min(96 * scale, estimateWidth(chipText, metaSize) + 18 * scale);
  const chipX = contentX + contentMaxWidth - chipWidth;
  rect(page, chipX, cursor - 5 * scale, chipWidth, 15 * scale, "tan");
  text(page, chipText, chipX + 8 * scale, cursor, { size: metaSize, fill: "coffee" });

  if (eventImage) {
    image(page, eventImage.id, cardX + cardWidth - rightPadding - imageWidth, cardTop - topPadding - imageHeight + 9 * scale, imageWidth, imageHeight);
  }

  titleLines.forEach((lineText) => {
    text(page, lineText, contentX, cursor, { size: titleSize, font: "bold", fill: "coffee" });
    cursor -= 15 * scale;
  });

  text(page, metaLine, contentX, cursor - 2 * scale, { size: metaSize, fill: "forest" });
  cursor -= 14 * scale;

  descLines.forEach((lineText) => {
    text(page, lineText, contentX, cursor - 2, { size: bodySize, fill: "muted" });
    cursor -= 12 * scale;
  });

  if (featuredTag) {
    text(page, featuredTag, contentX, cursor - 3, { size: 8.7 * scale, font: "bold", fill: "tanDark" });
  }

  page.y -= height + 10;
}

function buildPdfContent(
  events: ApiEvento[],
  options: EventPdfOptions,
  labels: EventPdfLabels,
  images: Map<string, PdfImage>,
  logo?: PdfImage | null,
) {
  const groups = groupEvents(events, options);
  const scale = textSizeScale[options.textSize];
  const pages: PdfPage[] = [];
  const firstPage = addPage(pages);
  drawHeader(firstPage, labels, options, groups.reduce((count, group) => count + group.events.length, 0), logo);

  if (groups.length === 0) {
    text(firstPage, labels.empty, margin, firstPage.y, { size: 14, fill: "coffee" });
  }

  groups.forEach((group) => {
    let page = ensureSpace(pages, 78 * scale);
    drawCategory(page, group.name, scale);
    group.events.forEach((event) => {
      page = ensureSpace(pages, 104 * scale);
      drawEvent(page, event, labels, options, scale, images);
    });
    page.y -= 12;
  });

  pages.forEach((page, index) => {
    line(page, margin, 32, pageWidth - margin, 32, "tanDark", 0.6);
    text(page, `Amorena Coffee & Garden - ${index + 1}/${pages.length}`, margin, 18, { size: 8.5, fill: "muted" });
  });

  return pages;
}

function binaryString(bytes: Uint8Array) {
  let value = "";
  bytes.forEach((byte) => {
    value += String.fromCharCode(byte);
  });
  return value;
}

function dataUrlToBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1];
  if (!base64) return new Uint8Array();
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function loadImageElement(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadEventImage(event: ApiEvento, index: number): Promise<PdfImage | null> {
  if (!event.imagen?.trim()) return null;
  try {
    const img = await loadImageElement(event.imagen.trim());
    const canvas = document.createElement("canvas");
    canvas.width = 520;
    canvas.height = 360;
    const context = canvas.getContext("2d");
    if (!context) return null;

    context.fillStyle = "#f7f1de";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const width = img.naturalWidth * scale;
    const height = img.naturalHeight * scale;
    const x = (canvas.width - width) / 2;
    const y = (canvas.height - height) / 2;
    context.drawImage(img, x, y, width, height);

    return {
      id: `Im${index + 1}`,
      bytes: dataUrlToBytes(canvas.toDataURL("image/jpeg", 0.82)),
      width: canvas.width,
      height: canvas.height,
    };
  } catch {
    return null;
  }
}

async function loadEventImages(events: ApiEvento[]) {
  const images = new Map<string, PdfImage>();
  const loaded = await Promise.all(events.map((event, index) => loadEventImage(event, index)));
  loaded.forEach((imageData, index) => {
    if (imageData) images.set(events[index]._id, imageData);
  });
  return images;
}

async function loadLogoImage(): Promise<PdfImage | null> {
  try {
    const img = await loadImageElement(logoSvg);
    const canvas = document.createElement("canvas");
    canvas.width = 542;
    canvas.height = 282;
    const context = canvas.getContext("2d");
    if (!context) return null;

    context.fillStyle = "#d9bd91";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(img, 0, 0, canvas.width, canvas.height);

    return {
      id: "Logo",
      bytes: dataUrlToBytes(canvas.toDataURL("image/jpeg", 0.88)),
      width: canvas.width,
      height: canvas.height,
    };
  } catch {
    return null;
  }
}

function encodeLatin1(value: string) {
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) {
    bytes[index] = value.charCodeAt(index) & 0xff;
  }
  return bytes;
}

function createPdfBlob(pages: PdfPage[], images: PdfImage[]) {
  const objects: string[] = [];
  const pageObjectIds = pages.map((_, index) => 3 + index * 2);
  const contentObjectIds = pages.map((_, index) => 4 + index * 2);
  const fontObjectId = 3 + pages.length * 2;
  const imageObjectIds = images.map((_, index) => fontObjectId + 3 + index);
  const catalogObjectId = 1;
  const pagesObjectId = 2;
  const xObjectResources = images.length > 0
    ? ` /XObject << ${images.map((imageData, index) => `/${imageData.id} ${imageObjectIds[index]} 0 R`).join(" ")} >>`
    : "";

  objects[catalogObjectId] = `<< /Type /Catalog /Pages ${pagesObjectId} 0 R >>`;
  objects[pagesObjectId] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;

  pages.forEach((page, index) => {
    const content = page.commands.join("\n");
    objects[pageObjectIds[index]] = `<< /Type /Page /Parent ${pagesObjectId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObjectId} 0 R /F2 ${fontObjectId + 1} 0 R /F3 ${fontObjectId + 2} 0 R >>${xObjectResources} >> /Contents ${contentObjectIds[index]} 0 R >>`;
    objects[contentObjectIds[index]] = `<< /Length ${encodeLatin1(content).length} >>\nstream\n${content}\nendstream`;
  });

  objects[fontObjectId] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  objects[fontObjectId + 1] = "<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >>";
  objects[fontObjectId + 2] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
  images.forEach((imageData, index) => {
    objects[imageObjectIds[index]] = `<< /Type /XObject /Subtype /Image /Width ${imageData.width} /Height ${imageData.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageData.bytes.length} >>\nstream\n${binaryString(imageData.bytes)}\nendstream`;
  });

  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets = [0];
  for (let id = 1; id < objects.length; id += 1) {
    if (!objects[id]) continue;
    offsets[id] = encodeLatin1(pdf).length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }

  const xrefOffset = encodeLatin1(pdf).length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) {
    pdf += `${String(offsets[id] ?? 0).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root ${catalogObjectId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([encodeLatin1(pdf)], { type: "application/pdf" });
}

export async function downloadEventsPdf(events: ApiEvento[], options: EventPdfOptions, labels: EventPdfLabels) {
  const selectedEvents = getSelectedEvents(events, options);
  const [imageMap, logo] = await Promise.all([loadEventImages(selectedEvents), loadLogoImage()]);
  const pages = buildPdfContent(events, options, labels, imageMap, logo);
  const blob = createPdfBlob(pages, [...Array.from(imageMap.values()), ...(logo ? [logo] : [])]);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const suffix = options.language === "en" ? "en" : "es";
  link.href = url;
  link.download = `amorena-eventos-${suffix}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
