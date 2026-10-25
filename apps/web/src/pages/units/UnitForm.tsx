import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { unitsService } from '../../services/units.service';
import { useAuth } from '../../contexts/AuthContext';

const unitSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(50),
  symbol: z.string().max(10).optional(),
});

type UnitFormData = z.infer<typeof unitSchema>;

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

export function UnitForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = !!id;
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UnitFormData>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      name: '',
      symbol: '',
    },
  });

  const { data: unit, isLoading, error } = useQuery({
    queryKey: ['unit', id],
    queryFn: () => unitsService.findOne(id!),
    enabled: isEdit,
    retry: false,
  });

  // Rediriger si l'unité n'existe pas
  useEffect(() => {
    if (isEdit && error) {
      navigate('/units');
    }
  }, [isEdit, error, navigate]);

  useEffect(() => {
    if (unit) {
      reset({
        name: unit.name,
        symbol: unit.symbol || '',
      });
    }
  }, [unit, reset]);

  const createMutation = useMutation({
    mutationFn: unitsService.create,
    onSuccess: () => {
      navigate('/units');
    },
    onError: (error: any) => {
      setServerError(extractApiErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      unitsService.update(id, data),
    onSuccess: () => {
      navigate('/units');
    },
    onError: (error: any) => {
      setServerError(extractApiErrorMessage(error));
    },
  });

  const onSubmit = async (data: UnitFormData) => {
    setServerError(null);
    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync({ id, data });
      } else {
        await createMutation.mutateAsync({
          ...data,
          pharmacyId: user?.pharmacyId || '',
        });
      }
    } catch (error) {
      // Erreur déjà affichée via onError ci-dessus.
    }
  };

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
        {isEdit ? "Modifier l'unité" : 'Nouvelle unité'}
      </h1>

      {serverError && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nom *
              </label>
              <input
                type="text"
                {...register('name')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-teal-600"
                placeholder="Ex: Comprimé, Gélule, Sirop..."
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Symbole
              </label>
              <input
                type="text"
                {...register('symbol')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-teal-600"
                placeholder="Ex: cp, gel, Sir..."
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Créer'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/units')}
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}