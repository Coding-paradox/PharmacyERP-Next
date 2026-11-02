import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Truck, Package, Calculator, ArrowLeft, ClipboardList, CheckCircle2 } from 'lucide-react';
import { purchasesService } from '../../services/purchases.service';
import { medicinesService } from '../../services/medicines.service';
import { suppliersService } from '../../services/suppliers.service';
import { useAuth } from '../../contexts/AuthContext';
import type { Currency } from '../../services/medicines.service';

const currencies: Currency[] = ['CDF', 'USD'];

const purchaseItemSchema = z.object({
  medicineId: z.string().min(1, 'Sélectionnez un médicament'),
  quantity: z.number().min(1, 'Quantité minimale: 1'),
  unitPrice: z.number().min(0, 'Prix unitaire invalide'),
  currency: z.enum(['CDF', 'USD']).default('CDF'),
  expiryDate: z.string().min(1, 'La date de péremption est requise'),
  batchNumber: z.string().trim().min(1, 'Le numéro de lot est requis'),
});

const purchaseSchema = z.object({
  supplierId: z.string().optional(),
  supplierName: z.string().min(1, 'Le nom du fournisseur est requis'),
  supplierPhone: z.string().optional(),
  supplierInvoiceNumber: z.string().optional(),
  tax: z.number().min(0).default(0),
  currency: z.enum(['CDF', 'USD']).default('CDF'),
  notes: z.string().optional(),
  pharmacyId: z.string().uuid(),
  items: z.array(purchaseItemSchema).min(1, 'Ajoutez au moins un article'),
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;

export function PurchaseForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      tax: 0,
      supplierInvoiceNumber: '',
      currency: 'CDF',
      pharmacyId: user?.pharmacyId || '',
      items: [{ medicineId: '', quantity: 1, unitPrice: 0, currency: 'CDF', expiryDate: '', batchNumber: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const items = watch('items');
  const tax = watch('tax') || 0;
  const currency = watch('currency') || 'CDF';

  const { data: medicines, isLoading: isLoadingMedicines } = useQuery({
    queryKey: ['medicines'],
    queryFn: () => medicinesService.findAll(),
  });

  const { data: suppliers, isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersService.findAll(),
  });

  const createMutation = useMutation({
    mutationFn: purchasesService.create,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['purchases'] }),
        queryClient.invalidateQueries({ queryKey: ['purchases-summary'] }),
      ]);
      navigate('/purchases');
    },
  });

  const onSubmit = async (data: PurchaseFormData) => {
    await createMutation.mutateAsync({
      ...data,
      items: data.items.map((item) => ({ ...item, currency: data.currency })),
    });
  };

  const handleSupplierSelect = (supplierId: string) => {
    setValue('supplierId', supplierId, { shouldDirty: true, shouldValidate: true });
    const supplier = suppliers?.find((s) => s.id === supplierId);
    if (supplier) {
      setValue('supplierName', supplier.name, { shouldDirty: true });
      setValue('supplierPhone', supplier.phone || '', { shouldDirty: true });
    }
  };

  const handleMedicineSelect = (index: number, medicineId: string) => {
    setValue(`items.${index}.medicineId`, medicineId, { shouldDirty: true, shouldValidate: true });
    const medicine = medicines?.data?.find((m: any) => m.id === medicineId);
    if (medicine) {
      setValue(`items.${index}.unitPrice`, Number(medicine.costPrice) || 0, { shouldDirty: true, shouldValidate: true });
      setValue(`items.${index}.currency`, medicine.costCurrency || 'CDF', { shouldDirty: true });
      if (items.length === 1) {
        setValue('currency', medicine.costCurrency || 'CDF', { shouldDirty: true });
      }
    }
  };

  const subtotal = items.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.unitPrice || 0);
  }, 0);
  const total = subtotal + tax;
  const totalUnits = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  if (isLoadingMedicines || isLoadingSuppliers) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="relative isolate overflow-hidden rounded-[28px] bg-gradient-to-br from-teal-950 via-teal-800 to-teal-700 px-5 py-6 text-white shadow-lg shadow-teal-950/10 sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full border-[36px] border-white/5" />
        <div className="pointer-events-none absolute -bottom-24 right-36 -z-10 h-52 w-52 rounded-full bg-teal-300/10 blur-2xl" />
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-teal-50"><ClipboardList className="h-3.5 w-3.5" /> APPROVISIONNEMENT</div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Nouvel achat</h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-teal-50/85 sm:text-base">Saisie de la commande, des articles achetés et des lots reçus.</p>
          </div>
          <button type="button" onClick={() => navigate('/purchases')} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"><ArrowLeft className="h-4 w-4" /> Retour aux achats</button>
        </div>
        <div className="mt-7 flex flex-wrap gap-2 text-xs font-medium text-white/80">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-teal-900">1</span> Fournisseur</span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-teal-900">2</span> Articles et lots</span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-teal-900">3</span> Vérification</span>
        </div>
      </section>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {createMutation.isError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{(createMutation.error as any)?.response?.data?.message || 'La commande n’a pas pu être créée. Vérifiez les articles et les lots saisis.'}</div>}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3 border-b border-gray-100 pb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-800"><Truck className="h-5 w-5" /></span>
            <div><h2 className="text-base font-semibold text-gray-900">Fournisseur</h2><p className="mt-0.5 text-xs text-gray-500">Coordonnées et référence de facture</p></div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Fournisseur</label>
              <select
                {...register('supplierId', { onChange: (e) => handleSupplierSelect(e.target.value) })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
              >
                <option value="">Sélectionner un fournisseur</option>
                {suppliers?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Nom du fournisseur *</label>
              <input
                type="text"
                {...register('supplierName')}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                placeholder="Nom du fournisseur"
              />
              {errors.supplierName && (
                <p className="mt-1 text-sm text-red-600">{errors.supplierName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Téléphone</label>
              <input
                type="text"
                {...register('supplierPhone')}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                placeholder="Téléphone du fournisseur"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">N° facture fournisseur</label>
              <input
                type="text"
                {...register('supplierInvoiceNumber')}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 transition focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-50"
                placeholder="Référence sur la facture (facultatif)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Taxe et frais (montant)</label>
              <input
                type="number"
                step="0.01"
                {...register('tax', { valueAsNumber: true })}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 transition focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-50"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Devise</label>
              <select
                {...register('currency')}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
              >
                {currencies.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-800"><Package className="h-5 w-5" /></span><div><h2 className="text-base font-semibold text-gray-900">Articles et lots</h2><p className="mt-0.5 text-xs text-gray-500">{totalUnits} unité(s) au total</p></div></div>
            <button
              type="button"
              onClick={() => append({ medicineId: '', quantity: 1, unitPrice: 0, currency, expiryDate: '', batchNumber: '' })}
              className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800 transition hover:border-teal-300 hover:bg-teal-100"
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => {
              const medicineRegistration = register(`items.${index}.medicineId`, {
                onChange: (event) => handleMedicineSelect(index, event.target.value),
              });
              return (
              <div key={field.id} className="grid grid-cols-1 items-end gap-3 rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 sm:grid-cols-12 sm:p-5">
                <div className="col-span-1 sm:col-span-3">
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">Médicament</label>
                  <select
                    {...medicineRegistration}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm transition focus:border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-50"
                  >
                    <option value="">Sélectionner...</option>
                    {medicines?.data?.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">Quantité</label>
                  <input
                    type="number"
                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">Prix unitaire</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">N° de lot</label>
                  <input
                    type="text"
                    {...register(`items.${index}.batchNumber`)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                    placeholder="Lot"
                  />
                  {errors.items?.[index]?.batchNumber && <p className="mt-1 text-xs text-red-600">{errors.items[index]?.batchNumber?.message}</p>}
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">Date de péremption</label>
                  <input
                    type="date"
                    {...register(`items.${index}.expiryDate`)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                  />
                  {errors.items?.[index]?.expiryDate && <p className="mt-1 text-xs text-red-600">{errors.items[index]?.expiryDate?.message}</p>}
                </div>

                <div className="col-span-1 flex items-center justify-end pt-1 sm:justify-center">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label={`Supprimer l’article ${index + 1}`}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 bg-white text-red-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );})}
          </div>

          {errors.items && (
            <p className="mt-2 text-sm text-red-600">{errors.items.message}</p>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <label className="mb-2 block text-sm font-semibold text-gray-800">Notes</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
              placeholder="Notes supplémentaires..."
            />
          </div>

          <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-white p-5 shadow-sm sm:p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800">
              <Calculator className="h-4 w-4 text-teal-600" />
              Récapitulatif
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sous-total</span>
                <span className="font-medium">{subtotal.toFixed(2)} {currency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Taxe</span>
                <span className="font-medium">{tax.toFixed(2)} {currency}</span>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-teal-900 px-4 py-3 text-base font-bold text-white shadow-sm">
                <span>Total</span>
                <span>{total.toFixed(2)} {currency}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-3 z-10 flex flex-col-reverse gap-3 rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-800 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" /> {isSubmitting ? 'Création...' : 'Enregistrer l’achat'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/purchases')}
            className="rounded-xl px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
