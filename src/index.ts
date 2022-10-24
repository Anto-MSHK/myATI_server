import express from 'express'
import mongoose from 'mongoose'
import config from 'config'
import fs from 'fs'
import auth, { accessRights_maximum } from '@src/routes/authRouter/auth.routes'
import group from './routes/groupRouter/group.routes'
import lesson from './routes/lessonRouter/lesson.routes'
import eduStructure from './routes/eduStructureRouter/eduStructure.routes'
import FileService from './services/FileService'
import Group from '@src/models/Group/Group.model'
import Day from '@src/models/eduStructure/Day/Day.model'
import Lesson from '@src/models/eduStructure/Lesson/Lesson.model'
import Subject from '@src/models/eduStructure/Subject/Subject.model'
import Teacher from '@src/models/eduStructure/Teacher/Teacher.model'
import Cabinet from '@src/models/eduStructure/Cabinet/Cabinet.model'
import schedule from './routes/scheduleRouter/schedule.routes'
import { managerMSG } from './logger/managerConst'
import ParserService from './services/ParserService'
import { errorMiddleware } from './middlewares/errorMiddleware'
import { ManagerLogs } from './logger/manager-logger'
import { filePath } from './middlewares/pathMiddleware'
const path = require('path')
const os = require('os')
const app = express()
const PORT = config.get('serverPort')
app.use(express.json())
app.use('/auth', auth)
app.use('/edu', eduStructure)
app.use('/group', group)
app.use('/lesson', lesson)
app.use('/schedule', schedule)
app.use(errorMiddleware)

const addHours = function (date: Date, h: number) {
  date.toLocaleString('en-US', { timeZone: 'Europe/Moscow' })
  date.setTime(date.getTime() + h * 60 * 60 * 1000)
  return date
}
type state = {
  dateLastStartServer?: string | Date
  fileDownloadDate?: string | Date
}

class Manager {
  public start = async () => {
    try {
      console.clear()
      fs.truncate('./server.log', 0, () => {})

      ManagerLogs.INFO('Server', managerMSG.STARTED)
      console.log(path.resolve(__filename))
      console.log(os.homedir())
      var files = fs.readdirSync(path.resolve(os.homedir()))
      console.log(files)
      await this.checkStateFile()
      var startData = { dateLastStartServer: new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow' }) }
      await this.addDataToState(startData)

      const tick = async () => {
        var mongooseConnection = true
        await mongoose.connect(config.get('dbUrl')).catch(e => {
          mongooseConnection = false
          ManagerLogs.WARN('MongoDB', managerMSG.IS_NOT_CONNECTION_DB)
        })
        if (mongooseConnection) {
          let isDownloadedFiles = await this.downloadingFiles()
          if (isDownloadedFiles) {
            await this.mongoDropAll()
            var loader = ManagerLogs.WAITING('ParserService', 'Загрузка данных...')
            await ParserService.start().then(() => {
              clearInterval(loader)
              process.stdout.write('\r\x1b[K')
              var parserIsFinished = true
              ManagerLogs.INFO('ParserService', managerMSG.DOWNLOAD_COMPLETE)
            })
          }
        }
      }

      tick()

      setInterval(() => {
        console.clear()
        ManagerLogs.INFO('Server', managerMSG.RELOAD)
        tick()
      }, 10000000)

      app.listen(PORT, () => {
        ManagerLogs.INFO('Server', managerMSG.ON_PORT)
      })
    } catch (e) {
      console.log(e)
    }
  }

  private checkStateFile = async () => {
    return await new Promise<state>(resolve => {
      fs.readFile('./src/files/state.json', 'utf8', async (err, data) => {
        if (err) {
          ManagerLogs.WARN('StateFile', managerMSG.NOT_EXISTS_STATE)
          var today = new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow' })
          var startData = JSON.stringify({ dateLastStartServer: today })
          fs.writeFile('./src/files/state.json', startData, 'utf8', err => {
            if (!err) {
              ManagerLogs.INFO('StateFile', managerMSG.FILE_STATE_ADDED)
              resolve(startData as state)
            }
          })
        } else {
          resolve(JSON.parse(data))
        }
      })
    })
  }

  private addDataToState = async (addedObj: state) => {
    return await new Promise<string>((resolve, reject) => {
      fs.readFile('./src/files/state.json', 'utf8', async (err, data) => {
        if (err) {
          ManagerLogs.WARN('StateFile', managerMSG.NOT_EXISTS_STATE)
        } else {
          let newData = JSON.parse(data)
          newData = { ...newData, ...addedObj }
          let json = JSON.stringify(newData) //convert it back to json
          fs.writeFile('./src/files/state.json', json, 'utf8', e => {
            if (!e) {
              resolve(JSON.parse(data))
            } else {
              reject()
            }
          })
        }
      })
    })
  }

  private downloadingFiles = async () => {
    const getFiles = async () => {
      errDeleteObsolete = await FileService.deleteObsoleteFiles()
      !errDeleteObsolete && ManagerLogs.INFO('FileService', managerMSG.FILES_DELETE)
      var files = await FileService.findFilesToDownload()
      files && ManagerLogs.INFO('FileService', managerMSG.FILES_FOUND)

      if (files) {
        await FileService.download(files).then(() => {
          ManagerLogs.INFO('FileService', managerMSG.FILES_DOWNLOAD)
          this.addDataToState({ fileDownloadDate: new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow' }) })
        })
      }
    }

    var errConnection, errDeleteObsolete
    errConnection = await FileService.checkConnection()
    errConnection
      ? ManagerLogs.WARN('Connection', managerMSG.IS_NOT_CONNECTION)
      : ManagerLogs.INFO('Connection', managerMSG.IS_CONNECTION)

    var date = await this.checkStateFile().then(res => {
      if (res.fileDownloadDate) return new Date(res.fileDownloadDate)
    })
    var dateEnd = undefined

    date && (dateEnd = addHours(date, 0.5))
    if (!errConnection && dateEnd && new Date() > dateEnd) {
      await getFiles()
      return true
    } else if (!errConnection && !date) {
      await getFiles()
      return true
    } else {
      ManagerLogs.INFO('Server', managerMSG.NO_UPDATE_REQUIRED)
      return false
    }
  }

  private mongoDropAll = async () => {
    await Group.collection.drop()
    await Day.collection.drop()
    await Lesson.collection.drop()

    await Subject.collection.drop()
    await Teacher.collection.drop()
    await Cabinet.collection.drop()
    Subject.collection.createIndex({ title: 1 }, { unique: true })
    Teacher.collection.createIndex({ name: 1 }, { unique: true })
    Cabinet.collection.createIndex({ item: 1 }, { unique: true })
  }
}

const serverManager = new Manager()
serverManager.start()
