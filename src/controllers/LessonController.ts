import LessonService from '@src/services/LessonService'
import { validationController } from './validationController'
import { RequestHandler } from 'express'
import { RT } from '@src/routes/resTypes'
import { BT_addLesson } from '@src/routes/lessonRouter/lesson.types'

class LessonController {
  addLesson: RequestHandler<Record<string, any>, RT, BT_addLesson> = async (req, res, next) => {
    try {
      validationController(req, res)

      const { count, time, day_id, data } = req.body

      await LessonService.addLesson(count, day_id, data, time)
      return res.json({ status: 'OK' })
    } catch (e) {
      next(e)
    }
  }
}

export default new LessonController()
