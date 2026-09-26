import type { WindowScene, SceneFormData, SceneVersion } from '@/types'

const STORAGE_KEY = 'bus_window_scenes'
const MAX_VERSIONS = 5

/** 参与版本对比/快照的可编辑字段（不含 id） */
const EDITABLE_KEYS = [
  'routeName',
  'segment',
  'seatDirection',
  'timestamp',
  'weather',
  'signText',
  'treeDensity',
  'pedestrianStatus',
  'note',
] as const

function normalize(scene: WindowScene): WindowScene {
  // 旧数据没有 versions 字段，打开后补为空数组，其余照常显示
  return { ...scene, versions: Array.isArray(scene.versions) ? scene.versions : [] }
}

function readAll(): WindowScene[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as WindowScene[]
    return Array.isArray(parsed) ? parsed.map(normalize) : []
  } catch {
    return []
  }
}

function writeAll(scenes: WindowScene[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenes))
}

export function getAllScenes(): WindowScene[] {
  return readAll()
}

export function saveScene(scene: WindowScene): void {
  const scenes = readAll()
  scenes.push(normalize(scene))
  writeAll(scenes)
}

/** 判断两个版本的可编辑内容是否完全一致（用于跳过无改动的保存） */
function isSameContent(a: Pick<WindowScene, (typeof EDITABLE_KEYS)[number]>, b: WindowScene): boolean {
  return EDITABLE_KEYS.every((key) => a[key] === b[key])
}

/** 把某条窗景当前内容存成一个历史版本，最多保留 MAX_VERSIONS 版（超出删最早） */
function toVersion(scene: WindowScene, savedAt: string): SceneVersion {
  return {
    id: crypto.randomUUID(),
    savedAt,
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

/**
 * 编辑保存：先用当前内容生成一版历史，再写入新内容。
 * 内容无变化时不新增版本。返回更新后的记录（记录不存在时返回 null）。
 */
export function updateScene(id: string, data: SceneFormData): WindowScene | null {
  const scenes = readAll()
  const index = scenes.findIndex((s) => s.id === id)
  if (index === -1) return null

  const current = scenes[index]
  let versions = current.versions ?? []
  if (!isSameContent(data, current)) {
    versions = [toVersion(current, new Date().toISOString()), ...versions].slice(0, MAX_VERSIONS)
  }

  const updated: WindowScene = { ...current, ...data, versions }
  scenes[index] = updated
  writeAll(scenes)
  return updated
}

/**
 * 从历史版本恢复：当前内容先存为一版历史（不会直接丢失），
 * 再把所选版本提为当前内容；原版本列表中去掉被恢复的那一条。
 * 返回恢复后的记录（记录或版本不存在时返回 null）。
 */
export function restoreSceneVersion(id: string, versionId: string): WindowScene | null {
  const scenes = readAll()
  const index = scenes.findIndex((s) => s.id === id)
  if (index === -1) return null

  const current = scenes[index]
  const versions = current.versions ?? []
  const targetIndex = versions.findIndex((v) => v.id === versionId)
  if (targetIndex === -1) return null

  const target = versions[targetIndex]
  const rest = versions.filter((v) => v.id !== versionId)
  const newVersions = [toVersion(current, new Date().toISOString()), ...rest].slice(
    0,
    MAX_VERSIONS
  )

  const restored: WindowScene = {
    ...current,
    routeName: target.routeName,
    segment: target.segment,
    seatDirection: target.seatDirection,
    timestamp: target.timestamp,
    weather: target.weather,
    signText: target.signText,
    treeDensity: target.treeDensity,
    pedestrianStatus: target.pedestrianStatus,
    note: target.note,
    versions: newVersions,
  }
  scenes[index] = restored
  writeAll(scenes)
  return restored
}

/** 删除整条记录，其历史版本随之一起清掉 */
export function deleteScene(id: string): void {
  const scenes = readAll().filter((s) => s.id !== id)
  writeAll(scenes)
}

export function getScenesByRoute(routeName: string): WindowScene[] {
  return readAll()
    .filter((s) => s.routeName === routeName)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export function getAllRouteNames(): string[] {
  const scenes = readAll()
  const routeSet = new Set(scenes.map((s) => s.routeName))
  return Array.from(routeSet).sort()
}

export function getRandomScene(): WindowScene | null {
  const scenes = readAll()
  if (scenes.length === 0) return null
  return scenes[Math.floor(Math.random() * scenes.length)]
}
