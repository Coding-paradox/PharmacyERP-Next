import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CalendarClock, ClipboardCheck, LoaderCircle, Play, RotateCcw } from 'lucide-react';
import { inventoryService } from '../../services/inventory.service';

type CountValue = { countedQuantity: number; batchNumber: string; expiryDate: string };

const dateLabel = (value?: string | null) => value
  ? new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  : 'Date inconnue';

export function InventoryOperations() {
  const client = useQueryClient();
  const [stocktakeId, setStocktakeId] = useState<string>();
  const [counts, setCounts] = useState<Record<string, CountValue>>({});
  const { data: alerts = [] } = useQuery({ queryKey: ['inventory-expiry-alerts'], queryFn: () => inventoryService.getExpiryAlerts(90) });
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({ queryKey: ['inventory-stocktakes'], queryFn: () => inventoryService.listStocktakes() });
  const currentOpen = sessions.find((session: any) => session.status === 'OPEN');
  const activeId = stocktakeId ?? currentOpen?.id;
  const { data: stocktake, isLoading: stocktakeLoading } = useQuery({
    queryKey: ['inventory-stocktake', activeId],
    queryFn: () => inventoryService.getStocktake(activeId!),
    enabled: !!activeId,
  });

  useEffect(() => {
    if (!stocktake) return;
    setCounts(Object.fromEntries(stocktake.items.map((item: any) => [item.id, {
      countedQuantity: item.expectedQuantity,
      batchNumber: item.medicineBatchId ? item.batchNumber : '',
      expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().slice(0, 10) : '',
    }])));
  }, [stocktake?.id]);

  const createMutation = useMutation({
    mutationFn: () => inventoryService.createStocktake(),
    onSuccess: async (session) => {
      setStocktakeId(session.id);
      await client.invalidateQueries({ queryKey: ['inventory-stocktakes'] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => inventoryService.completeStocktake(stocktake.id, stocktake.items.map((item: any) => {
      const value = counts[item.id] ?? { countedQuantity: item.expectedQuantity, batchNumber: '', expiryDate: '' };
      return {
        itemId: item.id,
        countedQuantity: value.countedQuantity,
        ...(value.countedQuantity > 0 && !item.medicineBatchId ? { batchNumber: value.batchNumber, expiryDate: value.expiryDate ? new Date(value.expiryDate).toISOString() : undefined } : {}),
      };
    })),
    onSuccess: async () => {
      setStocktakeId(undefined);
      await Promise.all([
        client.invalidateQueries({ queryKey: ['inventory-stocktakes'] }),
        client.invalidateQueries({ queryKey: ['inventory-summary'] }),
        client.invalidateQueries({ queryKey: ['inventory-movements'] }),
        client.invalidateQueries({ queryKey: ['inventory-expiry-alerts'] }),
      ]);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => inventoryService.cancelStocktake(stocktake.id),
    onSuccess: async () => {
      setStocktakeId(undefined);
      setCounts({});
      await client.invalidateQueries({ queryKey: ['inventory-stocktakes'] });
    },
  });

  const canComplete = useMemo(() => !!stocktake?.items?.length && stocktake.items.every((item: any) => {
    const value = counts[item.id];
    return value && Number.isInteger(value.countedQuantity) && value.countedQuantity >= 0
      && (item.medicineBatchId || value.countedQuantity === 0 || (value.batchNumber.trim() && value.expiryDate));
  }), [stocktake, counts]);

  const updateCount = (itemId: string, update: Partial<CountValue>) => setCounts((current) => ({
    ...current,
    [itemId]: { ...(current[itemId] ?? { countedQuantity: 0, batchNumber: '', expiryDate: '' }), ...update },
  }));

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-teal-50 p-2.5 text-teal-800"><ClipboardCheck className="h-5 w-5" /></div>
            <div><h2 className="font-semibold text-gray-900">Inventaire physique</h2><p className="mt-1 text-sm text-gray-500">Comptage des lots et mise à jour des écarts.</p></div>
          </div>
          {!activeId && <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || sessionsLoading} className="inline-flex items-center gap-2 rounded-xl bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-900 disabled:opacity-60">
            {createMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Démarrer un comptage
          </button>}
          {activeId && <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">Session ouverte</span>}
        </div>

        {createMutation.isError && <p className="mx-5 mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">Impossible d’ouvrir une session. Vérifiez vos permissions puis réessayez.</p>}
        {completeMutation.isError && <p className="mx-5 mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">La validation a échoué. Le stock a été conservé. Rechargez la session pour vérifier les écarts.</p>}

        {!activeId ? <div className="px-6 py-10 text-center text-sm text-gray-500">{sessionsLoading ? 'Chargement des sessions…' : currentOpen ? 'Une session est déjà ouverte.' : 'Aucun comptage en cours. Démarrez une session pour comparer le stock théorique au comptage réel.'}</div>
          : stocktakeLoading || !stocktake ? <div className="flex items-center justify-center px-6 py-10 text-sm text-gray-500"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Chargement du comptage…</div>
          : <>
            <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 px-5 py-3 text-sm sm:px-6">
              <span className="text-gray-600">Ouvert le {dateLabel(stocktake.createdAt)} · {stocktake.items.length} lot(s) à compter</span>
              <div className="flex items-center gap-4">
                <button onClick={() => { setCounts({}); void client.invalidateQueries({ queryKey: ['inventory-stocktake', activeId] }); }} className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-teal-800"><RotateCcw className="h-3.5 w-3.5" /> Réinitialiser</button>
                <button onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending} className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50">Annuler la session</button>
              </div>
            </div>
            <div className="max-h-[520px] overflow-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="sticky top-0 bg-white text-xs uppercase tracking-wide text-gray-500 shadow-sm"><tr>
                  <th className="px-5 py-3">Médicament / lot</th><th className="px-4 py-3 text-right">Théorique</th><th className="px-4 py-3 text-right">Compté</th><th className="px-5 py-3">Péremption</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {stocktake.items.map((item: any) => {
                    const value = counts[item.id] ?? { countedQuantity: item.expectedQuantity, batchNumber: '', expiryDate: '' };
                    const isNew = !item.medicineBatchId;
                    return <tr key={item.id}>
                      <td className="px-5 py-3"><div className="font-medium text-gray-900">{item.medicine.name}</div><div className="mt-0.5 text-xs text-gray-500">{isNew ? 'Aucun lot existant' : item.batchNumber}</div>{isNew && value.countedQuantity > 0 && <input aria-label="Numéro du nouveau lot" value={value.batchNumber} onChange={(event) => updateCount(item.id, { batchNumber: event.target.value })} placeholder="Numéro du nouveau lot" className="mt-2 w-48 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:border-teal-700 focus:outline-none" />}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-600">{item.expectedQuantity}</td>
                      <td className="px-4 py-3 text-right"><input aria-label={`Quantité comptée pour ${item.medicine.name} lot ${item.batchNumber}`} type="number" min="0" step="1" value={value.countedQuantity} onChange={(event) => updateCount(item.id, { countedQuantity: Math.max(0, Number(event.target.value) || 0) })} className="w-24 rounded-lg border border-gray-200 px-2.5 py-1.5 text-right tabular-nums focus:border-teal-700 focus:outline-none" /></td>
                      <td className="px-5 py-3 text-gray-600">{isNew && value.countedQuantity > 0 ? <input aria-label="Date de péremption du nouveau lot" type="date" value={value.expiryDate} onChange={(event) => updateCount(item.id, { expiryDate: event.target.value })} className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:border-teal-700 focus:outline-none" /> : dateLabel(item.expiryDate)}</td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 sm:px-6">
              <p className="text-xs text-gray-500">La validation est bloquée si le stock a été modifié depuis l’ouverture de la session.</p>
              <button onClick={() => completeMutation.mutate()} disabled={!canComplete || completeMutation.isPending} className="inline-flex items-center gap-2 rounded-xl bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-50">
                {completeMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />} Valider le comptage
              </button>
            </div>
          </>}
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div className="rounded-xl bg-amber-50 p-2.5 text-amber-700"><CalendarClock className="h-5 w-5" /></div>
          <div><h2 className="font-semibold text-gray-900">Péremptions</h2><p className="mt-1 text-sm text-gray-500">Lots périmés ou arrivant à échéance sous 90 jours.</p></div>
        </div>
        <div className="divide-y divide-gray-100">
          {alerts.length === 0 ? <div className="px-6 py-10 text-center"><div className="mx-auto mb-3 w-fit rounded-full bg-emerald-50 p-2 text-emerald-700"><ClipboardCheck className="h-5 w-5" /></div><p className="text-sm font-medium text-gray-800">Aucune péremption à signaler</p><p className="mt-1 text-xs text-gray-500">Aucun lot en stock n’expire dans les 90 prochains jours.</p></div> : alerts.slice(0, 12).map((batch: any) => <div key={batch.id} className="flex items-center justify-between gap-3 px-5 py-3.5 sm:px-6">
            <div className="min-w-0"><p className="truncate text-sm font-medium text-gray-900">{batch.medicine.name}</p><p className="mt-0.5 text-xs text-gray-500">Lot {batch.batchNumber} · {batch.quantity} unité(s)</p></div>
            <div className="shrink-0 text-right"><p className={`inline-flex items-center gap-1 text-xs font-semibold ${batch.expired ? 'text-red-700' : 'text-amber-700'}`}>{batch.expired && <AlertTriangle className="h-3.5 w-3.5" />}{batch.expired ? 'Périmé' : dateLabel(batch.expiryDate)}</p>{!batch.expired && <p className="mt-0.5 text-[11px] text-gray-500">Échéance proche</p>}</div>
          </div>)}
        </div>
        {alerts.length > 12 && <div className="border-t border-gray-100 px-6 py-3 text-center text-xs text-gray-500">+ {alerts.length - 12} autre(s) lot(s)</div>}
      </section>
    </div>
  );
}
