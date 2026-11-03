import { useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, LoaderCircle, Upload, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { readTabularFile } from '../../lib/tabular-file';
import { customersService } from '../../services/customers.service';
import { suppliersService } from '../../services/suppliers.service';

type ImportKind = 'customers' | 'suppliers';
type Row = { line: number; name: string; phone?: string; email?: string; address?: string; currency?: string; description?: string; errors: string[] };
const aliases: Record<string, string> = { name: 'name', nom: 'name', client: 'name', fournisseur: 'name', raison_sociale: 'name', phone: 'phone', telephone: 'phone', tel: 'phone', email: 'email', courriel: 'email', address: 'address', adresse: 'address', currency: 'currency', devise: 'currency', description: 'description', notes: 'description' };

function normalize(value: string) { return value.trim().toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s-]+/g, '_'); }

function parseRows(matrix: string[][], kind: ImportKind): Row[] {
  if (matrix.length < 2) throw new Error('Ajoutez une ligne d’en-têtes et au moins un enregistrement.');
  const headers = matrix[0].map((header) => aliases[normalize(header)] || '');
  if (!headers.includes('name')) throw new Error('Colonne obligatoire absente : nom.');
  const seen = new Set<string>();
  return matrix.slice(1).map((values, index) => {
    const raw: Record<string, string> = {};
    headers.forEach((header, column) => { if (header) raw[header] = values[column] || ''; });
    const name = raw.name?.trim() || '';
    const errors: string[] = [];
    if (!name) errors.push('Nom requis.');
    if (name.length > 100) errors.push('Nom limité à 100 caractères.');
    if (raw.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.email.trim())) errors.push('Adresse e-mail invalide.');
    const normalizedName = name.toLocaleLowerCase('fr');
    if (normalizedName && seen.has(normalizedName)) errors.push('Nom en double dans le fichier.');
    if (normalizedName) seen.add(normalizedName);
    const currency = (raw.currency || 'CDF').trim().toUpperCase();
    if (kind === 'customers' && !['CDF', 'USD'].includes(currency)) errors.push('Devise invalide (CDF ou USD).');
    return { line: index + 2, name, phone: raw.phone?.trim() || undefined, email: raw.email?.trim() || undefined, address: raw.address?.trim() || undefined, description: raw.description?.trim() || undefined, currency: ['CDF', 'USD'].includes(currency) ? currency : 'CDF', errors };
  });
}

function downloadTemplate(kind: ImportKind) {
  const csv = kind === 'customers' ? '\uFEFFnom;telephone;email;adresse;devise\r\nJean Ilunga;+243812345678;jean@example.com;Kinshasa;CDF\r\n' : '\uFEFFnom;telephone;email;adresse;description\r\nMediPharma S.A.;+243812345678;contact@example.com;Kinshasa;Fournisseur principal\r\n';
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = `modele_${kind}.csv`; anchor.click(); URL.revokeObjectURL(url);
}

