import fs from 'fs'
import https from 'https' // or 'https' for https:// URLs
import config from 'config'
import antonio from 'cheerio'
import path from 'path'
import ParserService from './ParserService'
import XLSX from 'xlsx'
const { distance, closest } = require('fastest-levenshtein')

const htmlPath = config.get('htmlPath') as string
const basePath = config.get('basePath') as string

const htmlURL = config.get('htmlURL') as string
const baseURL = config.get('baseURL') as string

type fileLink = {
  url: string
  fileName: string
  extension: string
}
class FileService {
  public checkConnection = async () => {
    return await new Promise<undefined | Error>(resolve => {
      https
        .get(baseURL)
        .on('finish', () => {
          resolve(undefined)
        })
        .on('error', e => {
          resolve(e)
        })
    })
  }

  public deleteObsoleteFiles = async () => {
    const directories = [`${basePath}\\vpo`, `${basePath}\\spo`]
    return await Promise.all(
      directories.map(async directory => {
        new Promise<void>(resolve => {
          fs.readdir(directory, (err, files) => {
            if (err) {
              throw err
            }

            for (const file of files) {
              fs.unlink(path.join(directory, file), err => {
                if (err) throw err
              })
            }
            resolve()
          })
        })
      })
    ).then(() => undefined)
  }

  public findFilesToDownload = async () => {
    var links: fileLink[] = []
    const excelExtensions: string[] = [
      'XLSX',
      'XLSM',
      'XLSB',
      'XLTX',
      'XLTM',
      'XLS',
      'XLT',
      'XLS',
      'XML',
      'XML',
      'XLAM',
      'XLA',
      'XLW',
      'XLR',
    ]
    const fileHtml = fs.createWriteStream(`${htmlPath}`)
    return await new Promise<fileLink[]>(resolve => {
      https.get(htmlURL, res => {
        res.pipe(fileHtml)
        fileHtml.on('finish', () => {
          fileHtml.close()

          const parse = antonio.load(fs.readFileSync(htmlPath))
          parse('a').each((index, value) => {
            var linkFile = parse(value).attr('href')
            var isNotImg = parse(value).children('img').length === 0
            if (isNotImg)
              excelExtensions.map(ext => {
                let extensionFile: string = ''
                let nameFile: string = ''
                if (linkFile) {
                  for (let i = linkFile.length - ext.length; i <= linkFile.length; i++) {
                    linkFile[i] && (extensionFile += linkFile[i])
                  }
                } else return
                if (
                  extensionFile.toLowerCase() === ext.toLowerCase() &&
                  links.findIndex(i => i.url === linkFile) === -1
                ) {
                  for (let i = linkFile.length - ext.length - 2; linkFile[i] !== '/'; i--) {
                    linkFile[i] && (nameFile += linkFile[i])
                  }
                  linkFile &&
                    links.push({
                      url: linkFile,
                      fileName: nameFile.split('').reverse().join(''),
                      extension: ext.toLowerCase(),
                    })
                  return
                }
              })
          })
          resolve(links)
        })
      })
    })
  }

  public download = async (filelinks: fileLink[]) => {
    var i_vpo = 0,
      i_spo = 0,
      count = 0
    return await new Promise<void>(resolve => {
      filelinks.map(async link => {
        if (link.url.indexOf('exams') === -1) {
          var file: fs.WriteStream
          //!
          if (link.url.indexOf('spo') === -1) {
            file = fs.createWriteStream(`${basePath}\\vpo\\${link.fileName}.${link.extension}`)
            i_vpo++
          } else if (link.url.indexOf('spo') > -1) {
            file = fs.createWriteStream(`${basePath}\\spo\\${link.fileName}.${link.extension}`)
            i_spo++
          } else return

          https.get(baseURL + link.url, res => {
            res.pipe(file)
            file.on('finish', () => {
              file.close()
              count++
              console.log(fs.readdirSync('app/src/files/schedule/vpo'))
              if (i_vpo + i_spo === count) {
                resolve()
              }
            })
          })
        } else return
      })
    })
  }

  //!This function is not executed
  public cleaningStuff = async (filelinks: fileLink[]) => {
    const directories = [`${basePath}\\vpo`, `${basePath}\\spo`]
    return await new Promise<void>(resolve => {
      directories.map(async directory => {
        fs.readdir(directory, (err, files) => {
          if (err) {
            throw err
          }
          var mas: { fileName: string; date: string | undefined }[] = []
          for (const file of files) {
            const fileOfData = XLSX.readFile(directory + file, {
              raw: true,
            })
            mas.push({ fileName: file, date: fileOfData.Props?.LastPrinted })
          }
          mas.map((el, index, arr) => {
            var i = 0
            var t = mas.filter(qqq => qqq.fileName !== el.fileName)
            var l = t
              .map(xc => {
                if (el.fileName.length !== xc.fileName.length) return xc.fileName
              })
              .filter(xc => xc !== undefined)
            if (l) {
              var b = closest(el.fileName, l)
              for (var a = 0; a <= el.fileName.length; a++) {
                if (b[a] === el.fileName[a]) {
                  i++
                } else {
                  if (i >= 15) {
                    mas = mas.filter(els => els.fileName !== el.fileName)
                  }
                  return
                }
              }
            }
          })
          for (const file of mas) {
            let file2 = mas.find(f => f.fileName === file.fileName)
            if (file2 && file2.date && file.date && new Date(file2.date) <= new Date(file.date))
              fs.unlink(path.join(directory + '\\' + file.fileName), err => {
                if (err) throw err
              })
            else if (file2 && file2.date && file.date && new Date(file2.date) >= new Date(file.date))
              fs.unlink(path.join(directory + '\\' + file2.fileName), err => {
                if (err) throw err
              })
          }
          resolve()
          console.log(1)
        })
      })
    })
  }
}

export default new FileService()
