import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Bell, CalendarClock, Check, CheckCheck, CircleDollarSign, ClipboardCheck, LoaderCircle, PackageCheck, ShoppingCart } from 'lucide-react';
import { notificationsService, type AppNotification } from '../../services/notifications.service';

const typeStyle: Record<AppNotification['type'], { icon: typeof Bell; color: string }> = {
  SALE: { icon: CircleDollarSign, color: 'bg-emerald-50 text-emerald-700' },
  PURCHASE: { icon: PackageCheck, color: 'bg-teal-50 text-teal-800' },
  LOW_STOCK: { icon: ShoppingCart, color: 'bg-amber-50 text-amber-700' },
  EXPIRY: { icon: CalendarClock, color: 'bg-orange-50 text-orange-700' },
  STOCKTAKE: { icon: ClipboardCheck, color: 'bg-blue-50 text-blue-700' },
};

function relativeTime(value: string) {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });
  if (Math.abs(seconds) < 60) return formatter.format(seconds, 'second');
  if (Math.abs(seconds) < 3600) return formatter.format(Math.round(seconds / 60), 'minute');
  if (Math.abs(seconds) < 86400) return formatter.format(Math.round(seconds / 3600), 'hour');
  return formatter.format(Math.round(seconds / 86400), 'day');
}

function base64UrlToBytes(base64: string) {
  const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`;
  const decoded = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    typeof Notification === 'undefined' ? 'default' : Notification.permission,
  );
  const [pushMessage, setPushMessage] = useState('');
  const client = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.list(),
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
  const { data: pushConfig } = useQuery({
    queryKey: ['notifications-push-config'],
    queryFn: () => notificationsService.pushConfig(),
    staleTime: 60 * 60 * 1000,
  });

  const markReadMutation = useMutation({
    mutationFn: notificationsService.markRead,
    onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const markAllMutation = useMutation({
    mutationFn: notificationsService.markAllRead,
    onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const enablePush = async () => {
    setPushMessage('');
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || typeof Notification === 'undefined') {
      setPushMessage('Les notifications navigateur ne sont pas prises en charge par ce navigateur.');
      return;
    }
    if (!pushConfig?.publicKey) {
      setPushMessage('Le centre d’alertes est prêt. La clé Web Push sera à renseigner lors de la configuration de l’hébergement HTTPS.');
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') {
        setPushMessage('Autorisez les notifications dans les réglages du navigateur pour cet appareil.');
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription() ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlToBytes(pushConfig.publicKey),
      });
      await notificationsService.subscribe(subscription);
      setPushMessage('Notifications activées sur cet appareil.');
    } catch {
      setPushMessage('Impossible d’activer les notifications. Vérifiez la connexion et réessayez.');
    }
  };

  const openNotification = async (item: AppNotification) => {
    if (!item.readAt) await markReadMutation.mutateAsync(item.id);
    setOpen(false);
    if (item.href) navigate(item.href);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={data?.unreadCount ? `${data.unreadCount} notifications non lues` : 'Notifications'}
        aria-expanded={open}
        className={`relative rounded-xl p-2 transition ${open ? 'bg-teal-50 text-teal-900' : 'text-gray-500 hover:bg-gray-100 hover:text-teal-800'}`}
      >
        <Bell className="h-5 w-5" />
        {!!data?.unreadCount && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-0.5 text-[9px] font-bold leading-none text-white">{data.unreadCount > 9 ? '9+' : data.unreadCount}</span>}
      </button>

      {open && <>
        <button aria-label="Fermer les notifications" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
        <section className="absolute right-0 z-50 mt-3 w-[min(23rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-900/10" aria-label="Centre de notifications">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-teal-50 to-white px-4 py-4">
            <div><h2 className="font-semibold text-gray-950">Notifications</h2><p className="mt-0.5 text-xs text-gray-500">Alertes et événements récents</p></div>
            {!!data?.unreadCount && <button onClick={() => markAllMutation.mutate()} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-teal-800 transition hover:bg-teal-100"><CheckCheck className="h-3.5 w-3.5" /> Tout lire</button>}
          </div>

          <div className="max-h-[min(60vh,28rem)] overflow-y-auto">
            {isLoading ? <div className="flex items-center justify-center py-12 text-sm text-gray-500"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Chargement…</div>
              : data?.items.length ? data.items.slice(0, 12).map((item) => {
                const config = typeStyle[item.type];
                const Icon = config.icon;
                return <button key={item.id} onClick={() => void openNotification(item)} className={`flex w-full gap-3 border-b border-gray-50 px-4 py-3.5 text-left transition hover:bg-teal-50/50 ${item.readAt ? 'opacity-75' : 'bg-white'}`}>
                  <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${config.color}`}><Icon className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-2"><span className="text-sm font-semibold text-gray-900">{item.title}</span>{!item.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal-600" />}</span><span className="mt-1 block text-xs leading-5 text-gray-600">{item.message}</span><span className="mt-1.5 block text-[11px] text-gray-400">{relativeTime(item.createdAt)}</span></span>
                </button>;
              })
                : <div className="px-6 py-10 text-center"><span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-800"><Check className="h-5 w-5" /></span><p className="mt-3 text-sm font-semibold text-gray-900">Aucune notification</p></div>}
          </div>

          <div className="border-t border-gray-100 bg-gray-50/70 px-4 py-3">
            <button onClick={() => void enablePush()} className="flex w-full items-center justify-between rounded-xl border border-teal-100 bg-white px-3 py-2.5 text-left transition hover:border-teal-200 hover:bg-teal-50/50">
              <span className="flex items-center gap-2.5"><span className="rounded-lg bg-teal-50 p-1.5 text-teal-800"><Bell className="h-3.5 w-3.5" /></span><span><span className="block text-xs font-semibold text-gray-800">Notifications sur cet appareil</span><span className="mt-0.5 block text-[10px] text-gray-500">{permission === 'granted' ? 'Autorisation active' : 'Activer les alertes navigateur'}</span></span></span>
              <AlertTriangle className="h-3.5 w-3.5 text-gray-400" />
            </button>
            {pushMessage && <p role="status" className="mt-2 px-1 text-[11px] leading-4 text-gray-500">{pushMessage}</p>}
          </div>
        </section>
      </>}
    </div>
  );
}
