export interface ProductRepository {
  findAll(options: {
    categoryId?: string | null
    categoryIds?: string[] | null
    search?: string
    page?: number
    limit?: number
    onlyActive?: boolean
    isActive?: boolean
    isFeatured?: boolean
    isOffer?: boolean
  }): Promise<{ products: any[]; total: number }>
  findById(id: string): Promise<any | null>
  findBySku(sku: string): Promise<any | null>
  findByProductCode(productCode: string): Promise<any | null>
  create(data: any, tx?: any): Promise<any>
  update(id: string, data: any, tx?: any): Promise<any>
  delete(id: string, tx?: any): Promise<void>
  getAllBrands(): Promise<string[]>
  findMany(options: any): Promise<any[]>
  findLowStock(): Promise<any[]>
  count(where: any): Promise<number>
  deleteImages(productId: string, tx?: any): Promise<void>
}
