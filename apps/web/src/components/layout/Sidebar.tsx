import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Pill,
  Tags,
  Ruler,
  Factory,
  Truck,
  ShoppingCart,
  ClipboardList,
  Boxes,
  UsersRound,
  UserCog,
  ChartNoAxesCombined,
  Settings,
  LogOut,
  ChevronLeft,
  FlaskConical,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

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
      { icon: Tags, label: 'Catégories', path: '/categories' },
      { icon: Ruler, label: 'Unités', path: '/units' },
      { icon: Factory, label: 'Fabricants', path: '/manufacturers' },
      { icon: FlaskConical, label: 'Noms génériques', path: '/references/generic-names' },
    ],
  },
  {
    label: 'Opérations',
    items: [
      { icon: Truck, label: 'Fournisseurs', path: '/suppliers' },
      { icon: ClipboardList, label: 'Achats', path: '/purchases' },
      { icon: ShoppingCart, label: 'Ventes', path: '/sales' },
      { icon: Boxes, label: 'Stocks', path: '/inventory' },
      { icon: UsersRound, label: 'Clients', path: '/customers' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { icon: UserCog, label: 'Utilisateurs', path: '/users' },
      { icon: ChartNoAxesCombined, label: 'Rapports', path: '/reports/sales' },
      { icon: Settings, label: 'Paramètres', path: '/settings' },
    ],
  },
];

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      {mobileOpen && (
        <button aria-label="Fermer le menu" onClick={onMobileClose} className="fixed inset-0 z-40 bg-black/40 md:hidden" />
      )}
      <aside
      className={`fixed inset-y-0 left-0 z-50 flex h-dvh flex-col border-r bg-white transition-transform duration-300 md:relative md:z-auto md:translate-x-0 md:transition-[width] ${collapsed ? 'w-64 md:w-20' : 'w-64'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
      <div className="flex h-16 shrink-0 items-center justify-between border-b px-4">
        <div className="flex min-w-0 items-center gap-2.5 overflow-hidden">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_2px_10px_rgba(4,67,64,.10)] ring-1 ring-teal-950/5">
            <img src="/icons/pharmacy-emblem.svg" alt="" className="h-9 w-9 object-contain" />
          </span>
          {!collapsed && (
            <span className="min-w-0 truncate text-[15px] leading-[1.05] tracking-tight text-teal-950">
              <span className="font-extrabold">MULANGO</span><br />
              <span className="font-semibold">Healthcare</span>
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
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onMobileClose}
                  className={({ isActive }) =>
                    `group relative flex min-h-11 items-center gap-3 rounded-xl px-2.5 py-1.5 text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-[#e7f2f1] text-[#004c49] shadow-[inset_0_0_0_1px_rgba(0,76,73,.035)]'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-teal-800'
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
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${isActive ? 'bg-white/85 text-teal-900 shadow-sm' : 'text-slate-500 group-hover:bg-white group-hover:text-teal-800'}`}>
                        <item.icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                      </span>
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
    </>
  );
}
