import { Router } from 'express'
import path from 'node:path'
import fs from 'node:fs'
import multer from 'multer'
import { randomUUID } from 'node:crypto'
import { requireAuth } from '../middleware/auth'
import { AppError } from '../lib/errors'
import { audit } from '../lib/audit'

// ─────────────────────────────────────────────────────────────
// Upload de archivos (F2.A/F2.B): comprobantes de pago, entregas
// de tareas y materiales. Almacenamiento local en
// web/server/uploads/ (gitignored) servido estáticamente en
// /uploads/* desde el servidor Express y proxeado por Vite.
// ─────────────────────────────────────────────────────────────

const router = Router()
router.use(requireAuth)

const UPLOAD_DIR = path.resolve(process.cwd(), 'server', 'uploads')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

// Solo imágenes/PDF/audio/texto — evita subir binarios ejecutables
const ALLOWED = new Map([
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.webp', 'image/webp'],
  ['.pdf', 'application/pdf'],
  ['.doc', 'application/msword'],
  ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ['.mp3', 'audio/mpeg'],
  ['.m4a', 'audio/mp4'],
  ['.wav', 'audio/wav'],
  ['.txt', 'text/plain'],
  ['.csv', 'text/csv'],
])

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${Date.now()}-${randomUUID()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB máx.
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (!ALLOWED.has(ext)) {
      cb(new AppError(400, 'FILE_TYPE', `Tipo de archivo no permitido: ${ext || '(sin extensión)'}`))
      return
    }
    cb(null, true)
  },
})

// POST /api/upload?carpeta=comprobantes|entregas|materiales — multipart field "file"
// Devuelve { data: { url: '/uploads/<archivo>', nombre, tipo, tamanoBytes } }
router.post('/', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof AppError) return next(err)
      if (err?.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError(400, 'FILE_TOO_LARGE', 'El archivo supera los 10 MB'))
      }
      return next(new AppError(400, 'UPLOAD_ERROR', err.message || 'Error al subir el archivo'))
    }
    if (!req.file) {
      return next(new AppError(400, 'FILE_REQUIRED', 'Campo "file" (multipart) requerido'))
    }
    const url = `/uploads/${req.file.filename}`
    audit(req.user!.id, 'UPLOAD', 'File', req.file.filename).catch(() => {})
    res.status(201).json({
      data: {
        url,
        nombre: req.file.originalname,
        tipo: req.file.mimetype,
        tamanoBytes: req.file.size,
      },
    })
  })
})

export default router
