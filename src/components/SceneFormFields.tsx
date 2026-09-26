import {
  Bus,
  MapPin,
  Armchair,
  Clock,
  CloudSun,
  Signpost,
  TreePine,
  Users,
  FileText,
} from 'lucide-react'
import {
  getWeatherIcon,
  getTreeIcon,
  getPedestrianIcon,
  toLocalInputValue,
  localInputToIso,
} from '@/utils/sceneHelpers'
import type {
  SceneFormData,
  Weather,
  TreeDensity,
  PedestrianStatus,
  SeatDirection,
} from '@/types'

const WEATHERS: Weather[] = ['晴', '多云', '阴', '小雨', '大雨', '雪', '雾']
const TREES: TreeDensity[] = ['稀疏', '适中', '茂密']
const PEDESTRIANS: PedestrianStatus[] = ['稀少', '零星', '密集']

interface SceneFormFieldsProps {
  form: SceneFormData
  update: <K extends keyof SceneFormData>(key: K, val: SceneFormData[K]) => void
  /** datetime-local 的最大值（本地时间），用于拦截未来的乘车时间 */
  maxTime?: string
  /** 乘车时间校验错误提示 */
  timeError?: string
  /** 时间字段旁的附加内容（如「回到当前」按钮） */
  timeExtra?: React.ReactNode
}

export default function SceneFormFields({
  form,
  update,
  maxTime,
  timeError,
  timeExtra,
}: SceneFormFieldsProps) {
  const timeValue = form.timestamp ? toLocalInputValue(new Date(form.timestamp)) : ''

  const handleTimeChange = (value: string) => {
    const iso = localInputToIso(value)
    // 无效输入时保留空串，由 required 校验拦截
    update('timestamp', iso ?? '')
  }

  const inputClass =
    'w-full bg-teal-850 text-mist-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-dusk-400 [color-scheme:dark]'

  return (
    <>
      <section className="space-y-3">
        <h2 className="text-dusk-400 font-serif text-lg flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          路线信息
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-mist-300 text-xs mb-1 flex items-center gap-1">
              <Bus className="w-3 h-3" />
              线路
            </label>
            <input
              className={inputClass}
              value={form.routeName}
              onChange={(e) => update('routeName', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-mist-300 text-xs mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              区间
            </label>
            <input
              className={inputClass}
              value={form.segment}
              onChange={(e) => update('segment', e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <label className="text-mist-300 text-xs mb-1 flex items-center gap-1">
            <Armchair className="w-3 h-3" />
            座位方向
          </label>
          <div className="flex gap-2">
            {(['左', '右'] as SeatDirection[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => update('seatDirection', d)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
                  form.seatDirection === d
                    ? 'bg-dusk-400/20 text-dusk-400 border border-dusk-400'
                    : 'bg-teal-850 text-mist-300 border border-transparent'
                }`}
              >
                {d}侧
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-mist-300 text-xs mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            乘车时间
            <span className="text-mist-500 font-normal">（可补记过去的时间）</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="datetime-local"
              className={`${inputClass} flex-1 ${timeError ? 'ring-1 ring-red-400' : ''}`}
              value={timeValue}
              max={maxTime}
              onChange={(e) => handleTimeChange(e.target.value)}
              required
            />
            {timeExtra}
          </div>
          {timeError ? (
            <p className="mt-1 text-xs text-red-400">{timeError}</p>
          ) : (
            <p className="mt-1 text-[11px] text-mist-500">
              按所选时间排入对应线路的时间线，不能选择未来的时间
            </p>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-dusk-400 font-serif text-lg flex items-center gap-2">
          <CloudSun className="w-4 h-4" />
          窗景信息
        </h2>
        <div>
          <label className="text-mist-300 text-xs mb-1 block">天气</label>
          <div className="grid grid-cols-4 gap-2">
            {WEATHERS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => update('weather', w)}
                className={`flex flex-col items-center gap-1 py-2 rounded-xl text-xs transition ${
                  form.weather === w
                    ? 'bg-dusk-400/20 border border-dusk-400 text-dusk-400'
                    : 'bg-teal-850 border border-transparent text-mist-300'
                }`}
              >
                {getWeatherIcon(w)}
                {w}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-mist-300 text-xs mb-1 flex items-center gap-1">
            <Signpost className="w-3 h-3" />
            招牌文字
          </label>
          <input
            className={inputClass}
            value={form.signText}
            onChange={(e) => update('signText', e.target.value)}
          />
        </div>
        <div>
          <label className="text-mist-300 text-xs mb-1 flex items-center gap-1">
            <TreePine className="w-3 h-3" />
            树木密度
          </label>
          <div className="grid grid-cols-3 gap-2">
            {TREES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => update('treeDensity', t)}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs transition ${
                  form.treeDensity === t
                    ? 'bg-dusk-400/20 border border-dusk-400 text-dusk-400'
                    : 'bg-teal-850 border border-transparent text-mist-300'
                }`}
              >
                {getTreeIcon(t)}
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-mist-300 text-xs mb-1 flex items-center gap-1">
            <Users className="w-3 h-3" />
            行人状态
          </label>
          <div className="grid grid-cols-3 gap-2">
            {PEDESTRIANS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => update('pedestrianStatus', p)}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs transition ${
                  form.pedestrianStatus === p
                    ? 'bg-dusk-400/20 border border-dusk-400 text-dusk-400'
                    : 'bg-teal-850 border border-transparent text-mist-300'
                }`}
              >
                {getPedestrianIcon(p)}
                {p}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-dusk-400 font-serif text-lg flex items-center gap-2">
          <FileText className="w-4 h-4" />
          观察笔记
        </h2>
        <textarea
          className={`${inputClass} resize-none h-24`}
          value={form.note}
          onChange={(e) => update('note', e.target.value)}
        />
      </section>
    </>
  )
}
