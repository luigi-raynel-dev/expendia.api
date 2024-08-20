import fs from 'fs'
import path from 'path'
import winston, { log } from 'winston'

const dir =
  process.env.NODE_ENV === 'production'
    ? path.join(__dirname, 'logs')
    : __dirname

export const getLogger = (logsDir: string) => {
  const logPath = path.join(dir, logsDir)
  if (fs.existsSync(logPath)) {
    return winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: getLogFileName(logPath) }),
        new winston.transports.Console()
      ]
    })
  } else console.error(`non-existent directory: ${logPath}`)
}

export const getLogFileName = (logsDir: string) => {
  const date = new Date()
  return path.join(
    logsDir,
    `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}.log`
  )
}

export const cleanOldLogs = (daysLimit = 7) => {
  fs.readdir(dir, { withFileTypes: true }, (err, files) => {
    if (!err) {
      files
        .filter(file => file.isDirectory())
        .forEach(folder => {
          const folderPath = path.join(dir, folder.name)
          fs.readdirSync(folderPath).forEach(file => {
            if (file.endsWith('.log')) {
              const filePath = path.join(folderPath, file)
              const stat = fs.statSync(filePath)
              const ageInDays =
                (Date.now() - stat.mtime.getTime()) / (1000 * 60 * 60 * 24)
              if (ageInDays > daysLimit) fs.unlinkSync(filePath)
            }
          })
        })
    } else console.error(err)
  })
}
