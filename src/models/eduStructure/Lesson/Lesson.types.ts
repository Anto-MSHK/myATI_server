import { Document } from 'mongoose'
import { ObjectId } from 'mongodb'

export type byWeek = {
  subject_id: ObjectId
  type?: string
  teacher_id: ObjectId
  cabinet_id?: ObjectId
}

export interface ILesson {
  count: string
  time: { from: string; to: string }
  day_id: string
  data: {
    topWeek: byWeek
    lowerWeek?: byWeek
  }
}

export interface ILessonDocument extends ILesson, Document {}
