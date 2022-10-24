import { Document } from 'mongoose'
export interface IDay {
  dayOfWeek: '0' | '1' | '2' | '3' | '4' | '5'
  isWeekend: boolean
  group_id?: string
}

export interface IDayDocument extends IDay, Document {}
