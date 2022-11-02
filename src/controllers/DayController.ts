import LessonService from '@src/services/LessonService'
import { validationController } from './validationController'
import { RequestHandler } from 'express'
import { RT } from '@src/routes/resTypes'
import { BT_addLesson } from '@src/routes/timeRouter/time.types'
import DayService from '@src/services/DayService'

class DayController {
  deleteLessons: RequestHandler<Record<string, any>, RT, any, any> = async (req, res, next) => {
    try {
      validationController(req, res)

      const { id } = req.query

      await DayService.deleteLessons(id)
      return res.json({ status: 'OK' })
    } catch (e) {
      next(e)
    }
  }
}

export default new DayController()
