import { Link } from 'react-router-dom'
import { Button } from '../components/ui/primitives'

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
      <h1 className="text-5xl font-bold text-slate-900">404</h1>
      <p className="text-sm text-slate-600">La página que buscas no existe.</p>
      <Link to="/">
        <Button variant="secondary">Volver al inicio</Button>
      </Link>
    </div>
  )
}