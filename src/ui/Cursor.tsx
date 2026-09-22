import { FINE_POINTER } from '../lib/store'

/**
 * The lamp head. Positioned entirely from the CSS variables the descent clock writes,
 * so it never costs a React render.
 */
export function Cursor() {
  if (!FINE_POINTER) return null
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
