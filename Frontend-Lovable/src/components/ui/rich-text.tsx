import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type RichTextProps = {
  text: string;
  className?: string;
};

function sanitizeUrl(url: string) {
  const trimmed = url.trim();
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return trimmed;
  if (trimmed.startsWith("mailto:")) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return trimmed;
  } catch {
    return "#";
  }
  return "#";
}

function parseInline(text: string) {
  const tokenRe = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^\)]+\))/g;
  const parts = text.split(tokenRe).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("[")) {
      const match = part.match(/^\[([^\]]+)\]\(([^\)]+)\)$/);
      if (match) {
        const href = sanitizeUrl(match[2]);
        return (
          <a key={index} href={href} target="_blank" rel="noreferrer" className="underline">
            {match[1]}
          </a>
        );
      }
    }
    return <span key={index}>{part}</span>;
  });
}

export function RichText({ text, className }: RichTextProps) {
  const lines = text.split("\n");
  const blocks: Array<{ type: "list"; items: string[] } | { type: "paragraph"; text: string }> = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.length === 0) return;

    const listMatch = trimmed.match(/^[-*]\s+(.*)/);
    if (listMatch) {
      const current = blocks[blocks.length - 1];
      if (current && current.type === "list") {
        current.items.push(listMatch[1]);
      } else {
        blocks.push({ type: "list", items: [listMatch[1]] });
      }
    } else {
      blocks.push({ type: "paragraph", text: trimmed });
    }
  });

  return (
    <div className={cn("space-y-2", className)}>
      {blocks.map((block, index) => {
        if (block.type === "list") {
          return (
            <ul key={`list-${index}`} className="list-disc pl-5 space-y-1">
              {block.items.map((item, itemIndex) => (
                <li key={`item-${index}-${itemIndex}`}>{parseInline(item)}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`p-${index}`} className="leading-relaxed">
            {parseInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}
