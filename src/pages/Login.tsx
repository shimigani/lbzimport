import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useNoIndex } from '../hooks/useNoIndex'
import { Alert, Button, Input, PageSpinner } from '../components/ui/primitives'

export function Login() {
  const { user, loading, signIn } = useAuth()
  const navigate = useNavigate()
  useNoIndex()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return <PageSpinner />
  }

  if (user) {
    return <Navigate to="/admin" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Ingresa tu correo y contraseña.')
      return
    }
    setSubmitting(true)
    setError(null)
    const result = await signIn(email, password)
    setSubmitting(false)
    if (result.error) {
      setError('Credenciales incorrectas. Verifica tu correo y contraseña.')
      return
    }
    navigate('/admin')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
            MT
          </span>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Mi Tienda</h1>
          <p className="mt-1 text-sm text-slate-500">Panel administrativo</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          {error && <Alert>{error}</Alert>}
          <Input
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            placeholder="admin@mitienda.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className="w-full" loading={submitting}>
            Iniciar sesión
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link to="/" className="text-indigo-600 hover:underline">
            Volver a la tienda
          </Link>
        </p>
      </div>
    </div>
  )
}