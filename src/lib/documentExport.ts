import { jsPDF } from "jspdf";

function buildPrintableHtml(title: string, content: string) {
  const safeTitle = title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeContent = content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${safeTitle}</title>
      <style>
        @page { size: A4; margin: 18mm; }
        body { font-family: Georgia, serif; margin: 0; color: #111827; line-height: 1.8; }
        .wrap { max-width: 900px; margin: 0 auto; }
        h1 { font-size: 28px; margin: 0 0 8px; text-align: center; }
        .meta { text-align: center; color: #6b7280; font-size: 13px; margin-bottom: 24px; }
        .content { white-space: pre-wrap; font-size: 15px; }
      </style>
    </head>
    <body>
      <div class="wrap">
        <h1>${safeTitle}</h1>
        <div class="meta">Exported from DocOCR</div>
        <div class="content">${safeContent}</div>
      </div>
    </body>
  </html>`;
}

export async function downloadTextAsPdf(title: string, content: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 48;
  const marginTop = 56;
  const marginBottom = 48;
  const usableWidth = pageWidth - marginX * 2;
  const maxY = pageHeight - marginBottom;

  let y = marginTop;

  doc.setFont("times", "bold");
  doc.setFontSize(20);
  const titleLines = doc.splitTextToSize(title, usableWidth);
  doc.text(titleLines, pageWidth / 2, y, { align: "center" });
  y += titleLines.length * 24;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("Exported from DocOCR", pageWidth / 2, y, { align: "center" });
  y += 24;

  doc.setTextColor(17, 24, 39);
  doc.setFontSize(11);

  const paragraphs = content.split(/\n{2,}/);

  for (const paragraph of paragraphs) {
    const normalized = paragraph.replace(/\n/g, " ").trim();
    if (!normalized) {
      y += 12;
      continue;
    }

    const lines = doc.splitTextToSize(normalized, usableWidth);

    for (const line of lines) {
      if (y > maxY) {
        doc.addPage();
        y = marginTop;
      }
      doc.text(line, marginX, y);
      y += 16;
    }

    y += 10;
  }

  const safeFileName = title.replace(/[^a-z0-9-_]+/gi, "_").replace(/^_+|_+$/g, "") || "document";
  doc.save(`${safeFileName}.pdf`);
}

export function printTextDocument(title: string, content: string) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const html = buildPrintableHtml(title, content);
  const frameWindow = iframe.contentWindow;

  if (!frameWindow) {
    document.body.removeChild(iframe);
    throw new Error("Print preview unavailable");
  }

  frameWindow.document.open();
  frameWindow.document.write(html);
  frameWindow.document.close();

  window.setTimeout(() => {
    frameWindow.focus();
    frameWindow.print();
    window.setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 250);
}
