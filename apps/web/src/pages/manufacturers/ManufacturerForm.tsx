import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { manufacturersService } from '../../services/manufacturers.service';
import { useAuth } from '../../contexts/AuthContext';

const manufacturerSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100),
  country: z.string().max(100).optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
});

type ManufacturerFormData = z.infer<typeof manufacturerSchema>;

export function ManufacturerForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = !!id;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ManufacturerFormData>({
    resolver: zodResolver(manufacturerSchema),
  });

  const { data: manufacturer, isLoading } = useQuery({
    queryKey: ['manufacturer', id],
    queryFn: () => manufacturersService.findOne(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (manufacturer) {
      reset({
        name: manufacturer.name,
        country: manufacturer.country || '',
        email: manufacturer.email || '',
        phone: manufacturer.phone || '',
      });
    }
  }, [manufacturer, reset]);

  const createMutation = useMutation({
    mutationFn: manufacturersService.create,
    onSuccess: () => {
      navigate('/manufacturers');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      manufacturersService.update(id, data),
    onSuccess: () => {
      navigate('/manufacturers');
    },
  });

  const onSubmit = async (data: ManufacturerFormData) => {
    if (isEdit && id) {
      await updateMutation.mutateAsync({ id, data });
    } else {
      await createMutation.mutateAsync({
        ...data,
        pharmacyId: user?.pharmacyId || '',
      });
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
        {isEdit ? 'Modifier le fabricant' : 'Nouveau fabricant'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Nom du fabricant *
              </label>
              <input
                type="text"
                {...register('name')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-teal-600"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Pays
              </label>
              <input
                type="text"
                {...register('country')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                {...register('email')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-teal-600"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Téléphone
              </label>
              <input
                type="text"
                {...register('phone')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-teal-600"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Créer'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/manufacturers')}
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}