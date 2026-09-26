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
  Save,
  ChevronLeft,
} from 'lucide-react'
import { useSceneStore } from '@/store/useSceneStore'
import {
  formatTimestamp,
  getTimeOfDay,
  getWeatherIcon,
  getTreeIcon,
  getPedestrianIcon,
} from '@/utils/sceneHelpers'
import { isFutureRideTime } from '@/services/storage'
import SceneFormFields from '@/components/SceneFormFields'
import type { WindowScene, SceneFormData } from '@/types'

type ModalMode = 'view' | 'edit' | 'history'

function toFormData(scene: WindowScene): SceneFormData {
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
    scenes,
  } = useSceneStore()
  const [search, setSearch] = useState('')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [mode, setMode] = useState<ModalMode>('view')
  const [editForm, setEditForm] = useState<SceneFormData | null>(null)
  const [timeError, setTimeError] = useState('')
  const [restoredFlash, setRestoredFlash] = useState(false)

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // 详情始终读取 store 中最新数据，保存/恢复后立即反映
  const detailScene = detailId ? scenes.find((s) => s.id === detailId) ?? null : null

  const filteredRoutes = routeNames.filter((r) =>
    r.toLowerCase().includes(search.toLowerCase())
  )

  const sorted = [...currentRouteScenes].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  const openDetail = (scene: WindowScene) => {
    setDetailId(scene.id)
    setMode('view')
    setEditForm(null)
    setTimeError('')
    setRestoredFlash(false)
  }

  const closeDetail = () => {
    setDetailId(null)
    setMode('view')
    setEditForm(null)
    setTimeError('')
    setRestoredFlash(false)
  }

  const startEdit = () => {
    if (!detailScene) return
    setEditForm(toFormData(detailScene))
    setTimeError('')
    setMode('edit')
  }

  const handleEditChange = <K extends keyof SceneFormData>(
    key: K,
    val: SceneFormData[K]
  ) => {
    setEditForm((prev) => (prev ? { ...prev, [key]: val } : prev))
    if (key === 'timestamp') {
      setTimeError(isFutureRideTime(val as string) ? '乘车时间不能晚于当前时间' : '')
    }
  }

  const handleSaveEdit = () => {
    if (!detailScene || !editForm) return
    if (isFutureRideTime(editForm.timestamp)) {
      setTimeError('乘车时间不能晚于当前时间')
      return
    }
    const ok = updateScene(detailScene.id, editForm)
    if (!ok) {
      setTimeError('乘车时间不能晚于当前时间')
      return
    }
    setMode('view')
    setEditForm(null)
    setTimeError('')
  }

  const handleRestore = (versionId: string) => {
    if (!detailScene) return
    restoreSceneVersion(detailScene.id, versionId)
    setMode('view')
    setRestoredFlash(true)
    setTimeout(() => setRestoredFlash(false), 2500)
  }

  const handleDelete = (id: string) => {
    deleteScene(id)
    closeDetail()
  }

  const versions = detailScene?.versions ?? []

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
                      {(scene.versions?.length ?? 0) > 0 && (
                        <span className="ml-auto inline-flex items-center gap-1 rounded bg-teal-800/60 px-1.5 py-0.5 text-[10px] text-mist-400">
                          <History className="w-2.5 h-2.5" />
                          {scene.versions!.length}版
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={closeDetail}
        >
          <div
            className="relative mx-4 flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-teal-700 bg-teal-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeDetail}
              className="absolute right-4 top-4 z-10 text-mist-400 hover:text-mist-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* 查看模式 */}
            {mode === 'view' && (
              <div className="overflow-y-auto p-6">
                <div className="mb-4 flex items-center gap-3 pr-8">
                  {getWeatherIcon(detailScene.weather)}
                  <h2 className="text-xl font-bold text-dusk-400">
                    {detailScene.segment}
                  </h2>
                </div>

                {restoredFlash && (
                  <div className="mb-3 flex items-center gap-2 rounded-lg bg-dusk-400/15 px-3 py-2 text-xs text-dusk-300">
                    <RotateCcw className="w-3.5 h-3.5" />
                    已恢复所选版本，恢复前的内容已存入历史版本
                  </div>
                )}

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

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button
                    onClick={startEdit}
                    className="flex items-center justify-center gap-2 rounded-lg bg-dusk-400/20 py-2.5 text-sm text-dusk-300 transition-colors hover:bg-dusk-400/30"
                  >
                    <Pencil className="w-4 h-4" />
                    修改窗景
                  </button>
                  <button
                    onClick={() => setMode('history')}
                    className="flex items-center justify-center gap-2 rounded-lg bg-teal-800/60 py-2.5 text-sm text-mist-300 transition-colors hover:bg-teal-800"
                  >
                    <History className="w-4 h-4" />
                    历史版本{versions.length > 0 && ` (${versions.length})`}
                  </button>
                </div>

                <button
                  onClick={() => handleDelete(detailScene.id)}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-red-900/40 py-2.5 text-sm text-red-300 transition-colors hover:bg-red-900/60"
                >
                  <Trash2 className="w-4 h-4" />
                  删除此窗景
                </button>
              </div>
            )}

            {/* 编辑模式 */}
            {mode === 'edit' && editForm && (
              <div className="overflow-y-auto p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Pencil className="w-5 h-5 text-dusk-400" />
                  <h2 className="text-lg font-bold text-dusk-400">修改窗景</h2>
                </div>
                <div className="space-y-5">
                  <SceneFormFields
                    form={editForm}
                    update={handleEditChange}
                    timeError={timeError}
                  />
                </div>
                <div className="mt-5 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setMode('view')
                      setTimeError('')
                    }}
                    className="flex-1 rounded-lg bg-teal-800/60 py-2.5 text-sm text-mist-300 transition-colors hover:bg-teal-800"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="flex flex-[2] items-center justify-center gap-2 rounded-lg bg-dusk-400 py-2.5 text-sm font-medium text-teal-950 transition-colors hover:bg-dusk-300"
                  >
                    <Save className="w-4 h-4" />
                    保存修改
                  </button>
                </div>
                <p className="mt-2 text-center text-[11px] text-mist-500">
                  保存后，当前内容会自动留存为上一版（最多保留 5 版）
                </p>
              </div>
            )}

            {/* 历史版本模式 */}
            {mode === 'history' && (
              <div className="overflow-y-auto p-6">
                <button
                  onClick={() => setMode('view')}
                  className="mb-3 flex items-center gap-1 text-xs text-mist-400 hover:text-mist-200 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  返回详情
                </button>
                <div className="mb-4 flex items-center gap-3">
                  <History className="w-5 h-5 text-dusk-400" />
                  <h2 className="text-lg font-bold text-dusk-400">历史版本</h2>
                </div>

                {versions.length === 0 ? (
                  <p className="py-10 text-center text-sm text-mist-500">
                    还没有历史版本。每次保存修改时，上一版会自动留在这里。
                  </p>
                ) : (
                  <div className="space-y-3">
                    {versions.map((v) => (
                      <div
                        key={v.id}
                        className="rounded-xl border border-teal-800 bg-teal-900/60 p-3"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="flex items-center gap-1 text-xs text-dusk-400">
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(v.savedAt)} 留存
                          </span>
                          <button
                            onClick={() => handleRestore(v.id)}
                            className="flex items-center gap-1 rounded-lg bg-dusk-400/15 px-2.5 py-1 text-xs text-dusk-300 transition-colors hover:bg-dusk-400/25"
                          >
                            <RotateCcw className="w-3 h-3" />
                            恢复
                          </button>
                        </div>
                        <div className="space-y-1 text-xs text-mist-400">
                          <div className="flex items-center gap-1">
                            {getWeatherIcon(v.weather)}
                            <span className="text-mist-200">{v.segment}</span>
                            <span className="text-teal-600">·</span>
                            <span>{v.routeName}</span>
                          </div>
                          <div>乘车时间：{formatTimestamp(v.timestamp)}</div>
                          {v.note && (
                            <p className="line-clamp-2 text-mist-400">{v.note}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    <p className="pt-1 text-center text-[11px] text-mist-500">
                      恢复时，当前内容也会作为一版保留，不会丢失
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
