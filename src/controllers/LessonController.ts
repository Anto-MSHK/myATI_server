import LessonService from '../services/LessonService'
import { validationController } from './validationController'
import { RequestHandler } from 'express'
import { RT } from '../routes/resTypes'
import { BT_addLesson } from '../routes/timeRouter/time.types'

class LessonController {
  addLesson: RequestHandler<Record<string, any>, RT, BT_addLesson> = async (req, res, next) => {
    try {
      validationController(req, res)

      const { count, time, day_id, data, special } = req.body

      await LessonService.addLesson(count, day_id, data, time, special)
      return res.json({ status: 'OK' })
    } catch (e) {
      next(e)
    }
  }
  changeLesson: RequestHandler<Record<string, any>, RT, BT_addLesson, any> = async (req, res, next) => {
    try {
      validationController(req, res)

      const { count, time, data, special } = req.body
      const { id } = req.query

      await LessonService.changeLesson(id, { count, data, time, special })
      return res.json({ status: 'OK' })
    } catch (e) {
      next(e)
    }
  }
  deleteLesson: RequestHandler<Record<string, any>, RT, any, any> = async (req, res, next) => {
    try {
      validationController(req, res)

      const { id } = req.query

      await LessonService.deleteLesson(id)
      return res.json({ status: 'OK' })
    } catch (e) {
      next(e)
    }
  }
}

export default new LessonController()
