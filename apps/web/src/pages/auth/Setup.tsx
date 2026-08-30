import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';

const setupSchema = z.object({
  pharmacy: z.object({
    name: z.string().min(1, 'Le nom de la pharmacie est requis'),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Email invalide').optional(),
    taxId: z.string().optional(),
    timezone: z.string().optional(),
    currency: z.string().optional(),
  }),
  admin: z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    firstName: z.string().min(1, 'Le prénom est requis'),
    lastName: z.string().min(1, 'Le nom est requis'),
  }),
});

type SetupForm = z.infer<typeof setupSchema>;

export function Setup() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setup } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetupForm>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      pharmacy: {
        timezone: 'Africa/Kinshasa',
        currency: 'CDF',
      },
    },
  });

  const onSubmit = async (data: SetupForm) => {
    setError(null);
    setIsLoading(true);
    try {
      await setup(data);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'initialisation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-teal-800">PharmacyERP</h1>
          <p className="mt-2 text-sm text-gray-600">Initialisation du système</p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Informations de la pharmacie</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nom de la pharmacie *
                </label>
                <input
                  type="text"
                  {...register('pharmacy.name')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-teal-600"
                />
                {errors.pharmacy?.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.pharmacy.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Adresse</label>
                <input
                  type="text"
                  {...register('pharmacy.address')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                <input
                  type="text"
                  {...register('pharmacy.phone')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  {...register('pharmacy.email')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-teal-600"
                />
                {errors.pharmacy?.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.pharmacy.email.message}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900">Compte administrateur</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <input
                  type="email"
                  {...register('admin.email')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-teal-600"
                />
                {errors.admin?.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.admin.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Mot de passe *
                </label>
                <input
                  type="password"
                  {...register('admin.password')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-teal-600"
                />
                {errors.admin?.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.admin.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Prénom *
                </label>
                <input
                  type="text"
                  {...register('admin.firstName')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-teal-600"
                />
                {errors.admin?.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.admin.firstName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nom *
                </label>
                <input
                  type="text"
                  {...register('admin.lastName')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-teal-600"
                />
                {errors.admin?.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.admin.lastName.message}</p>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Initialisation...' : 'Initialiser le système'}
          </button>
        </form>

        <div className="text-center text-sm">
          <span className="text-gray-600">Déjà configuré ?</span>{' '}
          <a href="/login" className="text-teal-700 hover:underline">
            Se connecter
          </a>
        </div>
      </div>
    </div>
  );
}