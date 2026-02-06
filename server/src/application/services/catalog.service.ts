import PDFDocument from 'pdfkit'
import { ProductRepository } from '../../domain/repositories/product.repository.js'
import { EmailService } from './email.service.js'

export class CatalogService {
  constructor(
    private productRepo: ProductRepository,
    private emailService: EmailService
  ) {}

  async generateCatalogPDF(): Promise<Buffer> {
    const { products } = await this.productRepo.findAll({ limit: 100, onlyActive: true })

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 })
      const buffers: Buffer[] = []

      doc.on('data', buffers.push.bind(buffers))
      doc.on('end', () => resolve(Buffer.concat(buffers)))
      doc.on('error', reject)

      // Header
      doc.fontSize(25).text('Catálogo de Productos', { align: 'center' })
      doc.fontSize(15).text('Ana\'s Supplements', { align: 'center' })
      doc.moveDown()
      doc.fontSize(10).text(`Fecha: ${new Date().toLocaleDateString()}`, { align: 'right' })
      doc.moveDown()

      // Table Header
      const tableTop = 150
      doc.fontSize(12).font('Helvetica-Bold')
      doc.text('Producto', 50, tableTop)
      doc.text('Marca', 300, tableTop)
      doc.text('Precio', 450, tableTop, { align: 'right' })
      
      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke()

      // Products
      let y = tableTop + 30
      doc.font('Helvetica').fontSize(10)

      for (const product of products) {
        if (y > 700) {
          doc.addPage()
          y = 50
        }

        doc.text(product.name, 50, y, { width: 240 })
        doc.text(product.brand || 'N/A', 300, y)
        doc.text(`$${Number(product.price).toFixed(2)}`, 450, y, { align: 'right' })

        y += 25
        doc.moveTo(50, y - 5).lineTo(550, y - 5).strokeColor('#eeeeee').stroke()
      }

      doc.end()
    })
  }

  async requestCatalog(email: string) {
    const pdfBuffer = await this.generateCatalogPDF()
    await this.emailService.sendCatalogEmail(email, pdfBuffer)
  }
}
