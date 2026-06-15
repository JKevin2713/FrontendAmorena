import type { Language } from "@/lib/language/language-context";
import type { MenuCategory } from "@/lib/menu-categories";
import type { MenuItem } from "@/lib/menu-types";
import logoSvg from "@/assets/Logotipo.svg";

export type MenuPdfTextSize = "standard" | "large" | "extraLarge";

export type MenuPdfOptions = {
  language: Language;
  categoryNames: string[];
  textSize: MenuPdfTextSize;
};

export type MenuPdfLabels = {
  title: string;
  subtitle: string;
  generated: string;
  allCategories: string;
  empty: string;
};

type PdfPage = {
  commands: string[];
  y: number;
};

type ProductGroup = {
  category: MenuCategory | null;
  name: string;
  description: string;
  items: MenuItem[];
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
  white: [255, 255, 255],
};

const textSizeScale: Record<MenuPdfTextSize, number> = {
  standard: 1,
  large: 1.16,
  extraLarge: 1.32,
};

function formatPrice(value: number) {
  return `CRC ${value.toLocaleString("es-CR")}`;
}

function formatGeneratedDate(language: Language) {
  const locale = language === "en" ? "en-US" : "es-CR";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

function localizedText(language: Language, spanish: string, english?: string | null) {
  if (language === "en" && english?.trim()) return english;
  return spanish;
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
  if (page.y - required < margin) {
    page = addPage(pages);
  }
  return page;
}

function groupProducts(items: MenuItem[], categories: MenuCategory[], options: MenuPdfOptions): ProductGroup[] {
  const selected = new Set(options.categoryNames);
  const categoryByName = new Map(categories.map((category) => [category.name, category]));

  return categories
    .filter((category) => selected.has(category.name))
    .map((category) => ({
      category,
      name: localizedText(options.language, category.name, category.name_en),
      description: localizedText(options.language, category.description, category.description_en),
      items: items.filter((item) => item.cat === category.name),
    }))
    .concat(
      items
        .filter((item) => selected.has(item.cat) && !categoryByName.has(item.cat))
        .reduce<ProductGroup[]>((groups, item) => {
          const existing = groups.find((group) => group.name === item.cat);
          if (existing) existing.items.push(item);
          else groups.push({ category: null, name: item.cat, description: "", items: [item] });
          return groups;
        }, []),
    )
    .filter((group) => group.items.length > 0);
}

function drawHeader(page: PdfPage, labels: MenuPdfLabels, options: MenuPdfOptions, productCount: number, logo?: PdfImage | null) {
  rect(page, 0, pageHeight - 156, pageWidth, 156, "forest");
  rect(page, pageWidth - 156, pageHeight - 156, 156, 156, "tan");
  if (logo) {
    image(page, logo.id, pageWidth - 141, pageHeight - 112, 126, 66);
  }

  text(page, "Amorena", margin, pageHeight - 72, { size: 34, font: "serif", fill: "cream" });
  text(page, labels.title, margin, pageHeight - 104, { size: 18, font: "bold", fill: "cream" });
  text(page, labels.subtitle, margin, pageHeight - 126, { size: 10.5, fill: "cream" });

  const productLabel = options.language === "en"
    ? productCount === 1 ? "product" : "products"
    : productCount === 1 ? "producto" : "productos";
  const summary = `${productCount} ${productLabel} - ${labels.generated} ${formatGeneratedDate(options.language)}`;
  text(page, summary, margin, pageHeight - 146, { size: 9.5, fill: "tan" });
  page.y = pageHeight - 190;
}

function drawCategory(page: PdfPage, group: ProductGroup, scale: number) {
  const categorySize = 22 * scale;
  text(page, group.name, margin, page.y, { size: categorySize, font: "serif", fill: "forest" });
  line(page, margin + estimateWidth(group.name, categorySize) + 16, page.y + 5, pageWidth - margin, page.y + 5, "tanDark", 0.8);
  page.y -= 20 * scale;

  if (group.description) {
    wrapText(group.description, contentWidth, 10.5 * scale).slice(0, 2).forEach((lineText) => {
      text(page, lineText, margin, page.y, { size: 10.5 * scale, fill: "muted" });
      page.y -= 13 * scale;
    });
    page.y -= 8;
  }
}

function drawProduct(page: PdfPage, item: MenuItem, options: MenuPdfOptions, scale: number, images: Map<string, PdfImage>) {
  const name = localizedText(options.language, item.name, item.nameEn);
  const description = localizedText(options.language, item.desc, item.descEn);
  const price = formatPrice(item.price);
  const productImage = images.get(item.id);
  const nameSize = 12.6 * scale;
  const bodySize = 9.6 * scale;
  const cardX = margin - 10;
  const cardWidth = contentWidth + 20;
  const leftPadding = 16 * scale;
  const rightPadding = 22 * scale;
  const topPadding = 18 * scale;
  const bottomPadding = 12 * scale;
  const contentX = cardX + leftPadding;
  const priceColumnWidth = 82 * scale;
  const priceColumnX = cardX + cardWidth - rightPadding - priceColumnWidth;
  const imageWidth = productImage ? 76 * scale : 0;
  const imageHeight = productImage ? 58 * scale : 0;
  const imageGap = productImage ? 14 * scale : 0;
  const imageX = priceColumnX - imageGap - imageWidth;
  const contentMaxWidth = (productImage ? imageX : priceColumnX) - contentX - 18 * scale;
  const priceWidth = estimateWidth(price, nameSize) + 8;
  const priceX = priceColumnX + priceColumnWidth - priceWidth;
  const nameLines = wrapText(name, contentMaxWidth, nameSize).slice(0, 2);
  const descLines = description ? wrapText(description, contentMaxWidth, bodySize).slice(0, 3) : [];
  const tags = item.tags?.map((tag) => localizedText(options.language, tag.name, tag.nameEn)).filter(Boolean) ?? [];
  const tagLine = tags.length > 0 ? tags.slice(0, 4).join("  /  ") : "";
  const contentHeight = nameLines.length * 14 * scale + descLines.length * 12 * scale + (tagLine ? 11 * scale : 0);
  const height = Math.max(48 * scale, topPadding + Math.max(contentHeight, imageHeight) + bottomPadding);
  const cardTop = page.y;
  const cardBottom = cardTop - height;

  rect(page, cardX, cardBottom, cardWidth, height, "card");
  line(page, cardX, cardBottom, cardX, cardTop, "tanDark", 2.5);

  if (productImage) {
    image(
      page,
      productImage.id,
      imageX,
      cardTop - topPadding - imageHeight + 8 * scale,
      imageWidth,
      imageHeight,
    );
  }

  line(page, priceColumnX - 10 * scale, cardBottom + 12 * scale, priceColumnX - 10 * scale, cardTop - 12 * scale, "tanDark", 0.45);

  let cursor = cardTop - topPadding;
  nameLines.forEach((lineText) => {
    text(page, lineText, contentX, cursor, { size: nameSize, font: "bold", fill: "coffee" });
    cursor -= 14 * scale;
  });
  text(page, price, priceX, cardTop - topPadding, { size: nameSize, font: "bold", fill: "forest" });

  descLines.forEach((lineText) => {
    text(page, lineText, contentX, cursor - 2, { size: bodySize, fill: "muted" });
    cursor -= 12 * scale;
  });

  if (tagLine) {
    text(page, tagLine, contentX, cursor - 2, { size: 8.5 * scale, fill: "tanDark" });
  }

  page.y -= height + 10;
}

function buildPdfContent(
  items: MenuItem[],
  categories: MenuCategory[],
  options: MenuPdfOptions,
  labels: MenuPdfLabels,
  images: Map<string, PdfImage>,
  logo?: PdfImage | null,
) {
  const groups = groupProducts(items, categories, options);
  const scale = textSizeScale[options.textSize];
  const pages: PdfPage[] = [];
  const firstPage = addPage(pages);
  drawHeader(firstPage, labels, options, groups.reduce((count, group) => count + group.items.length, 0), logo);

  if (groups.length === 0) {
    text(firstPage, labels.empty, margin, firstPage.y, { size: 14, fill: "coffee" });
  }

  groups.forEach((group) => {
    let page = ensureSpace(pages, 78 * scale);
    drawCategory(page, group, scale);
    group.items.forEach((item) => {
      page = ensureSpace(pages, 88 * scale);
      drawProduct(page, item, options, scale, images);
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

async function loadProductImage(item: MenuItem, index: number): Promise<PdfImage | null> {
  if (!item.img?.trim()) return null;
  try {
    const img = await loadImageElement(item.img.trim());
    const canvas = document.createElement("canvas");
    canvas.width = 420;
    canvas.height = 320;
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

async function loadProductImages(items: MenuItem[]) {
  const images = new Map<string, PdfImage>();
  const loaded = await Promise.all(items.map((item, index) => loadProductImage(item, index)));
  loaded.forEach((imageData, index) => {
    if (imageData) images.set(items[index].id, imageData);
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

export async function downloadMenuPdf(items: MenuItem[], categories: MenuCategory[], options: MenuPdfOptions, labels: MenuPdfLabels) {
  const selected = new Set(options.categoryNames);
  const selectedItems = items.filter((item) => selected.has(item.cat));
  const [imageMap, logo] = await Promise.all([loadProductImages(selectedItems), loadLogoImage()]);
  const pages = buildPdfContent(items, categories, options, labels, imageMap, logo);
  const blob = createPdfBlob(pages, [...Array.from(imageMap.values()), ...(logo ? [logo] : [])]);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const suffix = options.language === "en" ? "en" : "es";
  link.href = url;
  link.download = `amorena-menu-${suffix}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
