/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth'
import aiRoutes from './routes/ai'
import contentGenerateRoutes from './routes/content/generate'
import contentFeedbackRoutes from './routes/content/feedback'
import workTasksCompleteRoutes from './routes/work_tasks/complete'
import workTasksUpdateRoutes from './routes/work_tasks/update'
import crawlerRoutes from './routes/crawler'
import workbenchRoutes from './routes/workbench'
import jobsRoutes from './routes/jobs'
import taskTemplateRoutes from './routes/task_templates'
import taskLogRoutes from './routes/task_logs'
import assetRoutes from './routes/assets'
import runbookRoutes from './routes/runbook'
import knowledgeRoutes from './routes/knowledge'
import accountRoutes from './routes/accounts'
import personaRoutes from './routes/personas'
import staffRoutes from './routes/staff'
import leaveRoutes from './routes/leaves'
import notificationRoutes from './routes/notifications'


// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/content', contentGenerateRoutes)
app.use('/api/content', contentFeedbackRoutes)
app.use('/api/work_tasks', workTasksCompleteRoutes)
app.use('/api/work_tasks', workTasksUpdateRoutes)
app.use('/api/crawler', crawlerRoutes)
app.use('/api/jobs', jobsRoutes)
app.use('/api/workbench', workbenchRoutes)
app.use('/api/daily_tasks', workbenchRoutes) // Alias for backward compatibility
app.use('/api/admin/templates', taskTemplateRoutes)
app.use('/api/admin/logs', taskLogRoutes)
app.use('/api/assets', assetRoutes)
app.use('/api/runbook', runbookRoutes)
app.use('/api/knowledge', knowledgeRoutes)
app.use('/api/accounts', accountRoutes)
app.use('/api/personas', personaRoutes)
app.use('/api/team', staffRoutes)
app.use('/api/leaves', leaveRoutes)
app.use('/api/notifications', notificationRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
