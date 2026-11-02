import { useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, LoaderCircle, Upload, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { medicinesService } from '../../services/medicines.service';

type ImportRow = {
  line: number; name: string; code?: string; barcode?: string;
  costPrice?: number; costCurrency: 'CDF' | 'USD'; sellingPrice?: number;
  sellingCurrency: 'CDF' | 'USD'; minStock?: number; errors: string[];
};

const headerAliases: Record<string, string> = {
  name: 'name', nom: 'name', medicament: 'name', code: 'code', reference: 'code',
  codebarres: 'barcode', code_barres: 'barcode', barcode: 'barcode', ean: 'barcode',
  prixachat: 'costPrice', prix_achat: 'costPrice', costprice: 'costPrice',
  deviseachat: 'costCurrency', devise_achat: 'costCurrency', costcurrency: 'costCurrency',
  prixvente: 'sellingPrice', prix_vente: 'sellingPrice', sellingprice: 'sellingPrice',
  devisevente: 'sellingCurrency', devise_vente: 'sellingCurrency', sellingcurrency: 'sellingCurrency',
  seuilminimum: 'minStock', seuil_minimum: 'minStock', minstock: 'minStock',
};

function normalizeHeader(value: string) {
  return value.trim().toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s-]+/g, '_');
}

function parseLine(line: string, separator: string): string[] {
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

async function readXlsx(buffer: ArrayBuffer): Promise<string> {
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
  const entries = new Map<string, { method: number; size: number; offset: number; nameLength: number; extraLength: number }>();
  for (let index = 0; index < entryCount; index += 1) {
    if (view.getUint32(cursor, true) !== 0x02014b50) break;
    const method = view.getUint16(cursor + 10, true);
    const size = view.getUint32(cursor + 20, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const name = decoder.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));
    entries.set(name, { method, size, offset: view.getUint32(cursor + 42, true), nameLength, extraLength });
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  const readEntry = async (name: string) => {
    const entry = entries.get(name);
    if (!entry) return '';
    const start = entry.offset + 30 + view.getUint16(entry.offset + 26, true) + view.getUint16(entry.offset + 28, true);
    const compressed = bytes.slice(start, start + entry.size);
    if (entry.method === 0) return decoder.decode(compressed);
    if (entry.method !== 8) throw new Error('Compression Excel non prise en charge. Réenregistrez le fichier en .xlsx.');
    const stream = new Blob([compressed]).stream().pipeThrough(new (DecompressionStream as any)('deflate-raw'));
    return decoder.decode(await new Response(stream).arrayBuffer());
  };
  const parseXml = (xml: string) => {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (doc.querySelector('parsererror')) throw new Error('Structure Excel invalide.');
    return doc;
  };
  const workbook = parseXml(await readEntry('xl/workbook.xml'));
  const firstSheet = workbook.getElementsByTagName('sheet')[0];
  if (!firstSheet) throw new Error('Aucune feuille trouvée dans le classeur.');
  const relationshipId = [...firstSheet.attributes].find((attribute) => attribute.name === 'r:id')?.value;
  const relationships = parseXml(await readEntry('xl/_rels/workbook.xml.rels'));
  const relationship = [...relationships.getElementsByTagName('Relationship')].find((item) => item.getAttribute('Id') === relationshipId);
  if (!relationship) throw new Error('Impossible de trouver la première feuille du classeur.');
  const target = relationship.getAttribute('Target') || '';
  const sheetPath = target.startsWith('/') ? target.slice(1) : `xl/${target.replace(/^\.\//, '')}`;
  const sharedXml = await readEntry('xl/sharedStrings.xml');
  const shared = sharedXml ? [...parseXml(sharedXml).getElementsByTagName('si')].map((item) => item.textContent || '') : [];
  const sheet = parseXml(await readEntry(sheetPath));
  const matrix: string[][] = [];
  for (const row of [...sheet.getElementsByTagName('row')]) {
    const values: string[] = [];
    for (const cell of [...row.getElementsByTagName('c')]) {
      const reference = cell.getAttribute('r') || '';
      const columnText = reference.replace(/[0-9]/g, '');
      let column = 0;
      for (const letter of columnText) column = column * 26 + letter.charCodeAt(0) - 64;
      column -= 1;
      const value = cell.getElementsByTagName('v')[0]?.textContent || '';
      const type = cell.getAttribute('t');
      values[column] = type === 's' ? (shared[Number(value)] || '') : type === 'inlineStr' ? (cell.textContent || '') : value;
    }
    matrix.push(values.map((value) => value || ''));
  }
  return matrix.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(';')).join('\n');
}

