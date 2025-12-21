import { createConsola } from 'consola'
import { appendFileSync } from 'fs'

// 日志级别: 0=silent, 1=error, 2=warn, 3=info, 4=debug, 5=trace
const LOG_LEVEL = process.env.NODE_ENV === 'production' ? 3 : 4

// 日志文件路径（仅开发环境）
const LOG_FILE = process.env.LOG_FILE || ''

// 文件 Reporter（可选）
const fileReporter = LOG_FILE
  ? {
      log: (logObj: { date: Date; args: unknown[]; type: string; tag: string }) => {
        const timestamp = logObj.date.toISOString()
        const tag = logObj.tag ? `[${logObj.tag}]` : ''
        const level = logObj.type.toUpperCase().padEnd(5)
        const message = logObj.args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ')
        appendFileSync(LOG_FILE, `${timestamp} ${level} ${tag} ${message}\n`)
      },
    }
  : null

export const logger = createConsola({
  level: LOG_LEVEL,
  formatOptions: {
    date: true,
    colors: true,
    compact: false,
  },
})

// 添加文件 reporter
if (fileReporter) {
  logger.addReporter(fileReporter)
}

// 预定义 tagged loggers
export const ttsLogger = logger.withTag('TTS')
export const aiLogger = logger.withTag('AI')
