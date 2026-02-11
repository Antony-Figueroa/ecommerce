export interface SaleRepository {
  create(data: any): Promise<any>
  findById(id: string): Promise<any | null>
  findBySaleNumber(saleNumber: string): Promise<any | null>
  findAll(options: any): Promise<any[]>
  count(where: any): Promise<number>
  getSummary(options: any): Promise<any>
  getStats(options: any): Promise<any>
  update(id: string, data: any): Promise<any>
  updateItem(itemId: string, data: any): Promise<any>
  createAuditLog(data: {
    saleId: string
    action: string
    oldStatus?: string
    newStatus?: string
    oldDeliveryStatus?: string
    newDeliveryStatus?: string
    userId?: string
    reason?: string
  }): Promise<any>
  findDuplicate(data: {
    customerPhone: string
    totalUSD: number
    minutesAgo: number
  }): Promise<any | null>
}

export interface PaymentRepository {
  create(data: any): Promise<any>
  findById(id: string): Promise<any | null>
  findBySaleId(saleId: string): Promise<any[]>
}

export interface InstallmentRepository {
  create(data: any): Promise<any>
  createMany(data: any[]): Promise<any>
  findById(id: string): Promise<any | null>
  findBySaleId(saleId: string): Promise<any[]>
  update(id: string, data: any): Promise<any>
  findOverdue(date: Date): Promise<any[]>
}

export interface PaymentProofRepository {
  create(data: any): Promise<any>
  findById(id: string): Promise<any | null>
  findByInstallmentId(installmentId: string): Promise<any[]>
  findByStatus(status: string): Promise<any[]>
  update(id: string, data: any): Promise<any>
}

export interface NotificationRepository {
  create(data: { 
    type: string; 
    priority?: string;
    category?: string;
    title: string; 
    message: string; 
    userId?: string;
    link?: string;
    metadata?: string;
  }): Promise<any>
  findUnread(userId?: string): Promise<any[]>
  findAll(options: { 
    userId?: string; 
    category?: string;
    limit?: number; 
    skip?: number;
  }): Promise<any[]>
  count(userId?: string, category?: string): Promise<number>
  update(id: string, data: any): Promise<any>
  findFirst(where: any): Promise<any | null>
  markAllAsRead(userId?: string, category?: string): Promise<void>
  delete(id: string): Promise<void>
}

export interface RequirementRepository {
  create(data: any): Promise<any>
  findById(id: string): Promise<any | null>
  findByCode(code: string): Promise<any | null>
  findAll(options: any): Promise<any[]>
  count(where: any): Promise<number>
  update(id: string, data: any): Promise<any>
  delete(id: string): Promise<void>
  getSummary(): Promise<any>
  groupBy(options: any): Promise<any[]>
  aggregate(options: any): Promise<any>
}

export interface BatchRepository {
  findMany(options: any): Promise<any[]>
  findNearExpiry(days: number): Promise<any[]>
  update(id: string, data: any): Promise<any>
  create(data: any): Promise<any>
}

export interface NotificationSettingRepository {
  findByUserId(userId: string): Promise<any | null>
  upsert(userId: string, data: {
    orders?: boolean
    favorites?: boolean
    promotions?: boolean
    system?: boolean
  }): Promise<any>
}
