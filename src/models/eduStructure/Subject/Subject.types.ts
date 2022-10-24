import { Document } from 'mongoose'
export interface ISubject {
  title: string
  types?: string[]
  cabinets_id?: string[]
}

export interface ISubjectDocument extends ISubject, Document {}
