import { animate, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'

// Counts up (or down) from the previously shown value to `value`.
// `format` must be a stable function (e.g. defined at module level).
export default function AnimatedNumber({
  value,
  format,
  duration = 1.2,
  className,
}: {
  value: number
  format: (n: number) => string
  duration?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const shown = useRef(0)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const controls = animate(shown.current, value, {
      duration: reduceMotion ? 0 : duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        shown.current = v
        node.textContent = format(v)
      },
    })
    return () => controls.stop()
  }, [value, format, duration, reduceMotion])

  // The text is owned by the animation after mount; React only renders the starting value.
  return (
    <span ref={ref} className={className}>
      {format(0)}
    </span>
  )
}
