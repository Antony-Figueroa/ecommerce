/// <reference types="express" />
/// <reference types="multer" />
import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'

export class UploadService {
  private UPLOAD_PATH = 'uploads/products'

  async processImage(file: Express.Multer.File) {
    const filename = `${uuidv4()}.webp`
    const originalPath = path.join(this.UPLOAD_PATH, `original-${filename}`)
    const thumbnailPath = path.join(this.UPLOAD_PATH, `thumb-${filename}`)
    const mediumPath = path.join(this.UPLOAD_PATH, `medium-${filename}`)
    const largePath = path.join(this.UPLOAD_PATH, `large-${filename}`)

    // Ensure directory exists
    await fs.mkdir(this.UPLOAD_PATH, { recursive: true })

    // Save original as WebP for optimization
    const original = sharp(file.buffer)

    await Promise.all([
      // Thumbnail: 150x150
      original.clone()
        .resize(150, 150, { fit: 'cover' })
        .webp({ quality: 80 })
        .toFile(thumbnailPath),

      // Medium: 600x600
      original.clone()
        .resize(600, 600, { fit: 'inside' })
        .webp({ quality: 85 })
        .toFile(mediumPath),

      // Large: 1200x1200
      original.clone()
        .resize(1200, 1200, { fit: 'inside' })
        .webp({ quality: 90 })
        .toFile(largePath),
      
      // Full/Original size but optimized
      original.clone()
        .webp({ quality: 95 })
        .toFile(originalPath)
    ])

    return {
      url: `/uploads/products/original-${filename}`,
      thumbnail: `/uploads/products/thumb-${filename}`,
      medium: `/uploads/products/medium-${filename}`,
      large: `/uploads/products/large-${filename}`,
    }
  }

  async deleteImage(urls: string[]) {
    for (const url of urls) {
      if (!url) continue
      try {
        const filePath = path.join(process.cwd(), url.startsWith('/') ? url.slice(1) : url)
        await fs.unlink(filePath)
      } catch (error) {
        console.error(`Failed to delete file: ${url}`, error)
      }
    }
  }
}