export function ContactImportDialog({ kind, onClose }: { kind: ImportKind; onClose: () => void }) {
  const isCustomer = kind === 'customers';
  const title = isCustomer ? 'Importer des clients' : 'Importer des fournisseurs';
  const [rows, setRows] = useState<Row[]>([]); const [fileName, setFileName] = useState(''); const [error, setError] = useState('');
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null); const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null); const { user } = useAuth(); const queryClient = useQueryClient();
  const invalidCount = useMemo(() => rows.filter((row) => row.errors.length > 0).length, [rows]);

  const selectFile = async (file?: File) => {
    setRows([]); setFileName(''); setError(''); setResult(null);
    if (!file) return;
    try { const matrix = await readTabularFile(file); const parsed = parseRows(matrix, kind); if (parsed.length > 500) throw new Error('500 lignes maximum par import. Divisez le fichier en plusieurs lots.'); setRows(parsed); setFileName(file.name); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Le fichier ne peut pas être lu.'); }
  };

  const importRows = async () => {
    if (!user?.pharmacyId) { setError('Pharmacie introuvable pour votre compte.'); return; }
    setBusy(true); setError(''); let imported = 0; let skipped = 0;
    for (const row of rows.filter((item) => item.errors.length === 0)) {
      try {
        if (isCustomer) await customersService.create({ name: row.name, phone: row.phone, email: row.email, address: row.address, currency: row.currency, pharmacyId: user.pharmacyId });
        else await suppliersService.create({ name: row.name, phone: row.phone, email: row.email, address: row.address, description: row.description, pharmacyId: user.pharmacyId });
        imported += 1;
      } catch { skipped += 1; }
    }
    setResult({ imported, skipped }); await queryClient.invalidateQueries({ queryKey: [kind] }); setBusy(false);
  };

  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-labelledby="contact-import-title">
    <section className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
      <header className="flex items-start justify-between border-b border-gray-100 bg-gradient-to-r from-teal-50 to-white px-5 py-4 sm:px-7"><div className="flex gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-800 text-white"><FileSpreadsheet className="h-5 w-5" /></span><div><h2 id="contact-import-title" className="text-lg font-bold text-gray-950">{title}</h2><p className="mt-1 text-xs text-gray-500">Vérifiez l’aperçu avant de confirmer l’import.</p></div></div><button onClick={onClose} disabled={busy} aria-label="Fermer" className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><X className="h-5 w-5" /></button></header>
      <div className="space-y-4 overflow-y-auto px-5 py-5 sm:px-7">
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-teal-100 bg-teal-50/60 p-4 sm:flex-row sm:items-center"><div><p className="text-sm font-semibold text-gray-800">Colonnes reconnues</p><p className="mt-1 text-xs leading-5 text-gray-600">{isCustomer ? 'nom, telephone, email, adresse, devise' : 'nom, telephone, email, adresse, description'}</p></div><button onClick={() => downloadTemplate(kind)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-teal-200 bg-white px-3 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-50"><Download className="h-4 w-4" /> Modèle CSV</button></div>
        <input ref={inputRef} type="file" accept=".csv,.tsv,.txt,.xlsx,text/csv,text/tab-separated-values,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={(event) => void selectFile(event.target.files?.[0])} />
        {!rows.length && <button onClick={() => inputRef.current?.click()} className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center transition hover:border-teal-400 hover:bg-teal-50/40"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-teal-800 shadow-sm"><Upload className="h-5 w-5" /></span><span className="mt-3 text-sm font-semibold text-gray-800">Choisir un fichier Excel ou CSV</span><span className="mt-1 text-xs text-gray-500">XLSX, CSV ou TSV · 5 Mo maximum · 500 lignes maximum</span></button>}
        {error && <p role="alert" className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</p>}
        {fileName && <div><div className="mb-2 flex flex-wrap justify-between gap-2 text-sm"><span className="font-semibold text-gray-900">Aperçu · {fileName}</span><span className="text-xs text-gray-500">{rows.length - invalidCount} prête(s) · {invalidCount} à corriger</span></div><div className="overflow-x-auto rounded-xl border border-gray-200"><table className="min-w-full text-left text-xs"><thead className="bg-gray-50 text-gray-500"><tr><th className="px-3 py-2">Ligne</th><th className="px-3 py-2">Nom</th><th className="px-3 py-2">Téléphone</th><th className="px-3 py-2">E-mail</th><th className="px-3 py-2">État</th></tr></thead><tbody className="divide-y divide-gray-100">{rows.slice(0, 12).map((row) => <tr key={row.line}><td className="px-3 py-2 text-gray-500">{row.line}</td><td className="px-3 py-2 font-medium text-gray-800">{row.name || '—'}</td><td className="px-3 py-2 text-gray-600">{row.phone || '—'}</td><td className="px-3 py-2 text-gray-600">{row.email || '—'}</td><td className="max-w-xs px-3 py-2">{row.errors.length ? <span className="text-rose-700">{row.errors.join(' ')}</span> : <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />Prêt</span>}</td></tr>)}</tbody></table></div>{rows.length > 12 && <p className="mt-2 text-xs text-gray-500">Aperçu des 12 premières lignes.</p>}</div>}
        {result && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Import terminé : {result.imported} ajouté(s), {result.skipped} ignoré(s) (doublon ou erreur de validation).</p>}
      </div>
      <footer className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50/70 px-5 py-4 sm:flex-row sm:justify-end sm:px-7"><button onClick={onClose} disabled={busy} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100">{result ? 'Terminer' : 'Annuler'}</button>{rows.length > 0 && <button onClick={() => void importRows()} disabled={busy || rows.length === invalidCount} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-50">{busy ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Import en cours…</> : <><Upload className="h-4 w-4" /> Importer {rows.length - invalidCount} ligne(s)</>}</button>}</footer>
    </section>
  </div>;
}
