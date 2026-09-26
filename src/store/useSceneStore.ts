import { create } from 'zustand'
import type { WindowScene, SceneFormData } from '@/types'
import {
  getAllScenes,
  addScene,
  updateScene as storageUpdateScene,
  restoreSceneVersion as storageRestoreSceneVersion,
  deleteScene as storageDeleteScene,
  getScenesByRoute,
  getAllRouteNames,
  getRandomScene,
  isFutureRideTime,
} from '@/services/storage'

/** 保存成功；false 表示乘车时间在未来，被拦下 */
type SaveResult = boolean

interface SceneState {
  scenes: WindowScene[]
  routeNames: string[]
  currentRouteScenes: WindowScene[]
  selectedRoute: string
  randomScene: WindowScene | null

  loadAll: () => void
  saveScene: (data: SceneFormData) => SaveResult
  updateScene: (id: string, data: SceneFormData) => SaveResult
  restoreSceneVersion: (id: string, versionId: string) => void
  deleteScene: (id: string) => void
  selectRoute: (routeName: string) => void
  refreshRandom: () => void
}

function refreshAfterWrite(selectedRoute: string) {
  const scenes = getAllScenes()
  const routeNames = getAllRouteNames()
  const currentRouteScenes = selectedRoute ? getScenesByRoute(selectedRoute) : []
  return { scenes, routeNames, currentRouteScenes }
}

export const useSceneStore = create<SceneState>((set) => ({
  scenes: [],
  routeNames: [],
  currentRouteScenes: [],
  selectedRoute: '',
  randomScene: null,

  loadAll: () => {
    const scenes = getAllScenes()
    const routeNames = getAllRouteNames()
    set({ scenes, routeNames })
  },

  saveScene: (data) => {
    if (isFutureRideTime(data.timestamp)) return false
    addScene(data)
    set((state) => refreshAfterWrite(state.selectedRoute))
    return true
  },

  updateScene: (id, data) => {
    if (isFutureRideTime(data.timestamp)) return false
    storageUpdateScene(id, data)
    set((state) => refreshAfterWrite(state.selectedRoute))
    return true
  },

  restoreSceneVersion: (id, versionId) => {
    storageRestoreSceneVersion(id, versionId)
    set((state) => refreshAfterWrite(state.selectedRoute))
  },

  deleteScene: (id) => {
    storageDeleteScene(id)
    set((state) => refreshAfterWrite(state.selectedRoute))
  },

  selectRoute: (routeName: string) => {
    const currentRouteScenes = routeName ? getScenesByRoute(routeName) : []
    set({ selectedRoute: routeName, currentRouteScenes })
  },

  refreshRandom: () => {
    const randomScene = getRandomScene()
    set({ randomScene })
  },
}))
