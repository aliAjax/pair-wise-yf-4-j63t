export type SeatDirection = '左' | '右'

export type Weather = '晴' | '多云' | '阴' | '小雨' | '大雨' | '雪' | '雾'

export type TreeDensity = '稀疏' | '适中' | '茂密'

export type PedestrianStatus = '稀少' | '零星' | '密集'

/** 一次保存前留下的历史版本，字段为当时整条记录的快照 */
export interface SceneVersion {
  /** 版本唯一标识 */
  id: string
  /** 该版本被归档（保存）的时间 */
  savedAt: string
  routeName: string
  segment: string
  seatDirection: SeatDirection
  /** 当时所选的乘车时间 */
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
  /** 历史版本，按保存时间倒序；旧数据可能没有该字段，读取时补全 */
  versions?: SceneVersion[]
}

export interface SceneFormData {
  routeName: string
  segment: string
  seatDirection: SeatDirection
  /** 乘车时间（ISO 字符串），允许补记过去的时间 */
  timestamp: string
  weather: Weather
  signText: string
  treeDensity: TreeDensity
  pedestrianStatus: PedestrianStatus
  note: string
}
