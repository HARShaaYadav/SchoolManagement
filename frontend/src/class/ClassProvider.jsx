import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api.js'
import { ClassContext } from './context.js'

function readStored() {
  const raw = localStorage.getItem('sms_selected_class')
  return raw ? JSON.parse(raw) : null
}

export function ClassProvider({ children }) {
  const [classes, setClasses] = useState([])
  const [selectedClassId, setSelectedClassId] = useState(() => readStored()?.class_id || null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const res = await api.get('/classes')
        const list = res.data.classes || []
        if (cancelled) return
        setClasses(list)

        const stored = readStored()
        const storedId = stored?.class_id
        const exists = storedId ? list.some((c) => Number(c.id) === Number(storedId)) : false
        const nextId = exists ? storedId : list[0]?.id || null
        setSelectedClassId(nextId)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const selectedClass = useMemo(() => {
    return classes.find((c) => Number(c.id) === Number(selectedClassId)) || null
  }, [classes, selectedClassId])

  const value = useMemo(
    () => ({
      classes,
      loading,
      selectedClassId,
      selectedClass,
      setSelectedClassId(nextId) {
        setSelectedClassId(nextId)
        localStorage.setItem('sms_selected_class', JSON.stringify({ class_id: nextId }))
      },
    }),
    [classes, loading, selectedClass, selectedClassId],
  )

  return <ClassContext.Provider value={value}>{children}</ClassContext.Provider>
}

