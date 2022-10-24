import Lesson from '@src/models/eduStructure/Lesson/Lesson.model'
import { byWeek } from '@src/models/eduStructure/Lesson/Lesson.types'
import { errorsMSG } from '../exceptions/API/errorsConst'
import { ApiError } from '../exceptions/API/api-error'
import { ObjectId } from 'mongodb'
class LessonService {
  addLesson = async (
    count: number,
    day_id: string,
    data: { topWeek: byWeek; lowerWeek?: byWeek },
    time?: { from: string; to: string }
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
    })

    await lesson.save()
    //!
    !data.lowerWeek?.subject_id && (await lesson.updateOne({ $unset: { 'data.lowerWeek': 1 } }))
  }

  deleteLessons = async (day_id: ObjectId) => {
    if (day_id) await Lesson.deleteMany({ day_id })
  }
}
export default new LessonService()
