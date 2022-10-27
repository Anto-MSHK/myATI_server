import XLSX from 'xlsx'
import fs from 'fs'
import config from 'config'
import GroupService from '@src/services/GroupService'
import EduStructureService from './EduStructureService'
import Teacher from '@src/models/eduStructure/Teacher/Teacher.model'
import Cabinet from '@src/models/eduStructure/Cabinet/Cabinet.model'
import Subject from '@src/models/eduStructure/Subject/Subject.model'
import { ILesson } from '@src/models/eduStructure/Lesson/Lesson.types'
import LessonService from '@src/services/LessonService'
import { IDayDocument } from '@src/models/eduStructure/Day/Day.types'
import { byWeek } from '@src/models/eduStructure/Lesson/Lesson.types'
import { ObjectId } from 'mongodb'
import { ApiError } from './../exceptions/API/api-error'
import { errorsMSG } from './../exceptions/API/errorsConst'

type stydyWeek = {
  days: (stydyDay | undefined)[]
}

type stydyDay = {
  lessons: (ILesson | undefined)[]
}

type cell = {
  v: string
  w: string
  t: string
}

type merge = {
  s: { r: {}; c: {} }
  e: { r: {}; c: {} }
}

type dayCells = {
  i_cell_row_last: number
  i_cell_row_first: number
}

var alphabet = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
  'AA',
  'AB',
  'AC',
  'AD',
  'AE',
  'AF',
  'AG',
  'AH',
  'AI',
  'AJ',
  'AK',
  'AL',
  'AM',
  'AN',
  'AO',
  'AP',
  'AQ',
  'AR',
  'AS',
  'AT',
  'AU',
  'AV',
  'AW',
  'AX',
  'AY',
  'AZ',
  'BA',
  'BB',
  'BC',
  'BD',
  'BE',
  'BF',
  'BG',
  'BH',
  'BI',
  'BJ',
  'BK',
  'BL',
  'BM',
  'BN',
  'BO',
  'BP',
  'BQ',
  'BR',
  'BS',
  'BT',
  'BU',
  'BV',
  'BW',
  'BX',
  'BY',
  'BZ',
]

var pattern = /^[А-Я]+$/
var patternEng = /^[A-Z]+$/i
var patternNum = /^[0-9]+$/

type list = {
  '!merges': any
  [key: string]: cell
}

const checkingMerged = (str: string, num1: number, num2: number, workSheet: list) => {
  let merges: merge[] = workSheet['!merges']
  let isMergeCell: boolean = false
  merges.map(el => {
    if (
      el.s.c === alphabet.indexOf(str) &&
      el.e.c === alphabet.indexOf(str) &&
      el.s.r === num1 - 1 &&
      el.e.r === num2 - 1
    ) {
      isMergeCell = true
    }
  })
  return isMergeCell
}

function checkingGroupCellIsCorrect<N extends number, T extends string>(
  currentColumn: T,
  currentRow: N,
  direction: N,
  condition: N,
  workSheet: list
): T {
  try {
    let currentValue: string | undefined = workSheet[currentColumn + currentRow]
      ? workSheet[currentColumn + currentRow].w
      : undefined

    let nextCell: number = alphabet.indexOf(currentColumn) + direction

    let incorrectData = currentValue && currentValue.length < 10

    let merged = checkingMerged(currentColumn, currentRow, currentRow + 1, workSheet)

    let emptyData =
      !currentValue &&
      workSheet[alphabet[nextCell] + currentRow] &&
      workSheet[alphabet[nextCell] + currentRow].w.length > 6

    let isNotMD = currentValue && currentValue !== 'ВОЕННАЯ КАФЕДРА'

    if (condition === 0) {
      if (incorrectData || emptyData) {
        return checkingGroupCellIsCorrect(alphabet[nextCell] as T, currentRow, direction, condition, workSheet)
      } else {
        return currentColumn
      }
    } else if (condition === 1) {
      if (incorrectData && merged && isNotMD) {
        return currentColumn
      } else {
        return checkingGroupCellIsCorrect(alphabet[nextCell] as T, currentRow, direction, condition, workSheet)
      }
    }
    return '' as T
  } catch (e) {
    return '' as T
  }
}

