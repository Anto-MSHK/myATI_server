import fs from 'fs'
import https from 'https' // or 'https' for https:// URLs
import antonio from 'cheerio'
import path from 'path'
import ParserService from './ParserService'
import XLSX from 'xlsx'

type fileLink = {
  url: string
  fileName: string
  extension: string
}
class FileService {
  public checkConnection = async () => {
    return await new Promise<undefined | Error>(resolve => {
      https
        .get(process.env.BASE_URL as string)
        .on('finish', () => {
          resolve(undefined)
        })
        .on('error', e => {
          resolve(e)
        })
    })
  }

  public deleteObsoleteFiles = async () => {
    const directories = [
      path.resolve(`${process.env.FOLDER_PATH}/schedule/vpo`),
      path.resolve(`${process.env.FOLDER_PATH}/schedule/spo`),
    ]
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
    const fileHtml = fs.createWriteStream(`${process.env.HTML_URL}`)
    return await new Promise<fileLink[]>(resolve => {
      https.get(process.env.HTML_URL as string, res => {
        res.pipe(fileHtml)
        fileHtml.on('finish', () => {
          fileHtml.close()

          const parse = antonio.load(fs.readFileSync(process.env.HTML_URL as string))
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
            file = fs.createWriteStream(
              path.resolve(`${process.env.FOLDER_PATH}/schedule/vpo/${link.fileName}.${link.extension}`)
            )
            i_vpo++
          } else if (link.url.indexOf('spo') > -1) {
            file = fs.createWriteStream(
              path.resolve(`${process.env.FOLDER_PATH}/schedule/spo/${link.fileName}.${link.extension}`)
            )
            i_spo++
          } else return

          https.get(process.env.BASE_URL + link.url, res => {
            res.pipe(file)
            file.on('finish', () => {
              file.close()
              count++
              if (i_vpo + i_spo === count) {
                resolve()
              }
            })
          })
        } else return
      })
    })
  }
}

export default new FileService()
