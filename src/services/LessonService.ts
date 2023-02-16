import Lesson from '../models/eduStructure/Lesson/Lesson.model'
import { byWeek } from '../models/eduStructure/Lesson/Lesson.types'
import { errorsMSG } from '../exceptions/API/errorsConst'
import { ApiError } from '../exceptions/API/api-error'
import { ObjectId } from 'mongodb'
import { times } from '../routes/scheduleRouter/schedule.types'
class LessonService {
  addLesson = async (
    count: number,
    day_id: string,
    data?: { topWeek: byWeek; lowerWeek?: byWeek },
    time?: { from: string; to: string },
    special?: string
  ) => {
    const candidate = await Lesson.findOne({ day_id, count })

    if (candidate) {
      throw ApiError.INVALID_DATA(errorsMSG.OCCUPIED)
    }

    const lesson = new Lesson({
      count,
      time,
      day_id,
      data,
      special,
    })

    await lesson.save()
    //!
    data && !data.lowerWeek?.subject_id && (await lesson.updateOne({ $unset: { 'data.lowerWeek': 1 } }))
  }

  changeLesson = async (
    id: ObjectId,
    body: {
      count?: number
      data?: { topWeek: byWeek; lowerWeek?: byWeek }
      time?: { from: string; to: string }
      special?: string
    }
  ) => {
    if (!id) {
      throw ApiError.INVALID_REQUEST(errorsMSG.QUERY_NO_EMPTY)
    }

    if (!body) {
      throw ApiError.INVALID_REQUEST(errorsMSG.INCORRECT)
    }

    const candidate = await Lesson.findOne({ _id: new ObjectId(id) })

    if (!candidate) {
      throw ApiError.INVALID_REQUEST(errorsMSG.INCORRECT)
    }

    if (body.count) {
      body.time = times[body.count]
    }

    await candidate.updateOne(body)

    return { result: candidate }
  }

  deleteLesson = async (id: ObjectId) => {
    if (id) await Lesson.deleteOne({ _id: id })
  }
}
export default new LessonService()