class ParserService {
  public start = async () => {
    try {
      const basePath = config.get('basePath') as string
      var workSheet: list
      const directories = [`${basePath}\\vpo\\`, `${basePath}\\spo\\`]
      return await new Promise<void>(async resolve => {
        directories.map(async (directory, index) => {
          fs.readdir(directory, async (err, files) => {
            if (err) throw err

            for (const file of files) {
              const fileOfData = XLSX.readFile(directory + file, {
                raw: true,
              })

              workSheet = fileOfData.Sheets[fileOfData.SheetNames[0]] as list
              delete workSheet['!margins']
              delete workSheet['!ref']
              delete workSheet['!rows']
              let faculty: 'FVO' | 'SPO' = index === 0 ? 'FVO' : 'SPO'
              await this.defineGroups(faculty, workSheet)
            }
            if (index === 1) resolve()
          })
        })
      })
    } catch (e) {
      return undefined
    }
  }

  private defineGroups = async (faculty: 'FVO' | 'SPO', workSheet: list) => {
    try {
      for (let curKey in workSheet) {
        if (workSheet[curKey] && workSheet[curKey].w) {
          let letter: number = 0,
            num: number = 0
          if (workSheet[curKey].w.length < 15) {
            for (let i = 0; i <= workSheet[curKey].w.length; i++) {
              if (pattern.test(workSheet[curKey].w[i])) {
                letter++
              } else if (patternNum.test(workSheet[curKey].w[i])) num++
            }
          }

          if (letter != 0 && num != 0 && letter <= 5 && num <= 5) {
            var referСell_number: string = '',
              referСell_letter: string = ''

            for (let i = 0; i <= curKey.length; i++) {
              if (patternEng.test(curKey[i])) {
                referСell_letter += curKey[i]
              } else if (patternNum.test(curKey[i])) {
                referСell_number += curKey[i]
              }
              if (curKey.length - i === 1) break
            }

            let correctColumn = checkingGroupCellIsCorrect(referСell_letter, +referСell_number + 1, 1, 0, workSheet)
            referСell_letter = correctColumn ? correctColumn : referСell_letter
            const groupName = workSheet[curKey].w
            await GroupService.addGroup(groupName, faculty).then(async res => {
              if (res) {
                await this.defineSchedule(referСell_letter, referСell_number, res, workSheet)
              }
            })
          }
        }
      }
    } catch (e) {}
  }

  defineSchedule = async (
    referСell_letter: string,
    referСell_number: string,
    daysProps: IDayDocument[],
    workSheet: list
  ) => {
    try {
      var stydyWeek: stydyWeek = {
        days: [],
      }

      let i_letter = alphabet.indexOf(referСell_letter)

      let cellsOfDays: dayCells[] = [{ i_cell_row_first: 0, i_cell_row_last: 0 }]
      let i_day = 0
      let i_cell_row = +referСell_number + 1
      let i_cell_row_last = +referСell_number + 20

      for (let i_cell_column = i_letter - 1; i_cell_column >= 0; i_cell_column--) {
        while (i_cell_row_last > i_cell_row) {
          for (let i_cell_row_first = i_cell_row; i_cell_row_first <= i_cell_row + 5; i_cell_row_first++) {
            var isMerged = checkingMerged(alphabet[i_cell_column], i_cell_row_first, i_cell_row_last, workSheet),
              isCellLong = i_cell_row_last - i_cell_row_first > 6,
              isCellExists = workSheet[alphabet[i_cell_column] + i_cell_row_first] !== undefined,
              isNotMD = isCellExists && workSheet[alphabet[i_cell_column] + i_cell_row_first].w !== 'ВОЕННАЯ КАФЕДРА'

            if (isMerged && isCellLong && isCellExists && isNotMD) {
              cellsOfDays[i_day] = { i_cell_row_first, i_cell_row_last }
              i_day++
              i_cell_row = i_cell_row_last + 1
              i_cell_row_last += 20
              break
            }
          }
          i_cell_row_last--
        }
        i_cell_row_last = +referСell_number + 20
      }
      let column_lesson: string = alphabet[alphabet.indexOf(referСell_letter) - 1]

      column_lesson = checkingGroupCellIsCorrect(column_lesson, cellsOfDays[0].i_cell_row_first, -1, 1, workSheet)

      stydyWeek.days = await Promise.all(
        cellsOfDays.map(async (day: dayCells, iCurrentWeekDay) => {
          let day_id: string = ''
          if (daysProps[iCurrentWeekDay]) day_id = daysProps[iCurrentWeekDay]._id
          if (day_id !== '') return await this.defineDay(day, referСell_letter, column_lesson, day_id, workSheet)
        })
      )

      return stydyWeek
    } catch (e) {
      return undefined
    }
  }

