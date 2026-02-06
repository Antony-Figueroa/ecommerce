export interface ProductRepository {
  findAll(options: {
    categoryId?: string | null
    search?: string
    page?: number
    limit?: number
    onlyActive?: boolean
  }): Promise<{ products: any[]; total: number }>
  findById(id: string): Promise<any | null>
  findBySku(sku: string): Promise<any | null>
  create(data: any): Promise<any>
  update(id: string, data: any): Promise<any>
  delete(id: string): Promise<void>
  getAllBrands(): Promise<string[]>
  findMany(options: any): Promise<any[]>
  findLowStock(): Promise<any[]>
  count(where: any): Promise<number>
  deleteImages(productId: string): Promise<void>
}
