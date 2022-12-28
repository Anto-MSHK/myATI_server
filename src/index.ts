import express from 'express'
import mongoose from 'mongoose'
import fs from 'fs'
import auth, { accessRights_maximum } from './routes/authRouter/auth.routes'
import group from './routes/groupRouter/group.routes'
import time from './routes/timeRouter/time.routes'
import eduStructure from './routes/eduStructureRouter/eduStructure.routes'
import FileService from './services/FileService'
import Group from './models/Group/Group.model'
import Day from './models/eduStructure/Day/Day.model'
import Lesson from './models/eduStructure/Lesson/Lesson.model'
import Subject from './models/eduStructure/Subject/Subject.model'
import Teacher from './models/eduStructure/Teacher/Teacher.model'
import Cabinet from './models/eduStructure/Cabinet/Cabinet.model'
import schedule from './routes/scheduleRouter/schedule.routes'
import { managerMSG } from './logger/managerConst'
import ParserService, { deleteGhostGroups } from './services/ParserService'
import { errorMiddleware } from './middlewares/errorMiddleware'
import { ManagerLogs } from './logger/manager-logger'
import dataServer from './routes/dataServerRouter/dataServer.routes'
import DataServerController from './controllers/DataServerController'
const path = require('path')

require('dotenv').config()
const app = express()
const PORT = process.env.PORT || 3000

const cors = require('cors')
const corsOptions = [
  {
    origin: 'http://localhost:3000',
    credentials: true,
    optionSuccessStatus: 200,
  },
  {
    origin: 'http://localhost:19000',
    credentials: true,
    optionSuccessStatus: 200,
  },
]

app.use(express.json())
app.use(cors(corsOptions))
app.use('/auth', auth)
app.use('/edu', eduStructure)
app.use('/group', group)
app.use('/time', time)
app.use('/schedule', schedule)
app.get('/data/week', DataServerController.getData)
app.use(errorMiddleware)

const addHours = function (date: Date, h: number) {
  date.toLocaleString('en-US', { timeZone: 'Europe/Moscow' })
  date.setTime(date.getTime() + h * 60 * 60 * 1000)
  return date
}
type state = {
  dateLastStartServer?: string | Date
  fileDownloadDate?: string | Date
  curWeek?: string
}

class Manager {
  public start = async () => {
    try {
      console.clear()
      fs.truncate('./server.log', 0, () => {})

      ManagerLogs.INFO('Server', managerMSG.STARTED)

      await this.checkStateFile()
      var startData = { dateLastStartServer: new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow' }) }
      await this.addDataToState(startData)
      const tick = async () => {
        var mongooseConnection = true
        await mongoose.connect(process.env.DB_URL as string).catch(e => {
          mongooseConnection = false
          ManagerLogs.WARN('MongoDB', managerMSG.IS_NOT_CONNECTION_DB)
        })
        if (mongooseConnection) {
          let isDownloadedFiles = await this.downloadingFiles()
          if (isDownloadedFiles) {
            await this.mongoDropAll()
            ManagerLogs.INFO('ParserService', 'Загрузка данных...')
            await ParserService.start().then(async () => {
              process.stdout.write('\r\x1b[K')
              var parserIsFinished = true
              await deleteGhostGroups()
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
      }, 1000000)

      app.listen(PORT, () => {
        ManagerLogs.INFO('Server', managerMSG.ON_PORT)
      })
    } catch (e) {
      console.log(e)
    }
  }

  public checkStateFile = async () => {
    return await new Promise<state>(resolve => {
      fs.readFile(`./${process.env.FOLDER_PATH}/state.json`, 'utf8', async (err, data) => {
        if (err) {
          ManagerLogs.WARN('StateFile', managerMSG.NOT_EXISTS_STATE)
          var today = new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow' })
          var startData = JSON.stringify({ dateLastStartServer: today })
          fs.writeFile(`./${process.env.FOLDER_PATH}/state.json`, startData, 'utf8', err => {
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

  public addDataToState = async (addedObj: state) => {
    return await new Promise<string>((resolve, reject) => {
      fs.readFile(`./${process.env.FOLDER_PATH}/state.json`, 'utf8', async (err, data) => {
        if (err) {
          ManagerLogs.WARN('StateFile', managerMSG.NOT_EXISTS_STATE)
        } else {
          let newData = JSON.parse(data)
          newData = { ...newData, ...addedObj }
          let json = JSON.stringify(newData) //convert it back to json
          fs.writeFile(`./${process.env.FOLDER_PATH}/state.json`, json, 'utf8', e => {
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
    var dateReload = new Date()
    var dateReloadEnd = new Date()

    var dateEnd = undefined

    date && (dateEnd = addHours(date, 0.5))

    dateReload.setHours(0, 0, 0)
    dateReloadEnd.setHours(6, 0, 0)
    if (
      !errConnection &&
      dateReload &&
      new Date() > dateReload &&
      new Date() < dateReloadEnd &&
      dateEnd &&
      new Date() > dateEnd
    ) {
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

export default new Manager()
