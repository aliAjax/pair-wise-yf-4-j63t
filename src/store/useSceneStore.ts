import { create } from 'zustand'
import type { WindowScene, SceneFormData } from '@/types'
import {
  getAllScenes,
  saveScene as storageSaveScene,
  updateScene as storageUpdateScene,
  restoreSceneVersion as storageRestoreSceneVersion,
  deleteScene as storageDeleteScene,
  getScenesByRoute,
  getAllRouteNames,
  getRandomScene,
} from '@/services/storage'

interface SceneState {
  scenes: WindowScene[]
  routeNames: string[]
  currentRouteScenes: WindowScene[]
  selectedRoute: string
  randomScene: WindowScene | null

  loadAll: () => void
  saveScene: (data: SceneFormData) => void
  updateScene: (id: string, data: SceneFormData) => WindowScene | null
  restoreSceneVersion: (id: string, versionId: string) => WindowScene | null
  deleteScene: (id: string) => void
  selectRoute: (routeName: string) => void
  refreshRandom: () => void
}

export const useSceneStore = create<SceneState>((set, get) => ({
  scenes: [],
  routeNames: [],
  currentRouteScenes: [],
  selectedRoute: '',
  randomScene: null,

  loadAll: () => {
    const scenes = getAllScenes()
    const routeNames = getAllRouteNames()
    const { selectedRoute } = get()
    set({
      scenes,
      routeNames,
      currentRouteScenes: selectedRoute ? getScenesByRoute(selectedRoute) : [],
    })
  },

  saveScene: (data) => {
    const scene: WindowScene = {
      ...data,
      id: crypto.randomUUID(),
      versions: [],
    }
    storageSaveScene(scene)
    const scenes = getAllScenes()
    const routeNames = getAllRouteNames()
    set((state) => ({
      scenes,
      routeNames,
      currentRouteScenes: state.selectedRoute
        ? getScenesByRoute(state.selectedRoute)
        : [],
    }))
  },

  updateScene: (id, data) => {
    const updated = storageUpdateScene(id, data)
    if (updated) {
      const scenes = getAllScenes()
      const routeNames = getAllRouteNames()
      set((state) => ({
        scenes,
        routeNames,
        currentRouteScenes: state.selectedRoute
          ? getScenesByRoute(state.selectedRoute)
          : [],
      }))
    }
    return updated
  },

  restoreSceneVersion: (id, versionId) => {
    const restored = storageRestoreSceneVersion(id, versionId)
    if (restored) {
      const scenes = getAllScenes()
      const routeNames = getAllRouteNames()
      set((state) => ({
        scenes,
        routeNames,
        currentRouteScenes: state.selectedRoute
          ? getScenesByRoute(state.selectedRoute)
          : [],
      }))
    }
    return restored
  },

  deleteScene: (id) => {
    storageDeleteScene(id)
    const scenes = getAllScenes()
    const routeNames = getAllRouteNames()
    set((state) => ({
      scenes,
      routeNames,
      currentRouteScenes: state.selectedRoute
        ? getScenesByRoute(state.selectedRoute)
        : [],
    }))
  },

  selectRoute: (routeName) => {
    const currentRouteScenes = routeName ? getScenesByRoute(routeName) : []
    set({ selectedRoute: routeName, currentRouteScenes })
  },

  refreshRandom: () => {
    const randomScene = getRandomScene()
    set({ randomScene })
  },
}))
