import { useEffect, useState } from 'react'
import { FINE_POINTER } from '../lib/store'

/**
 * The lamp head. Positioned entirely from the CSS variables the descent clock writes,
 * so it never costs a React render.
 */
export function Cursor() {
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    if (!FINE_POINTER) return
    const on = () => setSeen(true)
    window.addEventListener('pointermove', on, { once: true, passive: true })
    return () => window.removeEventListener('pointermove', on)
  }, [])

  // Until the pointer has moved once it would sit at the origin, as a ring in the corner.
  if (!FINE_POINTER || !seen) return null
  return (
    <div className="cursor" aria-hidden="true">
      <span className="cursor__ring" />
      <span className="cursor__dot" />
      <span className="cursor__tick cursor__tick--n" />
      <span className="cursor__tick cursor__tick--s" />
      <span className="cursor__tick cursor__tick--e" />
      <span className="cursor__tick cursor__tick--w" />
    </div>
  )
}
