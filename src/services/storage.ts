import type { WindowScene, SceneFormData, SceneVersion } from '@/types'

const STORAGE_KEY = 'bus_window_scenes'

/** 一条记录最多保留的历史版本数 */
export const MAX_VERSIONS = 5

/** 判断乘车时间是否在未来；留 1 分钟余量，避免时钟边界误判 */
export function isFutureRideTime(timestamp: string, now: Date = new Date()): boolean {
  const t = new Date(timestamp).getTime()
  if (Number.isNaN(t)) return true
  return t > now.getTime() + 60 * 1000
}

/** 取可编辑字段的快照，用于保存历史版本 */
function snapshot(data: SceneFormData, savedAt: string): SceneVersion {
  return {
    id: crypto.randomUUID(),
    savedAt,
    routeName: data.routeName,
    segment: data.segment,
    seatDirection: data.seatDirection,
    timestamp: data.timestamp,
    weather: data.weather,
    signText: data.signText,
    treeDensity: data.treeDensity,
    pedestrianStatus: data.pedestrianStatus,
    note: data.note,
  }
}

/** 比较两次填写的内容是否一致（不含版本元信息） */
function sameContent(a: SceneFormData, b: SceneFormData): boolean {
  return (
    a.routeName === b.routeName &&
    a.segment === b.segment &&
    a.seatDirection === b.seatDirection &&
    a.timestamp === b.timestamp &&
    a.weather === b.weather &&
    a.signText === b.signText &&
    a.treeDensity === b.treeDensity &&
    a.pedestrianStatus === b.pedestrianStatus &&
    a.note === b.note
  )
}

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

function normalize(raw: unknown): WindowScene | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  if (typeof s.id !== 'string' || typeof s.timestamp !== 'string') return null
  const scene: WindowScene = {
    id: s.id,
    routeName: typeof s.routeName === 'string' ? s.routeName : '',
    segment: typeof s.segment === 'string' ? s.segment : '',
    seatDirection: s.seatDirection === '右' ? '右' : '左',
    timestamp: s.timestamp,
    weather: typeof s.weather === 'string' ? (s.weather as WindowScene['weather']) : '晴',
    signText: typeof s.signText === 'string' ? s.signText : '',
    treeDensity:
      typeof s.treeDensity === 'string' ? (s.treeDensity as WindowScene['treeDensity']) : '适中',
    pedestrianStatus:
      typeof s.pedestrianStatus === 'string'
        ? (s.pedestrianStatus as WindowScene['pedestrianStatus'])
        : '稀少',
    note: typeof s.note === 'string' ? s.note : '',
    versions: Array.isArray(s.versions)
      ? (s.versions as Array<Partial<SceneVersion>>)
          .filter((v) => v && typeof v.savedAt === 'string')
          .map((v) => ({
            id: typeof v.id === 'string' ? v.id : crypto.randomUUID(),
            savedAt: v.savedAt as string,
            routeName: typeof v.routeName === 'string' ? v.routeName : '',
            segment: typeof v.segment === 'string' ? v.segment : '',
            seatDirection: v.seatDirection === '右' ? '右' : '左',
            timestamp: typeof v.timestamp === 'string' ? v.timestamp : (s.timestamp as string),
            weather:
              typeof v.weather === 'string'
                ? (v.weather as SceneVersion['weather'])
                : '晴',
            signText: typeof v.signText === 'string' ? v.signText : '',
            treeDensity:
              typeof v.treeDensity === 'string'
                ? (v.treeDensity as SceneVersion['treeDensity'])
                : '适中',
            pedestrianStatus:
              typeof v.pedestrianStatus === 'string'
                ? (v.pedestrianStatus as SceneVersion['pedestrianStatus'])
                : '稀少',
            note: typeof v.note === 'string' ? v.note : '',
          }))
      : [],
  }
  return scene
}

export function getAllScenes(): WindowScene[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map(normalize)
      .filter((s): s is WindowScene => s !== null)
      .map((s) => ({
        ...s,
        // 旧数据补全 versions，并保证不超过上限、按保存时间倒序
        versions: (s.versions ?? [])
          .slice()
          .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
          .slice(0, MAX_VERSIONS),
      }))
  } catch {
    return []
  }
}

function persist(scenes: WindowScene[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenes))
}

export function addScene(data: SceneFormData): WindowScene {
  const scene: WindowScene = {
    ...data,
    id: crypto.randomUUID(),
    versions: [],
  }
  const scenes = getAllScenes()
  scenes.push(scene)
  persist(scenes)
  return scene
}

/**
 * 编辑保存：把当前内容作为上一版存入版本列表（倒序、最多 5 版，超出去掉最早），
 * 再写入新内容。内容未变化时不产生新版本。
 */
export function updateScene(id: string, data: SceneFormData): WindowScene | null {
  const scenes = getAllScenes()
  const idx = scenes.findIndex((s) => s.id === id)
  if (idx === -1) return null

  const existing = scenes[idx]
  let versions = existing.versions ?? []
  if (!sameContent(toFormData(existing), data)) {
    // 新版本放在最前，超出上限时去掉末尾（最早）的版本
    versions = [snapshot(toFormData(existing), new Date().toISOString()), ...versions].slice(
      0,
      MAX_VERSIONS
    )
  }

  const updated: WindowScene = { ...existing, ...data, versions }
  scenes[idx] = updated
  persist(scenes)
  return updated
}

/**
 * 恢复历史版本：当前内容先作为一版留下（不能被直接覆盖），
 * 然后用所选版本的内容覆盖当前内容；被恢复的版本从历史列表中移除。
 */
export function restoreSceneVersion(
  id: string,
  versionId: string
): WindowScene | null {
  const scenes = getAllScenes()
  const idx = scenes.findIndex((s) => s.id === id)
  if (idx === -1) return null

  const existing = scenes[idx]
  const versions = existing.versions ?? []
  const targetIdx = versions.findIndex((v) => v.id === versionId)
  if (targetIdx === -1) return null

  const target = versions[targetIdx]
  const now = new Date().toISOString()
  const rest = versions.filter((v) => v.id !== versionId)

  // 当前内容也存档（放在最前），连同其余历史版本一起裁剪到上限
  const nextVersions = [snapshot(toFormData(existing), now), ...rest].slice(
    0,
    MAX_VERSIONS
  )

  const restored: WindowScene = {
    ...existing,
    routeName: target.routeName,
    segment: target.segment,
    seatDirection: target.seatDirection,
    timestamp: target.timestamp,
    weather: target.weather,
    signText: target.signText,
    treeDensity: target.treeDensity,
    pedestrianStatus: target.pedestrianStatus,
    note: target.note,
    versions: nextVersions,
  }
  scenes[idx] = restored
  persist(scenes)
  return restored
}

/** 删除整条记录，版本随记录一并清除 */
export function deleteScene(id: string): void {
  const scenes = getAllScenes().filter((s) => s.id !== id)
  persist(scenes)
}

export function getScenesByRoute(routeName: string): WindowScene[] {
  return getAllScenes()
    .filter((s) => s.routeName === routeName)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export function getAllRouteNames(): string[] {
  const scenes = getAllScenes()
  const routeSet = new Set(scenes.map((s) => s.routeName))
  return Array.from(routeSet).sort()
}

export function getRandomScene(): WindowScene | null {
  const scenes = getAllScenes()
  if (scenes.length === 0) return null
  return scenes[Math.floor(Math.random() * scenes.length)]
}
