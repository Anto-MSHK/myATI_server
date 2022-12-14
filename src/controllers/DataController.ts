import LessonService from '@src/services/LessonService'
import { validationController } from './validationController'
import { RequestHandler } from 'express'
import { RT } from '@src/routes/resTypes'
import { BT_addLesson } from '@src/routes/timeRouter/time.types'
import DayService from '@src/services/DayService'
import Manager from '../index'

class DataController {
  getCurWeek: RequestHandler<Record<string, any>, RT, any, any> = async (req, res, next) => {
    try {
      validationController(req, res)
      let state = await Manager.checkStateFile()

      return res.json({ status: 'OK', result: { curWeek: state.curWeek } })
    } catch (e) {
      next(e)
    }
  }
}

export default new DataController()
