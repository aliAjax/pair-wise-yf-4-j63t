export type SeatDirection = '左' | '右'

export type Weather = '晴' | '多云' | '阴' | '小雨' | '大雨' | '雪' | '雾'

export type TreeDensity = '稀疏' | '适中' | '茂密'

export type PedestrianStatus = '稀少' | '零星' | '密集'

/** 一次保存前留存下来的历史版本快照 */
export interface SceneVersion {
  id: string
  /** 该版本被保存（成为历史）的时间 */
  savedAt: string
  routeName: string
  segment: string
  seatDirection: SeatDirection
  /** 该版本记录的乘车时间 */
  timestamp: string
  weather: Weather
  signText: string
  treeDensity: TreeDensity
  pedestrianStatus: PedestrianStatus
  note: string
}

export interface WindowScene {
  id: string
  routeName: string
  segment: string
  seatDirection: SeatDirection
  timestamp: string
  weather: Weather
  signText: string
  treeDensity: TreeDensity
  pedestrianStatus: PedestrianStatus
  note: string
  /** 历史版本，按时间从新到旧排列，最多 5 版；旧数据没有该字段时按空数组处理 */
  versions?: SceneVersion[]
}

export interface SceneFormData {
  routeName: string
  segment: string
  seatDirection: SeatDirection
  /** 乘车时间（ISO 字符串），可用于补记过去的时间 */
  timestamp: string
  weather: Weather
  signText: string
  treeDensity: TreeDensity
  pedestrianStatus: PedestrianStatus
  note: string
}