  defineDay = async (
    rangeCells: dayCells,
    referСell_letter: string,
    column_lesson: string,
    day_id: string,
    workSheet: list
  ) => {
    try {
      var stydyDay: stydyDay = {
        lessons: [],
      }

      let cellsOfLesson: dayCells[] = [{ i_cell_row_first: 0, i_cell_row_last: 0 }],
        i_lesson = 0

      for (let i_cell = rangeCells.i_cell_row_first; i_cell <= rangeCells.i_cell_row_last; i_cell++) {
        for (let i_cell_last = i_cell + 1; i_cell_last <= i_cell + 5; i_cell_last++)
          if (column_lesson && checkingMerged(column_lesson, i_cell, i_cell_last, workSheet)) {
            cellsOfLesson[i_lesson] = {
              i_cell_row_first: i_cell,
              i_cell_row_last: i_cell_last,
            }
            i_lesson++
            break
          }
      }

      stydyDay.lessons = await Promise.all(
        cellsOfLesson.map(async (lesson: dayCells, iCurrentLesson) => {
          return await this.defineLesson(lesson, referСell_letter, iCurrentLesson, day_id, workSheet)
        })
      )

      return stydyDay
    } catch (e) {
      return undefined
    }
  }

  times = [
    { from: '8:30', to: '10:05' },
    { from: '10:15', to: '11:50' },
    { from: '12:30', to: '14:05' },
    { from: '14:15', to: '15:50' },
    { from: '16:00', to: '17:35' },
    { from: '17:45', to: '19:20' },
  ]
  defineLesson = async (
    referLesson: dayCells,
    referСell_letter: string,
    curLesson: number,
    day_id: string,
    workSheet: list
  ) => {
    try {
      let lesson: ILesson | undefined
      // referLesson += 1;
      let column_cabinet = alphabet[alphabet.indexOf(referСell_letter) + 1]

      let firstCell: string | undefined = workSheet[referСell_letter + referLesson.i_cell_row_first]
        ? workSheet[referСell_letter + referLesson.i_cell_row_first].w
        : undefined
      let secondCell: string | undefined = workSheet[referСell_letter + referLesson.i_cell_row_last]
        ? workSheet[referСell_letter + referLesson.i_cell_row_last].w
        : undefined

      let cabinet_firstCell: string | undefined = workSheet[column_cabinet + referLesson.i_cell_row_first]
        ? workSheet[column_cabinet + referLesson.i_cell_row_first].w
        : undefined
      let cabinet_secondCell: string | undefined = workSheet[column_cabinet + referLesson.i_cell_row_last]
        ? workSheet[column_cabinet + referLesson.i_cell_row_last].w
        : undefined

      if (!firstCell && !secondCell) {
        return undefined
      }
      let propsLesson = {
        mainCell: firstCell,
        cellInfo: secondCell,
        cabinet_fCell: cabinet_firstCell,
        cabinet_sCell: cabinet_secondCell,
      }
      if (
        checkingMerged(column_cabinet, referLesson.i_cell_row_first, referLesson.i_cell_row_last, workSheet) &&
        firstCell &&
        secondCell
      ) {
        var data
        if (getLessonData(firstCell).length > 0) {
          data = await lessonByWeek(propsLesson)
        } else {
          data = await lessonConstant(propsLesson)
        }
      } else {
        if (firstCell && getLessonData(firstCell).length === 0) {
          data = await lessonConstant(propsLesson)
        } else data = await lessonByWeek(propsLesson)
      }
      lesson = {
        count: `${curLesson}`,
        time: this.times[curLesson],
        day_id,
        data,
      }
      return await LessonService.addLesson(curLesson, day_id, data, this.times[curLesson]).then(() => lesson)
    } catch (e) {
      return undefined
    }
  }
}

type propsLessonType = {
  mainCell: string | undefined
  cellInfo: string | undefined
  cabinet_fCell: string | undefined
  cabinet_sCell: string | undefined
}

