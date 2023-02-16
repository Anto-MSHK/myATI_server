import { byWeek } from '../../models/eduStructure/Lesson/Lesson.types'

export type BT_addLesson = {
  count: number
  time: { from: string; to: string }
  day_id: string
  data?: { topWeek: byWeek; lowerWeek?: byWeek }
  special?: string
}
