import fs from 'fs'
import path from 'path'
import winston from 'winston'

export const getLogger = (logsDir: string) => {
  if (fs.existsSync(path.join(__dirname, logsDir))) {
    return winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: getLogFileName(logsDir) }),
        new winston.transports.Console()
      ]
    })
  } else console.error(`non-existent directory: ${logsDir}`)
}

export const getLogFileName = (logsDir: string) => {
  const date = new Date()
  return path.join(
    path.join(__dirname, logsDir),
    `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}.log`
  )
}

export const cleanOldLogs = (daysLimit = 7) => {
  fs.readdir(__dirname, { withFileTypes: true }, (err, files) => {
    if (!err) {
      files
        .filter(file => file.isDirectory())
        .map(folder => {
          fs.readdirSync(folder.name).forEach(file => {
            if (file.endsWith('.log')) {
              const filePath = path.join(folder.name, file)
              const stat = fs.statSync(filePath)
              const ageInDays =
                (Date.now() - stat.mtime.getTime()) / (1000 * 60 * 60 * 24)
              if (ageInDays > daysLimit) fs.unlinkSync(filePath)
            }
          })
        })
    }
  })
}
