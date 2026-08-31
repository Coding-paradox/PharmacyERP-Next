import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Pill,
  FolderOpen,
  Ruler,
  Building2,
  Truck,
  ShoppingCart,
  Package,
  Users,
  UserCircle,
  TrendingUp,
  Settings,
  LogOut,
  ChevronLeft,
  FlaskConical,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

// Les 14 liens sont regroupés en sections logiques plutôt qu'en une seule
// longue liste plate : plus facile à scanner visuellement, et ça atténue
// l'impression de menu interminable maintenant qu'il défile correctement.
const menuSections = [
  {
    label: null, // pas de titre pour la vue d'ensemble
    items: [{ icon: LayoutDashboard, label: 'Tableau de bord', path: '/dashboard' }],
  },
  {
    label: 'Catalogue',
    items: [
      { icon: Pill, label: 'Médicaments', path: '/medicines' },
      { icon: FolderOpen, label: 'Catégories', path: '/categories' },
      { icon: Ruler, label: 'Unités', path: '/units' },
      { icon: Building2, label: 'Fabricants', path: '/manufacturers' },
      { icon: FlaskConical, label: 'Noms génériques', path: '/references/generic-names' },
    ],
  },
  {
    label: 'Opérations',
    items: [
      { icon: Truck, label: 'Fournisseurs', path: '/suppliers' },
      { icon: Package, label: 'Achats', path: '/purchases' },
      { icon: ShoppingCart, label: 'Ventes', path: '/sales' },
      { icon: Package, label: 'Stocks', path: '/inventory' },
      { icon: Users, label: 'Clients', path: '/customers' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { icon: UserCircle, label: 'Utilisateurs', path: '/users' },
      { icon: TrendingUp, label: 'Rapports', path: '/reports/sales' },
      { icon: Settings, label: 'Paramètres', path: '/settings' },
    ],
  },
];

export function Sidebar() {
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside
      className={`flex h-screen flex-col border-r bg-white transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex h-16 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-white">
            <Stethoscope className="h-4 w-4" strokeWidth={2.5} />
          </span>
          {!collapsed && (
            <span className="truncate text-base font-semibold text-gray-900">
              PharmacyERP
            </span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label={collapsed ? 'Déplier le menu' : 'Réduire le menu'}
        >
          <ChevronLeft
            className={`h-5 w-5 transition-transform duration-300 ${
              collapsed ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* min-h-0 est ce qui permet réellement au scroll de fonctionner ici :
          sans lui, un enfant flex-1 refuse de rétrécir sous sa taille de
          contenu et déborde hors de l'écran au lieu de défiler. */}
      <nav className="flex-1 min-h-0 space-y-4 overflow-y-auto px-3 py-4">
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {section.label && !collapsed && (
              <p className="px-3 pb-1.5 pt-2 text-xs font-medium text-gray-400">
                {section.label}
              </p>
            )}
            {section.label && collapsed && sectionIndex > 0 && (
              <div className="mx-3 my-2 border-t border-gray-100" />
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                      isActive
                        ? 'bg-teal-50 text-teal-800'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-teal-700'
                    } ${collapsed ? 'justify-center' : ''}`
                  }
                  title={collapsed ? item.label : ''}
                >
                  {({ isActive }) => (
                    <>
                      {/* Liseré vertical à gauche du lien actif : plus net
                          qu'une simple ombre pour signaler la page courante. */}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-teal-700" />
                      )}
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t p-3">
        <button
          onClick={handleLogout}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Déconnexion' : ''}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}