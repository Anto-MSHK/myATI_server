import { Document } from 'mongoose'
import { ObjectId } from 'mongodb'

export type byWeek = {
  subject_id: ObjectId | undefined
  type?: string
  teacher_id: ObjectId | undefined
  cabinet_id?: ObjectId | undefined
}

export interface ILesson {
  count: string
  time?: { from: string; to: string }
  day_id: string
  data?: {
    topWeek: byWeek
    lowerWeek?: byWeek
  }
  special?: string
}

export interface ILessonDocument extends ILesson, Document {}
