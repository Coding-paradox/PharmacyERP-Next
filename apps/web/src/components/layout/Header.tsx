import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { ChevronDown, LogOut, Menu, Download, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { promptPwaInstall, subscribeToPwaInstall } from '../../lib/pwa-install';
import { NotificationsBell } from './NotificationsBell';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installHelp, setInstallHelp] = useState(false);

  useEffect(() => {
    return subscribeToPwaInstall(({ prompt, installed }) => {
      setCanInstall(!!prompt);
      setIsInstalled(installed);
    });
  }, []);

  const handleInstall = async () => {
    if (!canInstall) {
      setInstallHelp((visible) => !visible);
      return;
    }
    const outcome = await promptPwaInstall();
    if (outcome === 'accepted') setInstallHelp(false);
  };

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const installInstructions = isIos
    ? 'Dans Safari, touchez Partager, puis « Sur l’écran d’accueil ».'
    : canInstall
      ? 'Installez MULANGO Healthcare pour l’ouvrir comme une application.'
      : 'Ouvrez le menu de votre navigateur et choisissez « Installer MULANGO Healthcare ». Sur iPhone ou iPad, utilisez Safari puis Partager → Sur l’écran d’accueil.';

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="relative z-30 flex h-14 shrink-0 items-center justify-between border-b bg-white px-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <button onClick={onMenuClick} aria-label="Ouvrir le menu" className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden">
          <Menu className="h-5 w-5" />
        </button>
        <h2 className="truncate text-sm font-semibold text-gray-800 sm:text-base">MULANGO Healthcare</h2>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        <NotificationsBell />
        {!isInstalled && (
          <div className="relative">
            <button
              onClick={handleInstall}
              aria-label={canInstall ? 'Installer MULANGO Healthcare' : 'Voir les instructions d’installation'}
              aria-expanded={installHelp}
              className="flex items-center gap-1.5 rounded-xl bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-100 sm:gap-2 sm:px-4"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">{canInstall ? 'Installer' : 'Ajouter'}</span>
            </button>
            {installHelp && (
              <div role="status" className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-teal-100 bg-white p-4 text-sm leading-relaxed text-gray-700 shadow-xl">
                <p className="font-semibold text-gray-900">Utiliser l’application sur cet appareil</p>
                <p className="mt-1">{installInstructions}</p>
                <p className="mt-2 text-xs text-gray-500">L’installation est disponible sur une adresse sécurisée (HTTPS) ou sur localhost.</p>
              </div>
            )}
          </div>
        )}

        {/* User */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 rounded-full pl-2 pr-3 py-1 hover:bg-gray-100 transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-700 text-xs font-medium text-white">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <span className="hidden max-w-32 truncate text-sm font-medium text-gray-700 sm:inline">
              {user?.firstName} {user?.lastName}
            </span>
            <ChevronDown className="h-3 w-3 text-gray-400" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              <Link to="/settings" onClick={() => setShowDropdown(false)} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-teal-50">
                <Settings className="h-4 w-4" />
                Paramètres
              </Link>
              <div className="border-t border-gray-100 my-1"></div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
