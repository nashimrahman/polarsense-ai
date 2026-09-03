import { useEffect, useRef } from 'react'
import { animate } from 'framer-motion'

export function AnimatedCounter({
  value,
  decimals = 0,
  suffix = '',
  prefix = '',
  className,
}: {
  value: number
  decimals?: number
  suffix?: string
  prefix?: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const prevValue = useRef(0)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const controls = animate(prevValue.current, value, {
      duration: 1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(v) {
        node.textContent = `${prefix}${v.toFixed(decimals)}${suffix}`
      },
    })
    prevValue.current = value
    return () => controls.stop()
  }, [value, decimals, prefix, suffix])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  )
}
