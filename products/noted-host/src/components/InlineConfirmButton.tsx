import { useEffect, useRef, useState } from 'react'

interface Props {
  onConfirm: () => void
  label?: string
  confirmLabel?: string
  className?: string
  title?: string
  'data-test'?: string
}

export function InlineConfirmButton({
  onConfirm,
  label = 'Delete',
  confirmLabel = 'Confirm?',
  className = '',
  title,
  'data-test': dataTest
}: Props) {
  const [confirming, setConfirming] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  function handle(e: React.MouseEvent) {
    e.stopPropagation()
    if (confirming) {
      if (timerRef.current) clearTimeout(timerRef.current)
      setConfirming(false)
      onConfirm()
    } else {
      setConfirming(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => setConfirming(false), 3000)
    }
  }

  return (
    <button
      onClick={handle}
      className={className}
      data-confirming={confirming}
      data-test={dataTest}
      title={title}
    >
      {confirming ? confirmLabel : label}
    </button>
  )
}
