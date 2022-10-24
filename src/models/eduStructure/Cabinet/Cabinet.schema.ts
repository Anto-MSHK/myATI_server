import { Schema } from 'mongoose'

const CabinetSchema = new Schema({
  item: { type: String, required: true, unique: true },
})

export default CabinetSchema