function parseCsv(text: string): ImportRow[] {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error('Ajoutez une ligne d’en-têtes et au moins un médicament.');
  const candidates = [',', ';', '\t'];
  const separator = candidates.sort((a, b) => parseLine(lines[0], b).length - parseLine(lines[0], a).length)[0];
  const headers = parseLine(lines[0], separator).map((item) => headerAliases[normalizeHeader(item)] || '');
  if (!headers.includes('name')) throw new Error('Colonne obligatoire absente : nom (ou name).');
  return lines.slice(1).map((line, index) => {
    const values = parseLine(line, separator);
    const raw: Record<string, string> = {};
    headers.forEach((header, column) => { if (header) raw[header] = values[column] || ''; });
    const errors: string[] = [];
    const number = (field: string, label: string, positive = false): number | undefined => {
      if (!raw[field]?.trim()) return undefined;
      const value = Number(raw[field].replace(',', '.'));
      if (!Number.isFinite(value) || value < 0 || (positive && value <= 0)) { errors.push(`${label} invalide.`); return undefined; }
      return value;
    };
    const costCurrency = (raw.costCurrency || 'CDF').toUpperCase();
    const sellingCurrency = (raw.sellingCurrency || 'CDF').toUpperCase();
    const name = raw.name?.trim() || '';
    if (!name) errors.push('Nom requis.');
    if (name.length > 150) errors.push('Nom limité à 150 caractères.');
    if (!['CDF', 'USD'].includes(costCurrency)) errors.push('Devise achat : CDF ou USD.');
    if (!['CDF', 'USD'].includes(sellingCurrency)) errors.push('Devise vente : CDF ou USD.');
    const costPrice = number('costPrice', 'Prix achat', true);
    const sellingPrice = number('sellingPrice', 'Prix vente', true);
    const minStock = number('minStock', 'Seuil minimum');
    if (costPrice !== undefined && sellingPrice !== undefined && costCurrency === sellingCurrency && sellingPrice < costPrice) errors.push('Le prix de vente est inférieur au prix d’achat.');
    return { line: index + 2, name, code: raw.code?.trim() || undefined, barcode: raw.barcode?.trim() || undefined, costPrice,
      costCurrency: (['CDF', 'USD'].includes(costCurrency) ? costCurrency : 'CDF') as 'CDF' | 'USD', sellingPrice,
      sellingCurrency: (['CDF', 'USD'].includes(sellingCurrency) ? sellingCurrency : 'CDF') as 'CDF' | 'USD', minStock, errors };
  });
}

function downloadTemplate() {
  const csv = '\uFEFFnom;code;code_barres;prix_achat;devise_achat;prix_vente;devise_vente;seuil_minimum\r\nParacétamol 500 mg;PARA-500;1234567890123;1000;CDF;1500;CDF;10\r\n';
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'modele_medicaments.csv'; anchor.click(); URL.revokeObjectURL(url);
}

