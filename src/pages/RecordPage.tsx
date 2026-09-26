import { useState, useEffect, useCallback } from 'react'
import { Bus, Send, RotateCcw } from 'lucide-react'
import { useSceneStore } from '@/store/useSceneStore'
import { formatTimestamp, nowLocalInputValue, isFutureTimestamp } from '@/utils/sceneHelpers'
import SceneFormFields from '@/components/SceneFormFields'
import type { SceneFormData } from '@/types'

const initialForm = (): SceneFormData => ({
  routeName: '',
  segment: '',
  seatDirection: '左',
  timestamp: new Date().toISOString(),
  weather: '晴',
  signText: '',
  treeDensity: '适中',
  pedestrianStatus: '稀少',
  note: '',
})

export default function RecordPage() {
  const saveScene = useSceneStore((s) => s.saveScene)
  const loadAll = useSceneStore((s) => s.loadAll)
  const [form, setForm] = useState<SceneFormData>(initialForm)
  const [maxTime, setMaxTime] = useState(() => nowLocalInputValue())
  const [timeError, setTimeError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // 每 30 秒推进一次可选时间上限，长时间停留也不会误判为未来
  useEffect(() => {
    const timer = setInterval(() => setMaxTime(nowLocalInputValue()), 30000)
    return () => clearInterval(timer)
  }, [])

  const update = useCallback(
    <K extends keyof SceneFormData>(key: K, val: SceneFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: val }))
      if (key === 'timestamp') {
        setTimeError(
          typeof val === 'string' && val && isFutureTimestamp(val)
            ? '乘车时间不能在未来，请选择当前或过去的时间'
            : ''
        )
      }
    },
    []
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.timestamp || isFutureTimestamp(form.timestamp)) {
      setTimeError('乘车时间不能在未来，请选择当前或过去的时间')
      return
    }
    saveScene(form)
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      setForm(initialForm())
      setMaxTime(nowLocalInputValue())
      setTimeError('')
    }, 1500)
  }

  return (
    <div className="relative min-h-screen bg-teal-950 p-4 pb-24">
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div
            className="animate-bounce flex flex-col items-center gap-2 opacity-0"
            style={{ animation: 'fadeInUp 1.5s ease forwards' }}
          >
            <Bus className="w-16 h-16 text-dusk-400" />
            <span className="text-mist-100 font-serif text-lg">记录已保存</span>
          </div>
          <style>{`@keyframes fadeInUp { 0% { opacity:0; transform:translateY(20px) } 40% { opacity:1; transform:translateY(0) } 100% { opacity:0; transform:translateY(-40px) } }`}</style>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Bus className="w-6 h-6 text-dusk-400" />
          <h1 className="text-mist-100 font-serif text-2xl">窗景记录</h1>
        </div>

        <SceneFormFields
          form={form}
          update={update}
          maxTime={maxTime}
          timeError={timeError}
          timeExtra={
            <button
              type="button"
              title="回到当前时间"
              onClick={() => {
                update('timestamp', new Date().toISOString())
                setMaxTime(nowLocalInputValue())
              }}
              className="shrink-0 rounded-xl border border-teal-800 bg-teal-900 p-2 text-mist-300 transition-colors hover:text-dusk-400"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          }
        />

        <div className="flex items-center gap-2 text-mist-400 text-xs">
          <Bus className="w-3 h-3" />
          <span>补记的窗景会按所选时间排入线路时间线</span>
          <span className="text-mist-500">· 当前 {formatTimestamp(new Date().toISOString())}</span>
        </div>

        <button
          type="submit"
          disabled={!!timeError}
          className="w-full py-3 rounded-xl bg-dusk-400 text-teal-950 font-medium text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          保存记录
        </button>
      </form>
    </div>
  )
}
