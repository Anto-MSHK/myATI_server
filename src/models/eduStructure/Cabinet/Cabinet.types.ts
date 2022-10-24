import { Document } from 'mongoose'
export interface ICabinet {
  item: string
}

export interface ICabinetDocument extends ICabinet, Document {}