export function MedicineImportDialog({ onClose }: { onClose: () => void }) {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const invalidCount = useMemo(() => rows.filter((row) => row.errors.length).length, [rows]);

  const handleFile = async (file?: File) => {
    setRows([]); setFileName(''); setError(''); setResult(null);
    if (!file) return;
    if (!/\.(csv|tsv|txt|xlsx)$/i.test(file.name)) { setError('Formats acceptés : Excel (.xlsx), CSV ou TSV.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Le fichier dépasse la limite de 5 Mo.'); return; }
    try {
      const content = /\.xlsx$/i.test(file.name) ? await readXlsx(await file.arrayBuffer()) : await file.text();
      const parsed = parseCsv(content);
      if (parsed.length > 500) { setError('500 lignes maximum par import. Divisez le fichier en plusieurs lots.'); return; }
      setFileName(file.name); setRows(parsed);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Fichier impossible à lire.'); }
  };

  const importRows = async () => {
    if (!user?.pharmacyId) { setError('Pharmacie introuvable pour votre compte.'); return; }
    const readyRows = rows.filter((row) => !row.errors.length);
    if (!readyRows.length) return;
    setBusy(true); setError('');
    let imported = 0; let skipped = 0;
    for (const row of readyRows) {
      try {
        await medicinesService.create({ name: row.name, code: row.code, barcode: row.barcode, costPrice: row.costPrice,
          costCurrency: row.costCurrency, sellingPrice: row.sellingPrice, sellingCurrency: row.sellingCurrency,
          minStock: row.minStock, pharmacyId: user.pharmacyId });
        imported += 1;
      } catch { skipped += 1; }
    }
    setResult({ imported, skipped });
    await queryClient.invalidateQueries({ queryKey: ['medicines'] });
    setBusy(false);
  };

  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-labelledby="medicine-import-title">
    <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
      <div className="flex items-start justify-between border-b border-gray-100 bg-gradient-to-r from-teal-50 to-white px-5 py-4 sm:px-7">
        <div className="flex gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-800 text-white"><FileSpreadsheet className="h-5 w-5" /></span><div><h2 id="medicine-import-title" className="text-lg font-bold text-gray-950">Importer des médicaments</h2><p className="mt-1 text-xs text-gray-500">Importation depuis un classeur Excel, CSV ou TSV.</p></div></div>
        <button onClick={onClose} disabled={busy} aria-label="Fermer" className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><X className="h-5 w-5" /></button>
      </div>
      <div className="space-y-4 overflow-y-auto px-5 py-5 sm:px-7">
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-teal-100 bg-teal-50/60 p-4 sm:flex-row sm:items-center"><div><p className="text-sm font-semibold text-gray-800">1. Préparez votre fichier</p><p className="mt-1 text-xs leading-5 text-gray-600">Colonnes : nom, code, code_barres, prix_achat, devise_achat, prix_vente, devise_vente, seuil_minimum.</p></div><button onClick={downloadTemplate} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-teal-200 bg-white px-3 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-50"><Download className="h-4 w-4" /> Télécharger le modèle CSV</button></div>
        <input ref={inputRef} type="file" accept=".csv,.tsv,.txt,.xlsx,text/csv,text/tab-separated-values,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={(event) => void handleFile(event.target.files?.[0])} />
        {!rows.length && <button onClick={() => inputRef.current?.click()} className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-5 py-9 text-center transition hover:border-teal-400 hover:bg-teal-50/40"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-teal-800 shadow-sm"><Upload className="h-5 w-5" /></span><span className="mt-3 text-sm font-semibold text-gray-800">Choisir un fichier Excel ou CSV</span><span className="mt-1 text-xs text-gray-500">XLSX, CSV ou TSV · 5 Mo maximum · 500 lignes maximum</span></button>}
        {!!error && <p role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}
        {fileName && <div><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-gray-900">2. Vérifiez l’aperçu <span className="font-normal text-gray-500">· {fileName}</span></p><span className="text-xs text-gray-500">{rows.length} ligne(s), {rows.length - invalidCount} prête(s), {invalidCount} à corriger</span></div><div className="overflow-x-auto rounded-xl border border-gray-200"><table className="min-w-full text-left text-xs"><thead className="bg-gray-50 text-gray-500"><tr><th className="px-3 py-2">Ligne</th><th className="px-3 py-2">Médicament</th><th className="px-3 py-2">Code</th><th className="px-3 py-2">Prix vente</th><th className="px-3 py-2">Statut</th></tr></thead><tbody className="divide-y divide-gray-100">{rows.slice(0, 12).map((row) => <tr key={row.line}><td className="px-3 py-2 text-gray-500">{row.line}</td><td className="px-3 py-2 font-medium text-gray-800">{row.name || '—'}</td><td className="px-3 py-2 text-gray-600">{row.code || 'Auto'}</td><td className="px-3 py-2 text-gray-600">{row.sellingPrice ?? '—'} {row.sellingPrice !== undefined ? row.sellingCurrency : ''}</td><td className="max-w-xs px-3 py-2">{row.errors.length ? <span className="text-rose-700">{row.errors.join(' ')}</span> : <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Prêt</span>}</td></tr>)}</tbody></table></div>{rows.length > 12 && <p className="mt-2 text-xs text-gray-500">Aperçu des 12 premières lignes; les {rows.length} lignes seront traitées.</p>}</div>}
        {result && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Import terminé : {result.imported} médicament(s) ajouté(s), {result.skipped} ignoré(s) (code ou code-barres déjà utilisé, ou autre erreur).</p>}
      </div>
      <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50/70 px-5 py-4 sm:flex-row sm:justify-end sm:px-7"><button onClick={onClose} disabled={busy} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100">{result ? 'Terminer' : 'Annuler'}</button>{rows.length > 0 && <button onClick={() => void importRows()} disabled={busy || rows.length === invalidCount} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-50">{busy ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Import en cours…</> : <><Upload className="h-4 w-4" /> Importer {rows.length - invalidCount} ligne(s)</>}</button>}</div>
    </div>
  </div>;
}
