import { Link } from 'react-router-dom'
import { useNoIndex } from '../../hooks/useNoIndex'
import { Button } from '../../components/ui/primitives'

export function AccessDenied() {
  useNoIndex()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl">
        ⛔
      </span>
      <h1 className="text-xl font-bold text-slate-900">Acceso denegado</h1>
      <p className="max-w-md text-sm text-slate-600">
        Tu cuenta está autenticada, pero no tiene permisos de administrador para acceder a este
        panel. Contacta con el administrador de la tienda.
      </p>
      <Link to="/">
        <Button variant="secondary">Ir a la página de inicio</Button>
      </Link>
    </div>
  )
}