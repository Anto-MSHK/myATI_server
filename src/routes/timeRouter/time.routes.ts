import { RT } from '../../routes/resTypes'
import { BT_addLesson } from '../../routes/timeRouter/time.types'
import { Router } from 'express'
import LessonController from '../../controllers/LessonController'
import DayController from '../../services/DayService'
import { body, check, query } from 'express-validator'
import { errorsMSG } from '../../exceptions/API/errorsConst'

const time = Router()

time.post<string, any, RT, BT_addLesson>(
  '/lesson/add',
  [
    check('count', errorsMSG.NO_EMPTY).notEmpty(),
    check('day_id', errorsMSG.NO_EMPTY).notEmpty(),
    check('data', errorsMSG.OBJ_NO_EMPTY).optional(),
    check('data.topWeek', errorsMSG.OBJ_NO_EMPTY).if(body('data').exists()).optional(),
    check('data.topWeek.subject_id', errorsMSG.NO_EMPTY).if(body('data.topWeek').exists()).notEmpty(),
    check('data.topWeek.teachers_id', errorsMSG.NO_EMPTY).if(body('data.topWeek').exists()).notEmpty(),
  ],
  LessonController.addLesson
)

time.put<string, any, RT, BT_addLesson>(
  '/lesson',
  [query('id', errorsMSG.QUERY_NO_EMPTY).notEmpty()],
  LessonController.changeLesson
)

time.delete<string, any, RT, BT_addLesson>(
  '/lesson',
  [query('id', errorsMSG.QUERY_NO_EMPTY).notEmpty()],
  LessonController.deleteLesson
)

time.delete<string, any, RT, BT_addLesson>(
  '/day',
  [query('id', errorsMSG.QUERY_NO_EMPTY).notEmpty()],
  DayController.deleteLessons
)
export default time
