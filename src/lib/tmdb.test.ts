import { afterEach, describe, expect, it, vi } from 'vitest'
import { obtenerDuraciones } from './tmdb'

// fetch simulado: sin red real. La URL lleva el id de TMDB en /movie/{id}.
function idDeUrl(url: string): number {
  const coincidencia = /\/movie\/(\d+)/.exec(url)
  return coincidencia ? Number(coincidencia[1]) : NaN
}

function respuestaJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('obtenerDuraciones', () => {
  it('si fallan algunas, marca error solo en esas', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const id = idDeUrl(url)
        if (id === 2)
          return respuestaJson({ status_message: 'No encontrada' }, 404)
        if (id === 3) throw new TypeError('Failed to fetch')
        if (id === 4) return respuestaJson({ runtime: 0 })
        return respuestaJson({ runtime: 95 })
      }),
    )

    expect(await obtenerDuraciones([1, 2, 3, 4])).toEqual([
      { tmdbId: 1, duracion: 95, error: false },
      { tmdbId: 2, duracion: null, error: true },
      { tmdbId: 3, duracion: null, error: true },
      { tmdbId: 4, duracion: null, error: false },
    ])
  })

  it('si fallan todas, lanza el mensaje en español', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch')
      }),
    )

    await expect(obtenerDuraciones([1, 2])).rejects.toThrow(
      'No pudimos consultar las duraciones en TMDB. Revisa tu conexión e inténtalo de nuevo.',
    )
  })

  it('una lista vacía no hace peticiones', async () => {
    const fetchSimulado = vi.fn()
    vi.stubGlobal('fetch', fetchSimulado)

    expect(await obtenerDuraciones([])).toEqual([])
    expect(fetchSimulado).not.toHaveBeenCalled()
  })

  it('nunca hace más de 5 peticiones simultáneas (S-16)', async () => {
    let activas = 0
    let maximo = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        activas++
        maximo = Math.max(maximo, activas)
        await new Promise((resolver) => setTimeout(resolver, 5))
        activas--
        return respuestaJson({ runtime: 100 })
      }),
    )

    const ids = Array.from({ length: 12 }, (_, i) => i + 1)
    const resultado = await obtenerDuraciones(ids)

    expect(resultado).toHaveLength(12)
    expect(resultado.map((r) => r.tmdbId)).toEqual(ids)
    expect(maximo).toBe(5)
  })
})
