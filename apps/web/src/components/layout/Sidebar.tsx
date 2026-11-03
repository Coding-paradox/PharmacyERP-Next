import { NavLink } from 'react-router-dom';
import { SquaresFourIcon } from '@phosphor-icons/react/dist/csr/SquaresFour';
import { PillIcon } from '@phosphor-icons/react/dist/csr/Pill';
import { TagIcon } from '@phosphor-icons/react/dist/csr/Tag';
import { RulerIcon } from '@phosphor-icons/react/dist/csr/Ruler';
import { FactoryIcon } from '@phosphor-icons/react/dist/csr/Factory';
import { FlaskIcon } from '@phosphor-icons/react/dist/csr/Flask';
import { TruckIcon } from '@phosphor-icons/react/dist/csr/Truck';
import { ClipboardTextIcon } from '@phosphor-icons/react/dist/csr/ClipboardText';
import { ShoppingCartIcon } from '@phosphor-icons/react/dist/csr/ShoppingCart';
import { PackageIcon } from '@phosphor-icons/react/dist/csr/Package';
import { UsersThreeIcon } from '@phosphor-icons/react/dist/csr/UsersThree';
import { UserGearIcon } from '@phosphor-icons/react/dist/csr/UserGear';
import { ChartBarIcon } from '@phosphor-icons/react/dist/csr/ChartBar';
import { GearSixIcon } from '@phosphor-icons/react/dist/csr/GearSix';
import { SignOutIcon } from '@phosphor-icons/react/dist/csr/SignOut';
import { CaretLeftIcon } from '@phosphor-icons/react/dist/csr/CaretLeft';
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
    items: [{ icon: SquaresFourIcon, label: 'Tableau de bord', path: '/dashboard' }],
  },
  {
    label: 'Catalogue',
    items: [
      { icon: PillIcon, label: 'Médicaments', path: '/medicines' },
      { icon: TagIcon, label: 'Catégories', path: '/categories' },
      { icon: RulerIcon, label: 'Unités', path: '/units' },
      { icon: FactoryIcon, label: 'Fabricants', path: '/manufacturers' },
      { icon: FlaskIcon, label: 'Noms génériques', path: '/references/generic-names' },
    ],
  },
  {
    label: 'Opérations',
    items: [
      { icon: TruckIcon, label: 'Fournisseurs', path: '/suppliers' },
      { icon: ClipboardTextIcon, label: 'Achats', path: '/purchases' },
      { icon: ShoppingCartIcon, label: 'Ventes', path: '/sales' },
      { icon: PackageIcon, label: 'Stocks', path: '/inventory' },
      { icon: UsersThreeIcon, label: 'Clients', path: '/customers' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { icon: UserGearIcon, label: 'Utilisateurs', path: '/users' },
      { icon: ChartBarIcon, label: 'Rapports', path: '/reports/sales' },
      { icon: GearSixIcon, label: 'Paramètres', path: '/settings' },
    ],
  },
];

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [tooltip, setTooltip] = useState<{ label: string; top: number; left: number } | null>(null);

  const showTooltip = (label: string, target: HTMLElement) => {
    if (!collapsed) return;
    const bounds = target.getBoundingClientRect();
    setTooltip({ label, top: bounds.top + bounds.height / 2, left: bounds.right + 9 });
  };

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
          onClick={() => { setTooltip(null); setCollapsed(!collapsed); }}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label={collapsed ? 'Déplier le menu' : 'Réduire le menu'}
        >
          <CaretLeftIcon
            size={20}
            weight="regular"
            className={`transition-transform duration-200 ${
              collapsed ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* min-h-0 est ce qui permet réellement au scroll de fonctionner ici :
          sans lui, un enfant flex-1 refuse de rétrécir sous sa taille de
          contenu et déborde hors de l'écran au lieu de défiler. */}
      <nav className="flex-1 min-h-0 space-y-5 overflow-y-auto px-3 py-4">
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {section.label && !collapsed && (
              <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                {section.label}
              </p>
            )}
            {section.label && collapsed && sectionIndex > 0 && (
              <div className="mx-3 my-3 border-t border-slate-100" />
            )}
            <div className="space-y-1.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onMobileClose}
                  viewTransition
                  onMouseEnter={(event) => showTooltip(item.label, event.currentTarget)}
                  onMouseLeave={() => setTooltip(null)}
                  onFocus={(event) => showTooltip(item.label, event.currentTarget)}
                  onBlur={() => setTooltip(null)}
                  className={({ isActive }) =>
                    `group relative flex min-h-12 items-center gap-3 rounded-xl px-2 py-1.5 text-sm font-medium transition-[color,background-color,transform] duration-200 ease-out ${
                      isActive
                        ? 'bg-[#edf5f4] text-[#004c49]'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-[#005c56] active:scale-[.99]'
                    } ${collapsed ? 'justify-center' : ''}`
                  }
                  aria-label={collapsed ? item.label : undefined}
                  aria-describedby={collapsed ? 'sidebar-navigation-tooltip' : undefined}
                >
                  {({ isActive }) => (
                    <>
                      {/* Liseré vertical à gauche du lien actif : plus net
                          qu'une simple ombre pour signaler la page courante. */}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 h-6 w-[2px] -translate-y-1/2 rounded-r-full bg-[#087c73]" />
                      )}
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] transition-[background-color,color,transform] duration-200 group-hover:-translate-y-px ${isActive ? 'bg-white/80 text-[#006b64]' : 'text-slate-500 group-hover:text-[#006b64]'}`}>
                        <item.icon size={22} weight="duotone" className="transition-transform duration-200 group-hover:scale-[1.04]" />
                      </span>
                      {!collapsed && <span className="min-w-0 flex-1 truncate transition-transform duration-200 group-hover:translate-x-0.5">{item.label}</span>}
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
          onMouseEnter={(event) => showTooltip('Déconnexion', event.currentTarget)}
          onMouseLeave={() => setTooltip(null)}
          onFocus={(event) => showTooltip('Déconnexion', event.currentTarget)}
          onBlur={() => setTooltip(null)}
          className={`group relative flex min-h-12 w-full items-center gap-3 rounded-xl px-2 py-1.5 text-sm font-medium text-slate-600 transition-[color,background-color] duration-200 hover:bg-rose-50 hover:text-rose-700 ${
            collapsed ? 'justify-center' : ''
          }`}
          aria-label={collapsed ? 'Déconnexion' : undefined}
          aria-describedby={collapsed ? 'sidebar-navigation-tooltip' : undefined}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-rose-600 transition-colors group-hover:bg-white/80"><SignOutIcon size={21} weight="regular" /></span>
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
      {collapsed && tooltip && <span id="sidebar-navigation-tooltip" role="tooltip" className="pointer-events-none fixed z-[100] -translate-y-1/2 whitespace-nowrap rounded-lg border border-slate-700/80 bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-[0_8px_24px_rgba(15,23,42,.2)] animate-[sidebar-tooltip-in_120ms_ease-out_both]" style={{ top: tooltip.top, left: tooltip.left }}>{tooltip.label}</span>}
      </aside>
    </>
  );
}
