import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { genericNamesService } from '../../services/generic-names.service';
import { useAuth } from '../../contexts/AuthContext';

const schema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

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

export function GenericNameForm() {
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
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { data: item, isLoading } = useQuery({
    queryKey: ['generic-name', id],
    queryFn: () => genericNamesService.findOne(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (item) {
      reset({ name: item.name, description: item.description || '' });
    }
  }, [item, reset]);

  const createMutation = useMutation({
    mutationFn: (data: any) => genericNamesService.create({ ...data, pharmacyId: user?.pharmacyId }),
    onSuccess: () => navigate('/references/generic-names'),
    onError: (error: any) => {
      setServerError(extractApiErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      genericNamesService.update(id, data),
    onSuccess: () => navigate('/references/generic-names'),
    onError: (error: any) => {
      setServerError(extractApiErrorMessage(error));
    },
  });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync({ id, data });
      } else {
        await createMutation.mutateAsync(data);
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
        {isEdit ? 'Modifier le nom générique' : 'Nouveau nom générique'}
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
              <label className="block text-sm font-medium text-gray-700">Nom *</label>
              <input
                type="text"
                {...register('name')}
                className="input-field"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className="input-field"
              />
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
            onClick={() => navigate('/references/generic-names')}
            className="btn-secondary rounded-lg px-6 py-2.5 text-sm font-medium"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}