const getLessonData = (str: string): [title: string, nameTeacher: string, degree: string, typeLesson: string] | [] => {
  try {
    let surname = /^[А-Я][а-я]{1,20}\s[А-Я]\.[А-Я]\.$/

    let title: string = ''
    let nameTeacher: string = ''
    let degree: string = ''
    let typeLesson: string = ''

    let i_degree: number = 0,
      i_type_lesson: number = 0

    let stop: boolean = false

    for (let i_char_start = 0; i_char_start <= str.length; i_char_start++) {
      for (let i_char_end = str.length; i_char_end >= 1; i_char_end--) {
        let currentPhrase: string = ''

        for (let i = i_char_start; i < i_char_end; i++) {
          currentPhrase += str[i]
        }
        if (surname.test(currentPhrase)) {
          nameTeacher = currentPhrase
          i_degree = i_char_start
          i_type_lesson = i_char_end
          stop = true
        }
      }

      if (stop === true) break
    }

    if (stop === false) {
      return []
    }

    let i_first_t = str.indexOf('.')
    if (i_first_t != -1) {
      if (i_first_t > i_degree) i_first_t = i_degree - 1
      else
        for (let j = i_first_t; j >= 0; j--) {
          if (str[j] === ' ') {
            i_first_t = j
            break
          }
        }
      for (let i = 0; i <= i_first_t; i++) {
        title += str[i]
      }
      for (let i = title.length; i >= 0; i--) {
        if (title[i] !== ' ' && title[i] !== undefined) {
          title = title.slice(0, i + 1)

          break
        }
      }
    }

    for (let i = i_first_t; i <= i_degree - 1; i++) {
      degree += str[i]
    }

    for (let i = i_type_lesson + 1; i <= str.length; i++) {
      str[i] && (typeLesson += str[i])
    }

    if (!degree || degree === 'undefined') degree = ''

    return [title, nameTeacher, degree.trim(), typeLesson.trim()]
  } catch (e) {
    console.log(e)
    return []
  }
}

const lessonConstant = async (
  props: propsLessonType
): Promise<{
  topWeek: byWeek
}> => {
  var data: byWeek = { subject_id: new ObjectId(), teacher_id: new ObjectId(), cabinet_id: new ObjectId() }

  try {
    let [_, name, degree, type] = props.cellInfo ? getLessonData(props.cellInfo) : []
    let title = props.mainCell
    if (title)
      for (let i = title.length; i >= 0; i--) {
        if (title[i] !== ' ' && title[i] !== undefined) {
          title = title.slice(0, i + 1)

          break
        }
      }

    let cabinet = props.cabinet_fCell ? props.cabinet_fCell : props.cabinet_sCell

    var data = await addDataFromLesson(title, type, name, degree, cabinet)

    return {
      topWeek: {
        type,
        ...data,
      },
    }
  } catch (e) {
    return {
      topWeek: data,
    }
  }
}

const lessonByWeek = async (
  props: propsLessonType
): Promise<{
  topWeek: byWeek
  lowerWeek: byWeek
}> => {
  var topWeek: byWeek = { subject_id: new ObjectId(), teacher_id: new ObjectId(), cabinet_id: new ObjectId() },
    lowerWeek: byWeek = { subject_id: new ObjectId(), teacher_id: new ObjectId(), cabinet_id: new ObjectId() }
  try {
    //? ---->-->-> topWeek <-<--<----
    let [titleTop, nameTop, degreeTop, typeTop] = props.mainCell ? getLessonData(props.mainCell) : []
    let cabinetTop = props.cabinet_fCell ? props.cabinet_fCell : props.cabinet_sCell

    var topWeek = await addDataFromLesson(titleTop, typeTop, nameTop, degreeTop, cabinetTop)

    //? ---->-->-> lowerWeek <-<--<----
    let [titleLower, nameLower, degreeLower, typeLower] = props.cellInfo ? getLessonData(props.cellInfo) : []

    let cabinetLower = props.cabinet_fCell ? props.cabinet_fCell : props.cabinet_sCell

    var lowerWeek = await addDataFromLesson(titleLower, typeLower, nameLower, degreeLower, cabinetLower)

    return { topWeek: { type: typeTop, ...topWeek }, lowerWeek: { type: typeLower, ...lowerWeek } }
  } catch (e) {
    return { topWeek: topWeek, lowerWeek: lowerWeek }
  }
}

const addDataFromLesson = async (
  title: string | undefined,
  type: string | undefined,
  name: string | undefined,
  degree: string | undefined,
  cabinet: string | undefined
) => {
  var data: byWeek = { subject_id: new ObjectId(), teacher_id: new ObjectId(), cabinet_id: new ObjectId() }

  const subjectC = new EduStructureService(Subject as any, { title })

  await subjectC.add().then(async res => {
    if (res.result) data.subject_id = res.result
    else {
      const a = await Subject.findOne({ title })
      if (a) {
        data.subject_id = a._id
      }
    }
  })

  const teacherC = new EduStructureService(Teacher as any, { name, degree })

  await teacherC.add().then(async res => {
    if (res.result) data.teacher_id = res.result
  })

  await subjectC.addSubjectToTeacher(name)
  if (cabinet && +cabinet !== NaN) {
    const cabinetC = new EduStructureService(Cabinet as any, { item: +cabinet })

    await cabinetC.add().then(async res => {
      if (res.result) data.cabinet_id = res.result
    })
    await cabinetC.addCabinetToSubject(title)
  }

  if (type) {
    await subjectC.addTypeLessonToSubject(type)
  }
  return data
}
export default new ParserService()
