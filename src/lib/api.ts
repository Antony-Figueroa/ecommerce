export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

class ApiClient {
  private token: string | null = null

  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('token')
    }
    return this.token
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken()
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
      
      let errorMessage = 'Error desconocido'
      if (typeof errorData.error === 'string') {
        errorMessage = errorData.error
      } else if (errorData.error && typeof errorData.error.message === 'string') {
        errorMessage = errorData.error.message
      } else if (typeof errorData.message === 'string') {
        errorMessage = errorData.message
      } else {
        errorMessage = JSON.stringify(errorData)
      }
      
      const error = new Error(errorMessage || `HTTP ${response.status}`) as any
      error.status = response.status
      error.data = errorData
      throw error
    }

    if (response.status === 204) {
      return {} as T
    }

    const text = await response.text()
    return text ? JSON.parse(text) : {} as T
  }

  // Métodos genéricos
  async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T>(endpoint: string, body?: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async put<T>(endpoint: string, body?: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  // BCV
  async getBCVRate() {
    return this.request<{ rate: number }>('/bcv')
  }

  async getBCVStatus() {
    return this.request<{ currentRate: { rate: number; timestamp?: string; createdAt?: string } | null; history: any[] }>('/admin/bcv/status')
  }

  async forceBCVUpdate() {
    return this.request<{ message: string; rate: number; record?: { rate: number; timestamp?: string; createdAt?: string } }>('/admin/bcv/update', {
      method: 'POST',
    })
  }

  async setBCVRateManual(rate: number) {
    return this.request<{ message: string; rate: number; record?: { rate: number; timestamp?: string; createdAt?: string } }>('/admin/bcv/manual', {
      method: 'POST',
      body: JSON.stringify({ rate }),
    })
  }

  // Settings
  async getPublicSettings() {
    return this.request<Record<string, any>>('/settings/public')
  }

  // Notificaciones Admin
  async getAdminNotifications() {
    return this.request<any[]>('/admin/notifications')
  }

  async requestCatalog(email: string) {
    return this.request('/catalog/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async getNotificationSettings() {
    return this.request<any>('/notifications/settings')
  }

  async updateNotificationSettings(settings: {
    orders?: boolean
    favorites?: boolean
    promotions?: boolean
    system?: boolean
  }) {
    return this.request<any>('/notifications/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    })
  }

  // Settings
  async getSettings() {
    return this.request<Record<string, any[]>>('/admin/settings')
  }

  async updateSettingsBulk(updates: { key: string; value: any; reason?: string }[]) {
    return this.request<{ message: string; results: any[] }>('/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify({ updates }),
    })
  }

  async getSettingHistory(key: string) {
    return this.request<any[]>(`/admin/settings/${key}/history`)
  }

  async revertSetting(historyId: string) {
    return this.request(`/admin/settings/revert/${historyId}`, {
      method: 'POST'
    })
  }

  // Auth
  async getMe() {
    return this.request<{
      id: string;
      email: string;
      name: string;
      phone: string | null;
      role: string;
      isActive: boolean;
      createdAt: string;
      avatarUrl?: string | null;
    }>('/auth/me')
  }

  async updateProfile(data: { name?: string; phone?: string; avatarUrl?: string; address?: string; password?: string; currentPassword?: string }) {
    return this.request<any>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async login(email: string, password: string) {
    const result = await this.request<{ success: boolean; token: string; user: any }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    )
    this.setToken(result.token)
    return result
  }

  async register(data: { name: string; email: string; password: string; phone?: string }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async googleAuth(credential: string) {
    const result = await this.request<{
      success: boolean;
      token?: string;
      user?: any;
      requiresRegistration?: boolean;
      googleData?: any;
    }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    })
    
    if (result.token) {
      this.setToken(result.token)
    }
    
    return result
  }

  async googleRegister(data: {
    googleId: string;
    email: string;
    name: string;
    avatarUrl?: string | null;
    username: string;
    password?: string;
  }) {
    const result = await this.request<{ success: boolean; token: string; user: any }>(
      '/auth/google/register',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    )
    this.setToken(result.token)
    return result
  }

  async checkUsername(username: string) {
    return this.request<{ available: boolean; message?: string }>(
      `/auth/check-username/${username}`
    )
  }

  logout() {
    this.setToken(null)
  }

  // Categories
  async getCategories() {
    return this.request<{ categories: any[] }>('/categories')
  }

  async getAdminCategories() {
    return this.request<{ categories: any[] }>('/admin/categories')
  }

  async seedCategories() {
    return this.request<{ message: string; count: number; categories: any[] }>('/admin/categories/seed', {
      method: 'POST'
    })
  }

  async createCategory(data: { name: string; description?: string; image?: string; icon?: string; isActive?: boolean; sortOrder?: number }) {
    return this.request('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCategory(id: string, data: Partial<{ name: string; description: string; image: string; icon: string; isActive: boolean; sortOrder: number }>) {
    return this.request(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteCategory(id: string) {
    return this.request(`/admin/categories/${id}`, {
      method: 'DELETE',
    })
  }

  async toggleCategoryStatus(id: string, isActive: boolean) {
    return this.request(`/admin/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    })
  }

  // Productos
  async getBrands() {
    return this.request<string[]>('/admin/products/brands')
  }

  async getPublicProducts(params: { categoryId?: string; categoryIds?: string[]; search?: string } = {}) {
    const searchParams = new URLSearchParams()
    if (params?.categoryId) searchParams.set('categoryId', params.categoryId)
    if (params?.categoryIds && params.categoryIds.length > 0) {
      params.categoryIds.forEach(id => searchParams.append('categoryIds[]', id))
    }
    if (params?.search) searchParams.set('search', params.search)
    const query = searchParams.toString()
    return this.request<{ products: any[] }>(`/products/public${query ? `?${query}` : ''}`)
  }

  async getProduct(id: string) {
    return this.request<{ product: any }>(`/products/${id}`)
  }

  // Favorites
  async getFavorites() {
    return this.request<{ favorites: any[] }>('/favorites')
  }

  async checkFavorite(productId: string) {
    return this.request<{ isFavorite: boolean }>(`/favorites/check/${productId}`)
  }

  async addFavorite(productId: string) {
    return this.request(`/favorites/${productId}`, {
      method: 'POST',
    })
  }

  async removeFavorite(productId: string) {
    return this.request(`/favorites/${productId}`, {
      method: 'DELETE',
    })
  }

  // Customer Sales (Orders)
  async getMyOrders(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    const query = searchParams.toString()
    return this.request<{ sales: any[]; pagination: any }>(
      `/sales${query ? `?${query}` : ''}`
    )
  }

  async getMyOrderDetail(id: string) {
    return this.request<any>(`/sales/${id}`)
  }

  async cancelMyOrder(id: string, reason?: string) {
    return this.request(`/sales/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  }

  // Admin Products
  async getAdminProducts(params?: { page?: number; limit?: number; categoryId?: string; categoryIds?: string[]; search?: string; onlyActive?: boolean }) {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.categoryId) searchParams.set('categoryId', params.categoryId)
    if (params?.categoryIds && params.categoryIds.length > 0) {
      params.categoryIds.forEach(id => searchParams.append('categoryIds[]', id))
    }
    if (params?.search) searchParams.set('search', params.search)
    if (params?.onlyActive !== undefined) searchParams.set('onlyActive', params.onlyActive.toString())
    const query = searchParams.toString()
    return this.request<{ products: any[]; pagination: any }>(
      `/admin/products${query ? `?${query}` : ''}`
    )
  }

  async createProduct(data: any) {
    return this.request('/admin/products', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateProduct(id: string, data: any) {
    return this.request(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteProduct(id: string) {
    return this.request(`/admin/products/${id}`, {
      method: 'DELETE',
    })
  }

  async getInventoryReport() {
    return this.request('/admin/products/inventory-report')
  }

  async getInventoryLogs(params?: { productId?: string; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.productId) searchParams.set('productId', params.productId)
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    const query = searchParams.toString()
    return this.request<{ logs: any[] }>(
      `/admin/products/inventory-logs${query ? `?${query}` : ''}`
    )
  }

  // Admin Sales
  async getSales(params?: { page?: number; limit?: number; status?: string; startDate?: string; endDate?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.status) searchParams.set('status', params.status)
    if (params?.startDate) searchParams.set('startDate', params.startDate)
    if (params?.endDate) searchParams.set('endDate', params.endDate)
    const query = searchParams.toString()
    return this.request<{ sales: any[]; pagination: any }>(
      `/admin/sales${query ? `?${query}` : ''}`
    )
  }

  async createSale(data: any) {
    return this.request('/admin/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateSaleStatus(id: string, status: string, reason?: string) {
    return this.request(`/admin/sales/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    })
  }

  async updateSaleDeliveryStatus(id: string, deliveryStatus: string, reason?: string) {
    return this.request(`/admin/sales/${id}/delivery-status`, {
      method: 'PATCH',
      body: JSON.stringify({ deliveryStatus, reason }),
    })
  }

  async confirmSalePayment(id: string, amount: number, reason?: string) {
    return this.request(`/admin/sales/${id}/confirm-payment`, {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    })
  }

  async cancelSale(id: string) {
    return this.request(`/admin/sales/${id}/cancel`, {
      method: 'POST',
    })
  }

  async updateSaleItemStatus(saleId: string, itemId: string, status: string) {
    return this.request(`/admin/sales/${saleId}/items/${itemId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  }

  async updateSaleItemQuantity(saleId: string, itemId: string, quantity: number) {
    return this.request(`/admin/sales/${saleId}/items/${itemId}/quantity`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    })
  }

  async acceptAllSaleItems(saleId: string) {
    return this.request(`/admin/sales/${saleId}/accept-all`, {
      method: 'POST',
    })
  }

  async respondToProposal(saleId: string, status: 'ACCEPTED' | 'REJECTED') {
    return this.request(`/sales/${saleId}/respond-proposal`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    })
  }

  async getBCVHistory(limit = 50) {
    return this.request<{ history: any[] }>(`/admin/sales/bcv/history?limit=${limit}`)
  }

  // Admin Requirements
  async getRequirements(params?: { page?: number; limit?: number; status?: string; supplier?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.status) searchParams.set('status', params.status)
    if (params?.supplier) searchParams.set('supplier', params.supplier)
    const query = searchParams.toString()
    return this.request<{ requirements: any[]; pagination: any }>(
      `/admin/requirements${query ? `?${query}` : ''}`
    )
  }

  async createRequirement(data: any) {
    return this.request('/admin/requirements', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getRequirement(id: string) {
    return this.request<{ requirement: any }>(`/admin/requirements/${id}`)
  }

  // Admin Upload
  async uploadImages(files: File[]) {
    const formData = new FormData()
    files.forEach(file => formData.append('images', file))

    const token = this.getToken()
    const response = await fetch(`${API_BASE}/admin/upload/images`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error al subir imágenes' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json() as Promise<Array<{
      url: string
      thumbnail: string
      medium: string
      large: string
    }>>
  }

  async updateRequirementStatus(id: string, status: string) {
    return this.request(`/admin/requirements/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  }

  async receiveRequirement(id: string) {
    return this.request(`/admin/requirements/${id}/receive`, {
      method: 'POST',
    })
  }

  async cancelRequirement(id: string) {
    return this.request(`/admin/requirements/${id}/cancel`, {
      method: 'POST',
    })
  }

  async deleteRequirement(id: string) {
    return this.request(`/admin/requirements/${id}`, {
      method: 'DELETE',
    })
  }

  async getRequirementsSummary() {
    return this.request<any>('/admin/requirements/summary')
  }

  // Reports
  async getDashboard() {
    return this.request<any>('/admin/reports/dashboard')
  }

  async getProfitabilityReport() {
    return this.request<any>('/admin/reports/profitability')
  }

  async getSalesReport(params?: { startDate?: string; endDate?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.startDate) searchParams.set('startDate', params.startDate)
    if (params?.endDate) searchParams.set('endDate', params.endDate)
    const query = searchParams.toString()
    return this.request<any>(`/admin/reports/sales${query ? `?${query}` : ''}`)
  }

  async getInventoryReportAdmin() {
    return this.request<any>('/admin/reports/inventory')
  }

  async getRequirementsReport(params?: { status?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    const query = searchParams.toString()
    return this.request<any>(`/admin/reports/requirements${query ? `?${query}` : ''}`)
  }

  async getAnalyticsReport(params?: { startDate?: string; endDate?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.startDate) searchParams.set('startDate', params.startDate)
    if (params?.endDate) searchParams.set('endDate', params.endDate)
    const query = searchParams.toString()
    return this.request<any>(`/admin/reports/analytics${query ? `?${query}` : ''}`)
  }

  // Admin Customers
  async getCustomers(params?: { page?: number; limit?: number; search?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.search) searchParams.set('search', params.search)
    const query = searchParams.toString()
    return this.request<{ customers: any[]; pagination: any }>(`/admin/customers${query ? `?${query}` : ''}`)
  }

  async getCustomer(id: string) {
    return this.request<{ customer: any }>(`/admin/customers/${id}`)
  }

  async getCustomerOrders(customerId: string) {
    return this.request<{ orders: any[] }>(`/admin/customers/${customerId}/orders`)
  }

  async updateCustomer(id: string, data: { name?: string; email?: string; phone?: string; isActive?: boolean }) {
    return this.request(`/admin/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteCustomer(id: string) {
    return this.request(`/admin/customers/${id}`, {
      method: 'DELETE',
    })
  }

  // Admin Stats
  async getStats() {
    return this.request<any>('/admin/stats')
  }

  // Admin Management
  async getAdmins() {
    return this.request<{ success: boolean; admins: any[] }>('/admin/management')
  }

  async createAdmin(data: { name: string; email: string; password: string; username?: string; phone?: string }) {
    return this.request<{ success: boolean; user: any }>('/admin/management', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Notifications (Admin)
  async getAdminUnreadNotifications() {
    return this.request<any[]>('/admin/notifications/unread')
  }

  async getAdminAllNotifications(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    const query = searchParams.toString()
    return this.request<{ notifications: any[]; pagination: any }>(
      `/admin/notifications${query ? `?${query}` : ''}`
    )
  }

  async markAdminNotificationRead(id: string) {
    return this.request(`/admin/notifications/${id}/read`, {
      method: 'POST',
    })
  }

  async markAllAdminNotificationsRead() {
    return this.request('/admin/notifications/read-all', {
      method: 'POST',
    })
  }

  async deleteAdminNotification(id: string) {
    return this.request(`/admin/notifications/${id}`, {
      method: 'DELETE',
    })
  }

  // Notifications (Client)
  async getClientUnreadNotifications() {
    return this.request<any[]>('/notifications/unread')
  }

  async getClientNotifications() {
    return this.request<any[]>('/notifications')
  }

  async markClientNotificationRead(id: string) {
    return this.request(`/notifications/${id}/read`, {
      method: 'POST',
    })
  }

  async markAllClientNotificationsRead() {
    return this.request('/notifications/read-all', {
      method: 'POST',
    })
  }

  // Cart
  async getCart() {
    return this.request<any>('/cart')
  }

  async addToCart(productId: string, quantity: number) {
    return this.request<any>('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    })
  }

  async updateCartItem(productId: string, quantity: number) {
    return this.request<any>(`/cart/items/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    })
  }

  async removeFromCart(productId: string) {
    return this.request<any>(`/cart/items/${productId}`, {
      method: 'DELETE',
    })
  }

  async clearCart() {
    return this.request<any>('/cart', {
      method: 'DELETE',
    })
  }
}

export const api = new ApiClient()

export function formatPriceUSD(price: number): string {
  return `$${price.toFixed(2)}`
}
