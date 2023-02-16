import { dayT, lessonT } from '@src/routes/scheduleRouter/schedule.types'

class ScheduleService {
  adaptationForTeacher = (schedule: dayT[]) => {
    return schedule.map(day => {
      let correctDay: any = day
      correctDay.lessons = day.lessons.map((lesson, index) => {
        let curLessons = day.lessons
          .map((el, i) => {
            if (i !== index) return el
          })
          .filter(el => el)
        let correctLessons = []
        for (let lessonComp of curLessons) {
          if (lesson)
            if (lessonComp?.count === lesson?.count) {
              if (
                lesson?.data.topWeek?.hasOwnProperty('subject') &&
                lessonComp?.data.topWeek?.hasOwnProperty('subject')
              ) {
                correctLessons.push(lesson)
                console.log(1)
              }
              if (
                lesson?.data.lowerWeek?.hasOwnProperty('subject') &&
                lessonComp?.data.lowerWeek?.hasOwnProperty('subject')
              ) {
                correctLessons.push(lesson)
                console.log(2)
              }
              //   else {
              //     let correctLesson = lesson
              //     correctLesson.groups = [...lesson.groups, ...lessonComp.groups]
              //     correctLesson.data = { ...lesson?.data, ...lessonComp?.data }
              //     correctLessons.push(correctLesson)
              //   }
            } else {
              correctLessons.push(lesson)
            }
          return correctLessons
        }
      })
      return correctDay
    })
  }
}

export default new ScheduleService()
