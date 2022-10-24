import { RT } from '@src/routes/resTypes'
import { BT_addLesson } from '@src/routes/lessonRouter/lesson.types'
import { Router } from 'express'
import LessonController from '@src/controllers/LessonController'
import { body, check, query } from 'express-validator'
import { errorsMSG } from '../../exceptions/API/errorsConst'
import { QT_getScheduleByGroup } from './schedule.types'
import ScheduleController from '@src/controllers/ScheduleController'
import { QT_getScheduleByTeacher } from '@src/routes/scheduleRouter/schedule.types'

const schedule = Router()
schedule.get<string, any, RT, any, QT_getScheduleByGroup>(
  '/group',
  [query('name', errorsMSG.QUERY_NO_EMPTY).notEmpty()],
  ScheduleController.getScheduleByGroup
)
schedule.get<string, any, RT, any, QT_getScheduleByTeacher>(
  '/teacher',
  [query('name', errorsMSG.QUERY_NO_EMPTY).notEmpty()],
  ScheduleController.getScheduleByTeacher
)

export default schedule
