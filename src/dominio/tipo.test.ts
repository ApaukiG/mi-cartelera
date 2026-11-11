import { describe, expect, it } from 'vitest'
import { etiquetaTipo } from './tipo'

describe('etiquetaTipo', () => {
  it('pelicula → "Película"', () => {
    expect(etiquetaTipo('pelicula')).toBe('Película')
  })

  it('serie → "Serie"', () => {
    expect(etiquetaTipo('serie')).toBe('Serie')
  })
})
