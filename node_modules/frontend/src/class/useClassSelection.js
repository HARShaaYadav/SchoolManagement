import { useContext } from 'react'
import { ClassContext } from './context.js'

export function useClassSelection() {
  const ctx = useContext(ClassContext)
  if (!ctx) throw new Error('useClassSelection must be used within ClassProvider')
  return ctx
}

