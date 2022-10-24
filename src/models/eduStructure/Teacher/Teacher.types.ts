import { Document } from 'mongoose'
export interface ITeacher {
  name: string
  degree?: string
  subjects_id?: string[]
}

export interface ITeacherDocument extends ITeacher, Document {}
