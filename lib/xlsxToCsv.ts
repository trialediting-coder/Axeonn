// lib/xlsxToCsv.ts
// Browser only: the first sheet of an .xlsx file as CSV text, so a client can
// upload a spreadsheet straight from their practice software without saving it
// as CSV first. No library: an .xlsx is a zip of XML, read with the browser's
// DecompressionStream and DOMParser. Anything unexpected throws, and the upload
// card asks for a CSV instead.

const enc = new TextDecoder();

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** The zip's files by name (stored or deflated), from the central directory. */
async function unzip(buf: ArrayBuffer, want: (name: string) => boolean): Promise<Map<string, string>> {
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65_557); i -= 1) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('Not a spreadsheet file');
  const entries = view.getUint16(eocd + 10, true);
  let p = view.getUint32(eocd + 16, true);
  const out = new Map<string, string>();
  for (let n = 0; n < entries; n += 1) {
    if (view.getUint32(p, true) !== 0x02014b50) throw new Error('Damaged spreadsheet file');
    const method = view.getUint16(p + 10, true);
    const size = view.getUint32(p + 20, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    const local = view.getUint32(p + 42, true);
    const name = enc.decode(bytes.subarray(p + 46, p + 46 + nameLen));
    p += 46 + nameLen + extraLen + commentLen;
    if (!want(name)) continue;
    const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
    const raw = bytes.subarray(start, start + size);
    if (method === 0) out.set(name, enc.decode(raw));
    else if (method === 8) out.set(name, enc.decode(await inflateRaw(raw)));
    else throw new Error('Unsupported spreadsheet compression');
  }
  return out;
}

const colIndex = (ref: string) => {
  let n = 0;
  for (const ch of ref.replace(/\d+$/, '')) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};

const csvCell = (s: string) => (/[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

export async function xlsxToCsv(file: Blob): Promise<string> {
  const files = await unzip(await file.arrayBuffer(), (n) => n === 'xl/sharedStrings.xml' || /^xl\/worksheets\/sheet1\.xml$/.test(n));
  const sheet = files.get('xl/worksheets/sheet1.xml');
  if (!sheet) throw new Error('No sheet found in that file');
  const parser = new DOMParser();
  const shared: string[] = [];
  const ss = files.get('xl/sharedStrings.xml');
  if (ss) {
    for (const si of Array.from(parser.parseFromString(ss, 'application/xml').getElementsByTagName('si'))) {
      shared.push(Array.from(si.getElementsByTagName('t')).map((t) => t.textContent ?? '').join(''));
    }
  }
  const rows: string[][] = [];
  for (const row of Array.from(parser.parseFromString(sheet, 'application/xml').getElementsByTagName('row'))) {
    const cells: string[] = [];
    for (const c of Array.from(row.getElementsByTagName('c'))) {
      const i = colIndex(c.getAttribute('r') ?? '');
      const t = c.getAttribute('t');
      const v = c.getElementsByTagName('v')[0]?.textContent ?? '';
      const text = t === 's' ? (shared[Number(v)] ?? '') : t === 'inlineStr' ? Array.from(c.getElementsByTagName('t')).map((x) => x.textContent ?? '').join('') : v;
      if (i >= 0) cells[i] = text;
    }
    rows.push(Array.from(cells, (x) => x ?? ''));
  }
  return rows.map((r) => r.map(csvCell).join(',')).join('\n');
}
