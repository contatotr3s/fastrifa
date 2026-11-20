export interface PdfPageImage {
  jpegDataUrl: string;
  widthPx: number;
  heightPx: number;
}

/**
 * Empacota múltiplas páginas JPEG (geradas via Canvas 2D em proporção A4)
 * em um arquivo binário PDF 1.4 nativo de alta resolução (595.28 x 841.89 pt = A4),
 * sem dependências externas.
 */
export function buildMultiPageA4Pdf(pages: PdfPageImage[]): Blob {
  const PAGE_W = 595.28;
  const PAGE_H = 841.89;

  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  let currentOffset = 0;
  const offsets: number[] = [0]; // object 0

  function pushText(str: string) {
    const bytes = encoder.encode(str);
    chunks.push(bytes);
    currentOffset += bytes.byteLength;
  }

  function pushBytes(bytes: Uint8Array) {
    chunks.push(bytes);
    currentOffset += bytes.byteLength;
  }

  function base64ToBytes(dataUrl: string): Uint8Array {
    const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
    const binStr = atob(base64);
    const len = binStr.length;
    const out = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      out[i] = binStr.charCodeAt(i);
    }
    return out;
  }

  // Header PDF 1.4 com comentário binário
  pushText('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  // Object 1: Catalog
  offsets[1] = currentOffset;
  pushText('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Object 2: Pages root
  // Cada página usa 3 objetos: Page (3 + i*3), Content (4 + i*3), Image XObject (5 + i*3)
  const pageObjIds = pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ');
  offsets[2] = currentOffset;
  pushText(
    `2 0 obj\n<< /Type /Pages /Kids [ ${pageObjIds} ] /Count ${pages.length} >>\nendobj\n`
  );

  pages.forEach((page, i) => {
    const pageObjId = 3 + i * 3;
    const contentObjId = 4 + i * 3;
    const imgObjId = 5 + i * 3;
    const imgName = `/Im${i + 1}`;

    // Page object
    offsets[pageObjId] = currentOffset;
    pushText(
      `${pageObjId} 0 obj\n` +
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
        `/Resources << /XObject << ${imgName} ${imgObjId} 0 R >> >> ` +
        `/Contents ${contentObjId} 0 R >>\n` +
        `endobj\n`
    );

    // Content stream object
    const streamCmd = `q\n${PAGE_W} 0 0 ${PAGE_H} 0 0 cm\n${imgName} Do\nQ\n`;
    const streamBytes = encoder.encode(streamCmd);
    offsets[contentObjId] = currentOffset;
    pushText(
      `${contentObjId} 0 obj\n<< /Length ${streamBytes.byteLength} >>\nstream\n`
    );
    pushBytes(streamBytes);
    pushText('\nendstream\nendobj\n');

    // Image XObject (DCTDecode raw JPEG)
    const jpegBytes = base64ToBytes(page.jpegDataUrl);
    offsets[imgObjId] = currentOffset;
    pushText(
      `${imgObjId} 0 obj\n` +
        `<< /Type /XObject /Subtype /Image ` +
        `/Width ${page.widthPx} /Height ${page.heightPx} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 ` +
        `/Filter /DCTDecode /Length ${jpegBytes.byteLength} >>\n` +
        `stream\n`
    );
    pushBytes(jpegBytes);
    pushText('\nendstream\nendobj\n');
  });

  const totalObjects = 2 + pages.length * 3 + 1; // +1 for object 0
  const xrefOffset = currentOffset;

  pushText(`xref\n0 ${totalObjects}\n`);
  pushText('0000000000 65535 f \n');
  for (let objId = 1; objId < totalObjects; objId++) {
    const padded = offsets[objId].toString().padStart(10, '0');
    pushText(`${padded} 00000 n \n`);
  }

  pushText(
    `trailer\n<< /Size ${totalObjects} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  );

  return new Blob(chunks as BlobPart[], { type: 'application/pdf' });
}
