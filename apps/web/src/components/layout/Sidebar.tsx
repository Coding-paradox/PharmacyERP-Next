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
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Tableau de bord', path: '/dashboard' },
  { icon: Pill, label: 'Médicaments', path: '/medicines' },
  { icon: FolderOpen, label: 'Catégories', path: '/categories' },
  { icon: Ruler, label: 'Unités', path: '/units' },
  { icon: Building2, label: 'Fabricants', path: '/manufacturers' },
  { icon: Truck, label: 'Fournisseurs', path: '/suppliers' },
  { icon: Package, label: 'Achats', path: '/purchases' }, // <-- ICI
  { icon: ShoppingCart, label: 'Ventes', path: '/sales' },
  { icon: Package, label: 'Stocks', path: '/inventory' },
  { icon: UserCircle, label: 'Utilisateurs', path: '/users' },
  { icon: Users, label: 'Clients', path: '/customers' },
  { icon: TrendingUp, label: 'Rapports', path: '/reports/sales' },
  { icon: Settings, label: 'Paramètres', path: '/settings' },
  { icon: Pill, label: 'Noms génériques', path: '/references/generic-names' },
];

export function Sidebar() {
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside
      className={`flex flex-col border-r bg-white transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <h1 className="text-xl font-bold text-teal-800">PharmacyERP</h1>
        )}
        {collapsed && (
          <h1 className="text-xl font-bold text-teal-800">P</h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ChevronLeft
            className={`h-5 w-5 transition-transform duration-300 ${
              collapsed ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-teal-50 text-teal-800 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-teal-700'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? item.label : ''}
          >
            <item.icon className={`h-5 w-5 ${collapsed ? 'flex-shrink-0' : ''}`} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-3">
        <button
          onClick={handleLogout}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-50 ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Déconnexion' : ''}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}