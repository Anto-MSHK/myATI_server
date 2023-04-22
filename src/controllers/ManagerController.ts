import LessonService from '../services/LessonService'
import { validationController } from './validationController'
import { RequestHandler } from 'express'
import { RT } from '../routes/resTypes'
import { BT_addLesson } from '../routes/timeRouter/time.types'
import { Manager } from '../index'

class ManagerController {
  reloadServer: RequestHandler<Record<string, any>, RT, BT_addLesson> = async (req, res, next) => {
    try {
      await new Manager().tick(true)
      return res.json({ status: 'OK' })
    } catch (e) {
      next(e)
    }
  }
}

export default new ManagerController()
