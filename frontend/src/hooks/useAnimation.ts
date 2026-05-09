import { useState } from 'react'

export function useSuccessFlash() {
  const [flashing, setFlashing] = useState(false)
  const flash = () => {
    setFlashing(true)
    setTimeout(() => setFlashing(false), 600)
  }
  return { flashing, flash }
}

export function useShake() {
  const [shaking, setShaking] = useState(false)
  const shake = () => {
    setShaking(true)
    setTimeout(() => setShaking(false), 500)
  }
  return { shaking, shake }
}

export function useSlideOut() {
  const [sliding, setSliding] = useState(false)
  const slideOut = (onDone: () => void) => {
    setSliding(true)
    setTimeout(onDone, 350)
  }
  return { sliding, slideOut }
}
