export async function readTabularFile(file: File): Promise<string[][]> {
  if (file.size > 5 * 1024 * 1024) throw new Error('Le fichier dépasse la limite de 5 Mo.');
  const isXlsx = /\.xlsx$/i.test(file.name);
  if (!isXlsx && !/\.(csv|tsv|txt)$/i.test(file.name)) throw new Error('Formats acceptés : Excel (.xlsx), CSV ou TSV.');
  if (isXlsx) return readXlsx(await file.arrayBuffer());
  return parseDelimited(await file.text());
}

function parseLine(line: string, separator: string) {
  const values: string[] = [];
  let value = ''; let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"' && quoted) { value += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === separator && !quoted) { values.push(value.trim()); value = ''; }
    else value += char;
  }
  values.push(value.trim());
  return values;
}

function parseDelimited(text: string): string[][] {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) throw new Error('Le fichier ne contient aucune donnée.');
  const separators = [',', ';', '\t'];
  const separator = separators.sort((a, b) => parseLine(lines[0], b).length - parseLine(lines[0], a).length)[0];
  return lines.map((line) => parseLine(line, separator));
}

async function readXlsx(buffer: ArrayBuffer): Promise<string[][]> {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const decoder = new TextDecoder();
  let end = -1;
  for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 65_557); offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) { end = offset; break; }
  }
  if (end < 0) throw new Error('Le fichier Excel est illisible ou endommagé.');
  const entryCount = view.getUint16(end + 10, true);
  let cursor = view.getUint32(end + 16, true);
  const entries = new Map<string, { method: number; size: number; offset: number }>();
  for (let index = 0; index < entryCount; index += 1) {
    if (view.getUint32(cursor, true) !== 0x02014b50) break;
    const method = view.getUint16(cursor + 10, true);
    const size = view.getUint32(cursor + 20, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const name = decoder.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));
    entries.set(name, { method, size, offset: view.getUint32(cursor + 42, true) });
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  const readEntry = async (name: string) => {
    const entry = entries.get(name);
    if (!entry) return '';
    const start = entry.offset + 30 + view.getUint16(entry.offset + 26, true) + view.getUint16(entry.offset + 28, true);
    const compressed = bytes.slice(start, start + entry.size);
    if (entry.method === 0) return decoder.decode(compressed);
    if (entry.method !== 8) throw new Error('Compression Excel non prise en charge. Réenregistrez en .xlsx.');
    const stream = new Blob([compressed]).stream().pipeThrough(new (DecompressionStream as any)('deflate-raw'));
    return decoder.decode(await new Response(stream).arrayBuffer());
  };
  const parseXml = (xml: string) => {
    const document = new DOMParser().parseFromString(xml, 'application/xml');
    if (document.querySelector('parsererror')) throw new Error('Structure Excel invalide.');
    return document;
  };
  const workbook = parseXml(await readEntry('xl/workbook.xml'));
  const firstSheet = workbook.getElementsByTagName('sheet')[0];
  if (!firstSheet) throw new Error('Aucune feuille trouvée dans le classeur.');
  const relationshipId = [...firstSheet.attributes].find((attribute) => attribute.name === 'r:id')?.value;
  const relationships = parseXml(await readEntry('xl/_rels/workbook.xml.rels'));
  const relationship = [...relationships.getElementsByTagName('Relationship')].find((item) => item.getAttribute('Id') === relationshipId);
  if (!relationship) throw new Error('Impossible de lire la première feuille du classeur.');
  const target = relationship.getAttribute('Target') || '';
  const sheetPath = target.startsWith('/') ? target.slice(1) : `xl/${target.replace(/^\.\//, '')}`;
  const sharedXml = await readEntry('xl/sharedStrings.xml');
  const shared = sharedXml ? [...parseXml(sharedXml).getElementsByTagName('si')].map((item) => item.textContent || '') : [];
  const sheet = parseXml(await readEntry(sheetPath));
  const matrix: string[][] = [];
  for (const row of [...sheet.getElementsByTagName('row')]) {
    const values: string[] = [];
    for (const cell of [...row.getElementsByTagName('c')]) {
      const columnText = (cell.getAttribute('r') || '').replace(/[0-9]/g, '');
      let column = 0;
      for (const letter of columnText) column = column * 26 + letter.charCodeAt(0) - 64;
      column -= 1;
      const value = cell.getElementsByTagName('v')[0]?.textContent || '';
      const type = cell.getAttribute('t');
      values[column] = type === 's' ? (shared[Number(value)] || '') : type === 'inlineStr' ? (cell.textContent || '') : value;
    }
    matrix.push(values.map((value) => value || ''));
  }
  return matrix;
}
