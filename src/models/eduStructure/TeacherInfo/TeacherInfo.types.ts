import { Document } from 'mongoose'
export interface ITeacherInfo {
  name: string
  cathedra: string
  photo_url?: string
  degree?: string
  allInfo?: string[]
}

export interface ITeacherInfoDocument extends ITeacherInfo, Document {}
