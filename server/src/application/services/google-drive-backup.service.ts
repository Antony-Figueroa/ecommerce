import { google } from 'googleapis'
import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface DriveBackupConfig {
  folderId: string
  enabled: boolean
}

interface RemoteBackupFile {
  filename: string
  id: string
  modifiedTime: string
}

class GoogleDriveBackupService {
  private auth: any = null
  private drive: any = null
  private config: DriveBackupConfig | null = null
  private backupDir: string

  constructor() {
    this.backupDir = path.join(__dirname, '../../../../backups')
  }
  
  get isConfigured(): boolean {
    return this.drive !== null && this.config !== null
  }

  async initialize() {
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
    const enabled = process.env.GOOGLE_DRIVE_ENABLED === 'true'

    if (!enabled) {
      console.log('[GoogleDrive] ⚠️ GOOGLE_DRIVE_ENABLED no está habilitado')
      return
    }

    if (!folderId || folderId === 'tu_folder_id_de_drive') {
      console.log('[GoogleDrive] ⚠️ GOOGLE_DRIVE_FOLDER_ID no configurado')
      return
    }

    const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    let privateKey = process.env.GOOGLE_PRIVATE_KEY || ''

    if (!serviceEmail || !privateKey) {
      console.log('[GoogleDrive] ⚠️ Credenciales de Google no configuradas')
      return
    }

    privateKey = privateKey.replace(/\\n/g, '\n')

    try {
      const credentials = {
        type: 'service_account',
        client_email: serviceEmail,
        private_key: privateKey
      }
      
      this.auth = google.auth.fromJSON(credentials) as any
      this.auth.scopes = ['https://www.googleapis.com/auth/drive.file']

      this.drive = google.drive({ version: 'v3', auth: this.auth })
      this.config = { folderId, enabled: true }

      console.log('[GoogleDrive] ✅ Servicio de respaldos inicializado')
    } catch (error) {
      console.error('[GoogleDrive] ❌ Error al inicializar:', error)
    }
  }

  async uploadBackup(filename: string): Promise<{ success: boolean; fileId?: string; message: string }> {
    if (!this.isConfigured) {
      return { success: false, message: 'Google Drive no está configurado' }
    }

    try {
      const filePath = path.join(this.backupDir, filename)
      await fs.access(filePath)

      const fileContent = await fs.readFile(filePath)

      const response = await this.drive!.files.create({
        requestBody: {
          name: filename,
          mimeType: 'application/x-sqlite3',
          parents: [this.config!.folderId]
        },
        media: {
          mimeType: 'application/x-sqlite3',
          body: Buffer.from(fileContent)
        }
      })

      console.log(`[GoogleDrive] ✅ Subido: ${filename} (ID: ${response.data.id})`)
      return { success: true, fileId: response.data.id, message: `Subido: ${filename}` }
    } catch (error: any) {
      console.error(`[GoogleDrive] ❌ Error subiendo ${filename}:`, error.message)
      return { success: false, message: `Error: ${error.message}` }
    }
  }

  async downloadBackup(filename: string): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured) {
      return { success: false, message: 'Google Drive no está configurado' }
    }

    try {
      const searchResponse = await this.drive!.files.list({
        q: `name='${filename}' and '${this.config!.folderId}' in parents`,
        fields: 'files(id, name, modifiedTime)',
        pageSize: 1
      })

      if (!searchResponse.data.files || searchResponse.data.files.length === 0) {
        return { success: false, message: `Archivo no encontrado en Drive: ${filename}` }
      }

      const fileId = searchResponse.data.files[0].id

      const dest = fsSync.createWriteStream(path.join(this.backupDir, filename))
      
      await new Promise<void>((resolve, reject) => {
        this.drive.files.get({ fileId, alt: 'media' }, (err: any, res: any) => {
          if (err) {
            reject(err)
            return
          }
          res.data.pipe(dest)
          res.data.on('end', () => resolve())
          res.data.on('error', (err: any) => reject(err))
        })
      })

      console.log(`[GoogleDrive] ✅ Descargado: ${filename}`)
      return { success: true, message: `Descargado: ${filename}` }
    } catch (error: any) {
      console.error(`[GoogleDrive] ❌ Error descargando ${filename}:`, error.message)
      return { success: false, message: `Error: ${error.message}` }
    }
  }

  async listRemoteBackups(): Promise<RemoteBackupFile[]> {
    if (!this.isConfigured) {
      return []
    }

    try {
      const response = await this.drive!.files.list({
        q: `'${this.config!.folderId}' in parents and name contains 'db_backup_'`,
        fields: 'files(id, name, modifiedTime)',
        orderBy: 'modifiedTime desc'
      })

      return (response.data.files || []).map((file: any) => ({
        filename: file.name || '',
        id: file.id || '',
        modifiedTime: file.modifiedTime || ''
      }))
    } catch (error: any) {
      console.error('[GoogleDrive] ❌ Error listando respaldos:', error.message)
      return []
    }
  }

  async getLatestRemoteBackup(): Promise<{ filename: string; id: string } | null> {
    const backups = await this.listRemoteBackups()
    if (backups.length === 0) return null
    
    const sorted = backups.sort((a, b) => 
      new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime()
    )
    
    return { filename: sorted[0].filename, id: sorted[0].id }
  }

  async syncFromRemote(): Promise<{ success: boolean; filename?: string; message: string }> {
    if (!this.isConfigured) {
      return { success: false, message: 'Google Drive no está configurado' }
    }

    try {
      const latest = await this.getLatestRemoteBackup()
      
      if (!latest) {
        return { success: false, message: 'No hay respaldos en Google Drive' }
      }

      const localBackups = await fs.readdir(this.backupDir)
      const localLatest = localBackups
        .filter(f => f.startsWith('db_backup_') && f.endsWith('.db'))
        .sort()
        .reverse()[0]

      if (localLatest === latest.filename) {
        return { success: true, filename: latest.filename, message: 'Ya tienes el respaldo más reciente' }
      }

      const result = await this.downloadBackup(latest.filename)
      
      if (result.success) {
        return { success: true, filename: latest.filename, message: `Sincronizado: ${latest.filename}` }
      }

      return { success: false, message: result.message }
    } catch (error: any) {
      return { success: false, message: `Error: ${error.message}` }
    }
  }
}

export const googleDriveBackupService = new GoogleDriveBackupService()
