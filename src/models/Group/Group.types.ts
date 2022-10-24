import { Document } from 'mongoose'
export interface IGroup {
  name: string
  faculty: 'FVO' | 'SPO'
  messages_id?: string[]
}

export interface IGroupDocument extends IGroup, Document {}
