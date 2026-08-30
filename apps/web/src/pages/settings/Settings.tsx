import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { settingsService } from '../../services/settings.service';
import { Building2, Users, Pill, ShoppingCart, Package, Truck, RefreshCw } from 'lucide-react';

const pharmacySchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  taxId: z.string().optional(),
  timezone: z.string().default('Africa/Kinshasa'),
  currency: z.string().default('CDF'),
});

type PharmacyFormData = z.infer<typeof pharmacySchema>;

export function Settings() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { data: pharmacy, isLoading: pharmacyLoading } = useQuery({
    queryKey: ['pharmacy-settings'],
    queryFn: () => settingsService.getPharmacySettings(),
  });

  const { data: systemInfo, isLoading: infoLoading } = useQuery({
    queryKey: ['system-info'],
    queryFn: () => settingsService.getSystemInfo(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PharmacyFormData>({
    resolver: zodResolver(pharmacySchema),
  });

  useEffect(() => {
    if (pharmacy) {
      reset({
        name: pharmacy.name,
        address: pharmacy.address || '',
        phone: pharmacy.phone || '',
        email: pharmacy.email || '',
        taxId: pharmacy.taxId || '',
        timezone: pharmacy.timezone || 'Africa/Kinshasa',
        currency: pharmacy.currency || 'CDF',
      });
    }
  }, [pharmacy, reset]);

  const updateMutation = useMutation({
    mutationFn: settingsService.updatePharmacySettings,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-settings'] });
      setIsEditing(false);
      setSuccessMessage('Paramètres mis à jour avec succès');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const onSubmit = async (data: PharmacyFormData) => {
    await updateMutation.mutateAsync(data);
  };

  if (pharmacyLoading || infoLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  const stats = [
    { icon: Users, label: 'Utilisateurs', value: systemInfo?.users || 0, color: 'bg-blue-500' },
    { icon: Pill, label: 'Médicaments', value: systemInfo?.medicines || 0, color: 'bg-green-500' },
    { icon: ShoppingCart, label: 'Ventes', value: systemInfo?.sales || 0, color: 'bg-purple-500' },
    { icon: Package, label: 'Achats', value: systemInfo?.purchases || 0, color: 'bg-orange-500' },
    { icon: Users, label: 'Clients', value: systemInfo?.customers || 0, color: 'bg-teal-500' },
    { icon: Truck, label: 'Fournisseurs', value: systemInfo?.suppliers || 0, color: 'bg-indigo-500' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
          >
            Modifier
          </button>
        )}
      </div>

      {successMessage && (
        <div className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-800">
          {successMessage}
        </div>
      )}

      {/* Statistiques */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center gap-4 rounded-lg bg-white p-4 shadow">
            <div className={`rounded-full p-3 ${stat.color} text-white`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Formulaire Pharmacie */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow">
        <div className="flex items-center gap-2 border-b pb-4">
          <Building2 className="h-5 w-5 text-teal-700" />
          <h2 className="text-lg font-semibold text-gray-900">Informations de la pharmacie</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nom</label>
              <input
                type="text"
                {...register('name')}
                disabled={!isEditing}
                className={`mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-teal-600 ${
                  !isEditing ? 'bg-gray-100' : ''
                }`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Téléphone</label>
              <input
                type="text"
                {...register('phone')}
                disabled={!isEditing}
                className={`mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-teal-600 ${
                  !isEditing ? 'bg-gray-100' : ''
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                {...register('email')}
                disabled={!isEditing}
                className={`mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-teal-600 ${
                  !isEditing ? 'bg-gray-100' : ''
                }`}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Adresse</label>
              <input
                type="text"
                {...register('address')}
                disabled={!isEditing}
                className={`mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-teal-600 ${
                  !isEditing ? 'bg-gray-100' : ''
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">N° TVA</label>
              <input
                type="text"
                {...register('taxId')}
                disabled={!isEditing}
                className={`mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-teal-600 ${
                  !isEditing ? 'bg-gray-100' : ''
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Devise</label>
              <select
                {...register('currency')}
                disabled={!isEditing}
                className={`mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-teal-600 ${
                  !isEditing ? 'bg-gray-100' : ''
                }`}
              >
                <option value="CDF">Franc Congolais (CDF)</option>
                <option value="USD">Dollar US (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Fuseau horaire</label>
              <select
                {...register('timezone')}
                disabled={!isEditing}
                className={`mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-teal-600 ${
                  !isEditing ? 'bg-gray-100' : ''
                }`}
              >
                <option value="Africa/Kinshasa">Afrique/Kinshasa</option>
                <option value="Africa/Lagos">Afrique/Lagos</option>
                <option value="Africa/Nairobi">Afrique/Nairobi</option>
                <option value="Europe/Paris">Europe/Paris</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>

          {isEditing && (
            <div className="mt-6 flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
              >
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  if (pharmacy) reset(pharmacy);
                }}
                className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
              >
                Annuler
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}