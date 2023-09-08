import { BT_uniformTypes, QT_uniformTypes } from '../../routes/eduStructureRouter/eduStructure.types'
import { ITeacherInfoDocument } from '../../models/eduStructure/TeacherInfo/TeacherInfo.types'
import { Model, Models } from 'mongoose'
import fs from 'fs'
import https from 'https' // or 'https' for https:// URLs
import antonio from 'cheerio'
import path from 'path'
import cathedraInfo from './cathedraInfo.json'
import TeacherInfo from '../../models/eduStructure/TeacherInfo/TeacherInfo.model'
interface CathedralInfoI {
  cathedra: string
  url: string
  id: number
}
class TeacherInfoService {
  getInfoAboutTeacher = async () => {
    try {
      return await Promise.all(
        (cathedraInfo as CathedralInfoI[]).map(async cathedra => {
          const curPath = `src/files/teachersInfo/${cathedra.id}.html`
          const fileHtml = fs.createWriteStream(path.resolve(curPath))
          let allTeachers: any[] = []
          await new Promise<void>(async resolve => {
            https.get(cathedra.url, res => {
              res.pipe(fileHtml)
              fileHtml.on('finish', () => {
                fileHtml.close()
                const parse = antonio.load(fs.readFileSync(path.resolve(curPath)))

                parse('tbody')
                  .children('tr')
                  .each((_, teacher) => {
                    let name: string | undefined = undefined
                    let degree: string | undefined = undefined
                    let photo_url: string | undefined = undefined
                    let allInfo: string | undefined = ''
                    parse(teacher)
                      .children('td')
                      .each((_, td) => {
                        const img = parse(td).children('img').attr('src')
                        if (img) photo_url = img
                        else {
                          const allText = parse(td).children('p')
                          if (allText.length > 0)
                            parse(allText).each((index, value) => {
                              if (index === 0) {
                                name = parse(value).text().trim()
                              } else if (index === 1) {
                                degree = parse(value).text().trim()
                              } else {
                                if (parse(value).text()) allInfo += `\n${parse(value).text().trim()}`
                              }
                            })
                        }
                      })

                    allTeachers.push({ name, degree, allInfo, cathedra: cathedra.cathedra, photo_url })
                  })

                resolve()
              })
            })
          })
          return await Promise.all(
            allTeachers.map(async teacher => {
              const teacherInfo = new TeacherInfo(teacher)
              await teacherInfo.save()
            })
          )
        })
      )
    } catch (e: any) {
      return 'нет данных'
    }
  }
}
export default TeacherInfoService
