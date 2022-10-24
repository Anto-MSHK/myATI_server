type status_description = 'OK' | 'INVALID_REQUEST' | 'INVALID_DATA' | 'UNKNOWN_ERROR'
import { getLogger, configure } from 'log4js'

type node = 'FileService' | 'ParserService' | 'Connection' | 'MongoDB' | 'StateFile' | 'Server'

configure({
  appenders: {
    server: { type: 'file', filename: 'server.log' },
    out: { type: 'stdout' },
  },
  categories: {
    default: {
      appenders: ['server', 'out'],
      level: 'debug',
    },
  },
})

const logger = getLogger()

export class ManagerLogs {
  static WARN(nodeProblem: node, message: string) {
    logger.warn(nodeProblem + ' => ' + message)
  }

  static INFO(node: node, message: string) {
    logger.info(node + ' => ' + message)
  }

  static WAITING(node: node, message: string) {
    const P = ['\\', '|', '/', '-']
    let x = 0
    const loader = setInterval(() => {
      process.stdout.write(`\r${P[x++]} ${node} => ${message}`)
      x %= P.length
    }, 250)
    return loader
  }
}
