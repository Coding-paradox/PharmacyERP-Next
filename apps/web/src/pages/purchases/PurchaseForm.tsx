import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus, Trash2, Truck, Package, Calculator } from 'lucide-react';
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
  expiryDate: z.string().optional(),
  batchNumber: z.string().optional(),
});

const purchaseSchema = z.object({
  supplierId: z.string().optional(),
  supplierName: z.string().min(1, 'Le nom du fournisseur est requis'),
  supplierPhone: z.string().optional(),
  tax: z.number().min(0).default(0),
  currency: z.enum(['CDF', 'USD']).default('CDF'),
  notes: z.string().optional(),
  pharmacyId: z.string().uuid(),
  items: z.array(purchaseItemSchema).min(1, 'Ajoutez au moins un article'),
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;

export function PurchaseForm() {
  const navigate = useNavigate();
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
      currency: 'CDF',
      pharmacyId: user?.pharmacyId || '',
      items: [{ medicineId: '', quantity: 1, unitPrice: 0, currency: 'CDF', expiryDate: '', batchNumber: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

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
    onSuccess: () => {
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
    setValue('supplierId', supplierId);
    const supplier = suppliers?.find((s) => s.id === supplierId);
    if (supplier) {
      setValue('supplierName', supplier.name);
      setValue('supplierPhone', supplier.phone || '');
    }
  };

  const handleMedicineSelect = (index: number, medicineId: string) => {
    setValue(`items.${index}.medicineId`, medicineId);
    const medicine = medicines?.data?.find((m: any) => m.id === medicineId);
    if (medicine) {
      setValue(`items.${index}.unitPrice`, medicine.costPrice || 0);
      setValue(`items.${index}.currency`, medicine.costCurrency || 'CDF');
      if (items.length === 1) {
        setValue('currency', medicine.costCurrency || 'CDF');
      }
    }
  };

  const items = watch('items');
  const tax = watch('tax') || 0;
  const currency = watch('currency') || 'CDF';
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.unitPrice || 0);
  }, 0);
  const total = subtotal + tax;

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
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nouvel achat</h1>
          <p className="text-sm text-gray-500">Créer une commande d'achat</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/purchases')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Annuler
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Truck className="h-5 w-5 text-teal-600" />
            Fournisseur
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Fournisseur</label>
              <select
                {...register('supplierId')}
                onChange={(e) => handleSupplierSelect(e.target.value)}
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
              <label className="block text-sm font-medium text-gray-700">Taxe (%)</label>
              <input
                type="number"
                step="0.01"
                {...register('tax', { valueAsNumber: true })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
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

        <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Package className="h-5 w-5 text-teal-600" />
              Articles
            </h2>
            <button
              type="button"
              onClick={() => append({ medicineId: '', quantity: 1, unitPrice: 0, currency, expiryDate: '', batchNumber: '' })}
              className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-800"
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-3 items-end bg-gray-50 rounded-lg p-4">
                <div className="col-span-4">
                  <label className="block text-xs font-medium text-gray-700">Médicament</label>
                  <select
                    {...register(`items.${index}.medicineId`)}
                    onChange={(e) => handleMedicineSelect(index, e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                  >
                    <option value="">Sélectionner...</option>
                    {medicines?.data?.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700">Qté</label>
                  <input
                    type="number"
                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700">Prix unit.</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700">Lot</label>
                  <input
                    type="text"
                    {...register(`items.${index}.batchNumber`)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                    placeholder="Lot"
                  />
                </div>

                <div className="col-span-1 flex items-center justify-center pt-1">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {errors.items && (
            <p className="mt-2 text-sm text-red-600">{errors.items.message}</p>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
              placeholder="Notes supplémentaires..."
            />
          </div>

          <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
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
              <div className="border-t border-gray-200 pt-2 flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="text-teal-700">{total.toFixed(2)} {currency}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-teal-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Création...' : 'Créer l\'achat'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/purchases')}
            className="rounded-lg bg-gray-200 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-300 transition-colors"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
