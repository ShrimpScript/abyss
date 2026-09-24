import { MAX_DEPTH } from '../lib/depth'
import { warpTo } from '../lib/descent'
import { useStore } from '../lib/store'

/**
 * The column is about seventeen screens deep. Without this, reaching the index at the
 * bottom on a keyboard means travelling the entire descent.
 */
export function SkipLink() {
  const phase = useStore((s) => s.phase)
  if (phase === 'gate') return null

  const jump = () => {
    warpTo(MAX_DEPTH)
    window.setTimeout(() => {
      document.querySelector<HTMLButtonElement>('.floor__index button')?.focus()
    }, 1400)
  }

  return (
    <button className="skip" onClick={jump}>
      Skip to the project index
    </button>
  )
}
