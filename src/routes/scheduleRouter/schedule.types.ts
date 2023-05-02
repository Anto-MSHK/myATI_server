import { ObjectId } from 'mongodb'

export type subject = {
  title: string
  type?: string
}

export type teacher = { name: string; degree?: string }

export const timesMonday = [
  { from: '9:15', to: '10:50' },
  { from: '11:00', to: '12:35' },
  { from: '13:05', to: '14:40' },
  { from: '14:50', to: '16:25' },
  { from: '', to: '' },
  { from: '', to: '' },
]

export const times = [
  { from: '8:30', to: '10:05' },
  { from: '10:15', to: '11:50' },
  { from: '12:30', to: '14:05' },
  { from: '14:15', to: '15:50' },
  { from: '16:00', to: '17:35' },
  { from: '17:45', to: '19:20' },
]

//? >-->> byGroup <<--<
export type lessonDataG =
  | {
      subject: subject
      teacher: teacher
      cabinet: string
    }
  | undefined
  | 'none'
export type dayG = {
  dayOfWeek: '0' | '1' | '2' | '3' | '4' | '5'
  isWeekend: boolean
  lessons: (lessonG | undefined)[]
}
export type lessonG = {
  id: ObjectId
  count: string
  time: { from: string; to: string }
  data?: {
    topWeek: lessonDataG
    lowerWeek?: lessonDataG | 'none'
  }
  special?: string
}

//? >-->> byTeacher <<--<

export type lessonDataT =
  | {
      subject: subject
      cabinet: string
      groups: string[]
    }
  | undefined

export type lessonT = {
  id: ObjectId
  count: string
  time: { from: string; to: string }
  data: {
    topWeek?: lessonDataT
    lowerWeek?: lessonDataT
  }
}
export type dayT = {
  dayOfWeek: string
  lessons: (lessonT | undefined)[]
}

export type QT_getScheduleByGroup = {
  name: string
}

export type QT_getScheduleByTeacher = {
  name: string
}
