import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  BoxesIcon,
  ClipboardIcon,
  GridIcon,
  HomeIcon,
  LogoutIcon,
  SettingsIcon,
  TagIcon,
} from '../store/icons'

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: HomeIcon, end: true },
  { to: '/admin/products', label: 'Productos', icon: BoxesIcon },
  { to: '/admin/categories', label: 'Categorías', icon: GridIcon },
  { to: '/admin/orders', label: 'Pedidos', icon: ClipboardIcon },
  { to: '/admin/settings', label: 'Configuración', icon: SettingsIcon },
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { profile, signOut } = useAuth()

  async function handleLogout() {
    await signOut()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-sm">
          MT
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">Mi Tienda</p>
          <p className="text-xs text-slate-500">Panel administrativo</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon className="h-4.5 w-4.5" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-slate-200 px-3 py-4">
        <div className="mb-3 flex items-center gap-3 px-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
            {(profile?.full_name || 'A').charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">
              {profile?.full_name || 'Administrador'}
            </p>
            <p className="text-xs text-slate-500">admin</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700"
        >
          <LogoutIcon className="h-4.5 w-4.5" />
          Cerrar sesión
        </button>
        <NavLink
          to="/"
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <TagIcon className="h-4.5 w-4.5" />
          Ver tienda
        </NavLink>
      </div>
    </div>
  )
}