import { RT } from '@src/routes/resTypes'
import { BT_addLesson } from '@src/routes/lessonRouter/lesson.types'
import { Router } from 'express'
import LessonController from '@src/controllers/LessonController'
import { body, check } from 'express-validator'
import { errorsMSG } from '../../exceptions/API/errorsConst'

const lesson = Router()
lesson.post<string, any, RT, BT_addLesson>(
  '/add',
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

export default lesson
