import { useEffect, useState } from 'react'
import {
  Search,
  Route,
  X,
  Trash2,
  Clock,
  MapPin,
  Pencil,
  History,
  RotateCcw,
  Check,
} from 'lucide-react'
import { useSceneStore } from '@/store/useSceneStore'
import {
  formatTimestamp,
  getTimeOfDay,
  getWeatherIcon,
  getTreeIcon,
  getPedestrianIcon,
  nowLocalInputValue,
  isFutureTimestamp,
} from '@/utils/sceneHelpers'
import SceneFormFields from '@/components/SceneFormFields'
import type { WindowScene, SceneFormData, SceneVersion } from '@/types'

const MAX_VERSIONS = 5

function sceneToForm(scene: WindowScene): SceneFormData {
  return {
    routeName: scene.routeName,
    segment: scene.segment,
    seatDirection: scene.seatDirection,
    timestamp: scene.timestamp,
    weather: scene.weather,
    signText: scene.signText,
    treeDensity: scene.treeDensity,
    pedestrianStatus: scene.pedestrianStatus,
    note: scene.note,
  }
}

export default function TimelinePage() {
  const {
    routeNames,
    selectedRoute,
    currentRouteScenes,
    selectRoute,
    loadAll,
    deleteScene,
    updateScene,
    restoreSceneVersion,
  } = useSceneStore()
  const [search, setSearch] = useState('')
  const [detailScene, setDetailScene] = useState<WindowScene | null>(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<SceneFormData | null>(null)
  const [timeError, setTimeError] = useState('')
  const [hint, setHint] = useState('')

  useEffect(() => {
    loadAll()
  }, [loadAll])

  useEffect(() => {
    if (!hint) return
    const timer = setTimeout(() => setHint(''), 2000)
    return () => clearTimeout(timer)
  }, [hint])

  const filteredRoutes = routeNames.filter((r) =>
    r.toLowerCase().includes(search.toLowerCase())
  )

  const sorted = [...currentRouteScenes].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  const openDetail = (scene: WindowScene) => {
    setDetailScene(scene)
    setEditing(false)
    setEditForm(null)
    setTimeError('')
    setHint('')
  }

  const closeDetail = () => {
    setDetailScene(null)
    setEditing(false)
    setEditForm(null)
    setTimeError('')
  }

  const startEdit = () => {
    if (!detailScene) return
    setEditForm(sceneToForm(detailScene))
    setTimeError('')
    setEditing(true)
  }

  const updateEdit = <K extends keyof SceneFormData>(key: K, val: SceneFormData[K]) => {
    setEditForm((prev) => (prev ? { ...prev, [key]: val } : prev))
    if (key === 'timestamp') {
      setTimeError(
        typeof val === 'string' && val && isFutureTimestamp(val)
          ? '乘车时间不能在未来，请选择当前或过去的时间'
          : ''
      )
    }
  }

  const handleSaveEdit = () => {
    if (!detailScene || !editForm) return
    if (!editForm.timestamp || isFutureTimestamp(editForm.timestamp)) {
      setTimeError('乘车时间不能在未来，请选择当前或过去的时间')
      return
    }
    const updated = updateScene(detailScene.id, editForm)
    if (updated) {
      setDetailScene(updated)
      setEditing(false)
      setEditForm(null)
      setHint('已保存，上一版已存入历史版本')
    }
  }

  const handleRestore = (version: SceneVersion) => {
    if (!detailScene) return
    const restored = restoreSceneVersion(detailScene.id, version.id)
    if (restored) {
      setDetailScene(restored)
      setHint('已恢复该版本，恢复前的内容也存入了历史版本')
    }
  }

  const handleDelete = () => {
    if (!detailScene) return
    deleteScene(detailScene.id)
    closeDetail()
  }

  return (
    <div className="min-h-screen bg-teal-950 font-serif text-mist-100">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold tracking-wide text-dusk-400">
          窗景时间线
        </h1>

        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-mist-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索路线..."
              className="w-full rounded-lg border border-teal-800 bg-teal-900/60 py-2.5 pl-10 pr-4 text-sm text-mist-100 placeholder:text-mist-500 focus:border-dusk-400 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => selectRoute('')}
              className={`rounded-full px-3.5 py-1.5 text-xs transition-colors ${
                !selectedRoute
                  ? 'bg-dusk-400 text-teal-950'
                  : 'bg-teal-900 text-mist-300 hover:bg-teal-800'
              }`}
            >
              全部
            </button>
            {filteredRoutes.map((name) => (
              <button
                key={name}
                onClick={() => selectRoute(name)}
                className={`rounded-full px-3.5 py-1.5 text-xs transition-colors ${
                  selectedRoute === name
                    ? 'bg-dusk-400 text-teal-950'
                    : 'bg-teal-900 text-mist-300 hover:bg-teal-800'
                }`}
              >
                <Route className="mr-1 inline w-3 h-3" />
                {name}
              </button>
            ))}
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-mist-400">
            <div className="mb-4 text-6xl opacity-30">🪟</div>
            <p className="text-lg">
              {selectedRoute ? '该路线暂无窗景记录' : '选择一条路线，开始浏览窗景'}
            </p>
          </div>
        ) : (
          <div className="relative pl-8">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-teal-800" />
            <div className="space-y-6">
              {sorted.map((scene) => (
                <div key={scene.id} className="relative flex gap-4">
                  <div className="absolute -left-5 top-1 h-2.5 w-2.5 rounded-full bg-dusk-400 ring-4 ring-teal-950" />
                  <div className="w-20 shrink-0 pt-0.5 text-right">
                    <p className="text-xs text-dusk-400">
                      {formatTimestamp(scene.timestamp)}
                    </p>
                    <p className="mt-0.5 text-[10px] text-mist-500">
                      {getTimeOfDay(scene.timestamp)}
                    </p>
                  </div>
                  <button
                    onClick={() => openDetail(scene)}
                    className="group flex-1 rounded-xl border border-teal-800 bg-teal-900/50 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-dusk-400/40 hover:shadow-lg hover:shadow-dusk-400/10"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {getWeatherIcon(scene.weather)}
                      <span className="text-sm font-semibold text-mist-100">
                        {scene.segment}
                      </span>
                      {scene.versions && scene.versions.length > 0 && (
                        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-teal-800/60 px-2 py-0.5 text-[10px] text-mist-400">
                          <History className="w-3 h-3" />
                          {scene.versions.length}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mb-1.5 text-mist-400">
                      <MapPin className="w-3 h-3" />
                      <span className="text-xs">{scene.routeName}</span>
                      <span className="mx-1 text-teal-700">·</span>
                      <span className="text-xs">{scene.seatDirection}侧</span>
                    </div>
                    {scene.note && (
                      <p className="text-xs text-mist-400 line-clamp-2">
                        {scene.note}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      {getTreeIcon(scene.treeDensity)}
                      {getPedestrianIcon(scene.pedestrianStatus)}
                      {scene.signText && (
                        <span className="rounded bg-teal-800/60 px-1.5 py-0.5 text-[10px] text-mist-300">
                          {scene.signText}
                        </span>
                      )}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {detailScene && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={closeDetail}
        >
          <div
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in rounded-2xl border border-teal-700 bg-teal-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeDetail}
              className="absolute right-4 top-4 text-mist-400 hover:text-mist-100 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {hint && (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-dusk-400/15 px-3 py-2 text-xs text-dusk-300">
                <Check className="w-3.5 h-3.5 shrink-0" />
                {hint}
              </div>
            )}

            {editing && editForm ? (
              <div className="space-y-5 pt-1">
                <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-dusk-400">
                  <Pencil className="w-5 h-5" />
                  修改窗景
                </h2>
                <SceneFormFields
                  form={editForm}
                  update={updateEdit}
                  maxTime={nowLocalInputValue()}
                  timeError={timeError}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditing(false)
                      setEditForm(null)
                      setTimeError('')
                    }}
                    className="flex-1 rounded-lg border border-teal-700 py-2.5 text-sm text-mist-300 transition-colors hover:bg-teal-800"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={!!timeError}
                    className="flex-1 rounded-lg bg-dusk-400 py-2.5 text-sm font-medium text-teal-950 transition-colors hover:bg-dusk-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    保存修改
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center gap-3 pr-8">
                  {getWeatherIcon(detailScene.weather)}
                  <h2 className="text-xl font-bold text-dusk-400">{detailScene.segment}</h2>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-mist-300">
                    <MapPin className="w-4 h-4 text-dusk-400" />
                    <span>{detailScene.routeName}</span>
                    <span className="text-teal-600">·</span>
                    <span>{detailScene.seatDirection}侧</span>
                  </div>
                  <div className="flex items-center gap-2 text-mist-300">
                    <Clock className="w-4 h-4 text-dusk-400" />
                    <span>{formatTimestamp(detailScene.timestamp)}</span>
                    <span className="text-teal-600">·</span>
                    <span>{getTimeOfDay(detailScene.timestamp)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-mist-300">
                    {getTreeIcon(detailScene.treeDensity)}
                    <span>{detailScene.treeDensity}</span>
                    {getPedestrianIcon(detailScene.pedestrianStatus)}
                    <span>{detailScene.pedestrianStatus}</span>
                  </div>
                  {detailScene.signText && (
                    <div className="rounded-lg bg-teal-800/50 px-3 py-2 text-mist-200">
                      招牌: {detailScene.signText}
                    </div>
                  )}
                  {detailScene.note && (
                    <div className="rounded-lg border border-teal-800 px-3 py-2 text-mist-300">
                      {detailScene.note}
                    </div>
                  )}
                </div>

                <div className="mt-5 flex gap-2">
                  <button
                    onClick={startEdit}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-dusk-400/15 py-2.5 text-sm text-dusk-300 transition-colors hover:bg-dusk-400/25"
                  >
                    <Pencil className="w-4 h-4" />
                    修改窗景
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center justify-center gap-2 rounded-lg bg-red-900/40 px-4 py-2.5 text-sm text-red-300 transition-colors hover:bg-red-900/60"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-5 border-t border-teal-800 pt-4">
                  <h3 className="mb-2 flex items-center gap-2 text-xs text-mist-400">
                    <History className="w-3.5 h-3.5" />
                    历史版本（{detailScene.versions?.length ?? 0}/{MAX_VERSIONS}）
                    <span className="text-mist-500">每次保存自动留存上一版</span>
                  </h3>
                  {detailScene.versions && detailScene.versions.length > 0 ? (
                    <ul className="space-y-2">
                      {detailScene.versions.map((version) => (
                        <li
                          key={version.id}
                          className="flex items-start gap-3 rounded-lg border border-teal-800 bg-teal-950/50 p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] text-mist-500">
                              保存于 {formatTimestamp(version.savedAt)}
                            </p>
                            <p className="mt-0.5 text-xs text-dusk-300">
                              {formatTimestamp(version.timestamp)} · {version.segment}
                            </p>
                            {version.note && (
                              <p className="mt-1 line-clamp-2 text-xs text-mist-400">
                                {version.note}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRestore(version)}
                            title="恢复此版本"
                            className="flex shrink-0 items-center gap-1 rounded-lg border border-teal-700 px-2.5 py-1.5 text-xs text-mist-300 transition-colors hover:border-dusk-400 hover:text-dusk-300"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            恢复
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-mist-500">暂无历史版本</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
