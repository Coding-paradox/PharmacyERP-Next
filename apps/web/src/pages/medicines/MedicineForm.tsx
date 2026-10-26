import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { medicinesService } from '../../services/medicines.service';
import { categoriesService } from '../../services/categories.service';
import { unitsService } from '../../services/units.service';
import { manufacturersService } from '../../services/manufacturers.service';
import { genericNamesService } from '../../services/generic-names.service';
import { dosagesService } from '../../services/dosages.service';
import { dosageFormsService } from '../../services/dosage-forms.service';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Convertit une chaîne vide (valeur par défaut d'un <select> non rempli)
 * en `undefined`, pour que `.optional()` fonctionne réellement.
 * Sans ça, un select laissé sur "Aucune catégorie" envoie '' au serveur,
 * qui rejette la requête car '' n'est pas un UUID valide.
 */
const optionalUuid = z.preprocess(
  (val) => (val === '' || val === undefined || val === null ? undefined : val),
  z.string().uuid('ID invalide').optional(),
);

/**
 * Convertit une chaîne vide ou NaN (produit par `valueAsNumber: true`
 * quand le champ nombre est laissé vide) en `undefined`.
 * Sans ça, Zod rejette NaN silencieusement et bloque toute la soumission
 * sans qu'aucun message d'erreur ne s'affiche (les erreurs sur ces champs
 * n'étaient pas rendues dans le JSX).
 */
const optionalPositiveNumber = z.preprocess(
  (val) => (val === '' || val === undefined || Number.isNaN(val) ? undefined : val),
  z.number().positive('Doit être un nombre positif').optional(),
);

const optionalNonNegativeInt = z.preprocess(
  (val) => (val === '' || val === undefined || Number.isNaN(val) ? undefined : val),
  z.number().int().min(0, 'Doit être positif ou nul').optional(),
);

// CDF (Franc congolais) et USD (Dollar américain) : les deux devises
// gérées par l'application, conformément à la réalité du terrain en RDC
// où les prix peuvent être fixés dans l'une ou l'autre.
const currencyEnum = z.enum(['CDF', 'USD']);

const medicineSchema = z.object({
  code: z.string().optional(),
  barcode: z.string().optional(),
  name: z.string().min(1, 'Le nom est requis'),
  genericNameId: optionalUuid,
  dosageId: optionalUuid,
  dosageFormId: optionalUuid,
  categoryId: optionalUuid,
  manufacturerId: optionalUuid,
  unitId: optionalUuid,
  costPrice: optionalPositiveNumber,
  costCurrency: currencyEnum.default('CDF'),
  sellingPrice: optionalPositiveNumber,
  sellingCurrency: currencyEnum.default('CDF'),
  minStock: optionalNonNegativeInt,
  isActive: z.boolean().default(true),
  pharmacyId: z.string().uuid('ID de pharmacie invalide'),
});

type MedicineFormData = z.infer<typeof medicineSchema>;

/**
 * Extrait un message d'erreur lisible depuis une réponse d'API en erreur
 * (Axios). Le backend renvoie `message` en string ou en tableau de strings
 * (class-validator renvoie un tableau, un message par champ en échec).
 */
function extractApiErrorMessage(error: any): string {
  const data = error?.response?.data;
  if (!data) return "Une erreur inattendue s'est produite. Vérifiez votre connexion et réessayez.";

  const message = data.message;
  if (Array.isArray(message)) return message.join(' • ');
  if (typeof message === 'string') return message;
  return "Une erreur inattendue s'est produite.";
}

export function MedicineForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = !!id;
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MedicineFormData>({
    resolver: zodResolver(medicineSchema),
    defaultValues: {
      isActive: true,
      costCurrency: 'CDF',
      sellingCurrency: 'CDF',
    },
  });

  const { data: medicine, isLoading: isLoadingMedicine } = useQuery({
    queryKey: ['medicine', id],
    queryFn: () => medicinesService.findOne(id!),
    enabled: isEdit,
  });

  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.findAll(),
  });

  const { data: units, isLoading: isLoadingUnits } = useQuery({
    queryKey: ['units'],
    queryFn: () => unitsService.findAll(),
  });

  const { data: manufacturers, isLoading: isLoadingManufacturers } = useQuery({
    queryKey: ['manufacturers'],
    queryFn: () => manufacturersService.findAll(),
  });

  const { data: genericNames, isLoading: isLoadingGenericNames } = useQuery({
    queryKey: ['generic-names'],
    queryFn: () => genericNamesService.findAll(),
  });

  const { data: dosages, isLoading: isLoadingDosages } = useQuery({
    queryKey: ['dosages'],
    queryFn: () => dosagesService.findAll(),
  });

  const { data: dosageForms, isLoading: isLoadingDosageForms } = useQuery({
    queryKey: ['dosage-forms'],
    queryFn: () => dosageFormsService.findAll(),
  });

  useEffect(() => {
    if (medicine) {
      reset({
        code: medicine.code,
        barcode: medicine.barcode,
        name: medicine.name,
        genericNameId: medicine.genericNameId || '',
        dosageId: medicine.dosageId || '',
        dosageFormId: medicine.dosageFormId || '',
        categoryId: medicine.categoryId || '',
        manufacturerId: medicine.manufacturerId || '',
        unitId: medicine.unitId || '',
        costPrice: medicine.costPrice,
        costCurrency: medicine.costCurrency || 'CDF',
        sellingPrice: medicine.sellingPrice,
        sellingCurrency: medicine.sellingCurrency || 'CDF',
        minStock: medicine.minStock,
        isActive: medicine.isActive,
        pharmacyId: medicine.pharmacyId,
      });
    }
  }, [medicine, reset]);

  // Le champ pharmacyId dépend du contexte d'authentification : dès que
  // `user` devient disponible (ou change), on synchronise la valeur du
  // formulaire via setValue plutôt que via l'attribut `value` du <input>,
  // pour éviter de mélanger un champ contrôlé (value=) avec le
  // fonctionnement non-contrôlé de react-hook-form (register/ref).
  useEffect(() => {
    if (user?.pharmacyId && !isEdit) {
      setValue('pharmacyId', user.pharmacyId, { shouldValidate: true });
    }
  }, [user, isEdit, setValue]);

  const createMutation = useMutation({
    mutationFn: medicinesService.create,
    onSuccess: () => {
      navigate('/medicines');
    },
    onError: (error: any) => {
      setServerError(extractApiErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      medicinesService.update(id, data),
    onSuccess: () => {
      navigate('/medicines');
    },
    onError: (error: any) => {
      setServerError(extractApiErrorMessage(error));
    },
  });

  const onSubmit = async (data: MedicineFormData) => {
    setServerError(null);
    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync({ id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch (error) {
      // L'erreur est déjà capturée et affichée via onError des mutations
      // ci-dessus. On l'attrape aussi ici pour empêcher toute promesse
      // rejetée non gérée (silencieuse) qui donnait l'impression que
      // "l'application plante" sans aucun message.
    }
  };

  const isLoading = isLoadingMedicine || isLoadingCategories || isLoadingUnits || isLoadingManufacturers || isLoadingGenericNames || isLoadingDosages || isLoadingDosageForms;

  if (isLoading) {
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
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        {isEdit ? 'Modifier le médicament' : 'Nouveau médicament'}
      </h1>

      {serverError && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Code
              </label>
              <input
                type="text"
                {...register('code')}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Code-barres
              </label>
              <input
                type="text"
                {...register('barcode')}
                className="input-field"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Nom du médicament *
              </label>
              <input
                type="text"
                {...register('name')}
                className="input-field"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Catégorie
              </label>
              <select
                {...register('categoryId')}
                className="input-field"
              >
                <option value="">Aucune catégorie</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Unité de mesure
              </label>
              <select
                {...register('unitId')}
                className="input-field"
              >
                <option value="">Aucune unité</option>
                {units?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.symbol ? `(${u.symbol})` : ''}
                  </option>
                ))}
              </select>
              {errors.unitId && (
                <p className="mt-1 text-sm text-red-600">{errors.unitId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Fabricant / Laboratoire
              </label>
              <select
                {...register('manufacturerId')}
                className="input-field"
              >
                <option value="">Aucun fabricant</option>
                {manufacturers?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.country ? `(${m.country})` : ''}
                  </option>
                ))}
              </select>
              {errors.manufacturerId && (
                <p className="mt-1 text-sm text-red-600">{errors.manufacturerId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nom générique
              </label>
              <select
                {...register('genericNameId')}
                className="input-field"
              >
                <option value="">Aucun nom générique</option>
                {genericNames?.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              {errors.genericNameId && (
                <p className="mt-1 text-sm text-red-600">{errors.genericNameId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Dosage
              </label>
              <select
                {...register('dosageId')}
                className="input-field"
              >
                <option value="">Aucun dosage</option>
                {dosages?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              {errors.dosageId && (
                <p className="mt-1 text-sm text-red-600">{errors.dosageId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Forme galénique
              </label>
              <select
                {...register('dosageFormId')}
                className="input-field"
              >
                <option value="">Aucune forme</option>
                {dosageForms?.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              {errors.dosageFormId && (
                <p className="mt-1 text-sm text-red-600">{errors.dosageFormId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Prix d'achat
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  {...register('costPrice', { valueAsNumber: true })}
                  className="input-field flex-1"
                />
                <select
                  {...register('costCurrency')}
                  className="input-field w-24"
                >
                  <option value="CDF">CDF</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              {errors.costPrice && (
                <p className="mt-1 text-sm text-red-600">{errors.costPrice.message}</p>
              )}
              {errors.costCurrency && (
                <p className="mt-1 text-sm text-red-600">{errors.costCurrency.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Prix de vente
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  {...register('sellingPrice', { valueAsNumber: true })}
                  className="input-field flex-1"
                />
                <select
                  {...register('sellingCurrency')}
                  className="input-field w-24"
                >
                  <option value="CDF">CDF</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              {errors.sellingPrice && (
                <p className="mt-1 text-sm text-red-600">{errors.sellingPrice.message}</p>
              )}
              {errors.sellingCurrency && (
                <p className="mt-1 text-sm text-red-600">{errors.sellingCurrency.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Seuil d'alerte
              </label>
              <input
                type="number"
                {...register('minStock', { valueAsNumber: true })}
                className="input-field"
              />
              {errors.minStock && (
                <p className="mt-1 text-sm text-red-600">{errors.minStock.message}</p>
              )}
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                {...register('isActive')}
                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-600"
              />
              <label className="text-sm font-medium text-gray-700">
                Actif
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                ID de la pharmacie *
              </label>
              <input
                type="text"
                {...register('pharmacyId')}
                className="input-field bg-gray-50"
                readOnly
              />
              {errors.pharmacyId && (
                <p className="mt-1 text-sm text-red-600">{errors.pharmacyId.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary rounded-lg px-6 py-2.5 text-sm font-medium"
          >
            {isSubmitting ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Créer'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/medicines')}
            className="btn-secondary rounded-lg px-6 py-2.5 text-sm font-medium"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}