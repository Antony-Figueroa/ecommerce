export interface ProductImageDTO {
  url: string;
  thumbnail?: string | null;
  medium?: string | null;
  large?: string | null;
  isMain?: boolean;
  sortOrder?: number;
}

export interface CreateProductDTO {
  sku?: string | null;
  productCode: string;
  name: string;
  description: string;
  price?: number;
  purchasePrice?: number;
  profitMargin?: number;
  image?: string | null;
  images?: ProductImageDTO[];
  categoryIds: string[];
  brand?: string | null;
  format?: string | null;
  weight?: string | null;
  stock?: number;
  minStock?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  isOffer?: boolean;
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> {
  // Campos adicionales específicos para actualización si fueran necesarios
}
