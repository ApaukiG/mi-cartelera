import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'

type Modo = 'login' | 'registro'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [modo, setModo] = useState<Modo>('login')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)

  async function manejarEnvio(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setCargando(true)
    setError(null)
    setMensaje(null)

    if (modo === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else if (!data.session) setMensaje('Revisa tu correo para confirmar tu cuenta.')
    }

    setCargando(false)
  }

  return (
    <div>
      <h1>Mi Cartelera Personal</h1>
      <h2>{modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h2>

      <form onSubmit={manejarEnvio}>
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña (mínimo 6 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        <button type="submit" disabled={cargando}>
          {cargando ? 'Cargando...' : modo === 'login' ? 'Entrar' : 'Registrarme'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {mensaje && <p>{mensaje}</p>}

      <button onClick={() => setModo(modo === 'login' ? 'registro' : 'login')}>
        {modo === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
      </button>
    </div>
  )
}