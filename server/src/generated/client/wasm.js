
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.SystemAuditLogScalarFieldEnum = {
  id: 'id',
  entityType: 'entityType',
  entityId: 'entityId',
  action: 'action',
  userId: 'userId',
  userName: 'userName',
  details: 'details',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  createdAt: 'createdAt'
};

exports.Prisma.BusinessEventScalarFieldEnum = {
  id: 'id',
  type: 'type',
  title: 'title',
  description: 'description',
  date: 'date',
  amount: 'amount',
  status: 'status',
  isFuture: 'isFuture',
  alertSent: 'alertSent',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  passwordHash: 'passwordHash',
  username: 'username',
  googleId: 'googleId',
  avatarUrl: 'avatarUrl',
  role: 'role',
  isActive: 'isActive',
  emailVerified: 'emailVerified',
  verificationToken: 'verificationToken',
  verificationTokenExpires: 'verificationTokenExpires',
  resetPasswordToken: 'resetPasswordToken',
  resetPasswordExpires: 'resetPasswordExpires',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  name: 'name',
  phone: 'phone',
  address: 'address'
};

exports.Prisma.FavoriteScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  productId: 'productId',
  createdAt: 'createdAt'
};

exports.Prisma.ProductScalarFieldEnum = {
  id: 'id',
  sku: 'sku',
  productCode: 'productCode',
  name: 'name',
  slug: 'slug',
  description: 'description',
  price: 'price',
  currency: 'currency',
  purchasePrice: 'purchasePrice',
  profitMargin: 'profitMargin',
  image: 'image',
  brand: 'brand',
  format: 'format',
  weight: 'weight',
  stock: 'stock',
  minStock: 'minStock',
  inStock: 'inStock',
  isActive: 'isActive',
  isFeatured: 'isFeatured',
  isOffer: 'isOffer',
  originalPrice: 'originalPrice',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  brandId: 'brandId'
};

exports.Prisma.ProviderScalarFieldEnum = {
  id: 'id',
  name: 'name',
  country: 'country',
  address: 'address',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InventoryBatchScalarFieldEnum = {
  id: 'id',
  code: 'code',
  providerId: 'providerId',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InventoryBatchItemScalarFieldEnum = {
  id: 'id',
  batchId: 'batchId',
  productId: 'productId',
  quantity: 'quantity',
  soldQuantity: 'soldQuantity',
  unitCostUSD: 'unitCostUSD',
  unitSaleUSD: 'unitSaleUSD',
  entryDate: 'entryDate',
  discounted: 'discounted',
  discountPercent: 'discountPercent',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CartScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  lastInteraction: 'lastInteraction',
  reminderSent: 'reminderSent',
  lastReminderSent: 'lastReminderSent'
};

exports.Prisma.CartItemScalarFieldEnum = {
  id: 'id',
  cartId: 'cartId',
  productId: 'productId',
  quantity: 'quantity',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProductImageScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  url: 'url',
  thumbnail: 'thumbnail',
  medium: 'medium',
  large: 'large',
  isMain: 'isMain',
  sortOrder: 'sortOrder',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BatchScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  batchNumber: 'batchNumber',
  expirationDate: 'expirationDate',
  stock: 'stock',
  purchasePrice: 'purchasePrice',
  salePrice: 'salePrice',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProductPriceHistoryScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  purchasePrice: 'purchasePrice',
  salePrice: 'salePrice',
  batchQuantity: 'batchQuantity',
  batchNumber: 'batchNumber',
  createdAt: 'createdAt'
};

exports.Prisma.CategoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  description: 'description',
  image: 'image',
  icon: 'icon',
  isActive: 'isActive',
  sortOrder: 'sortOrder',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RequirementScalarFieldEnum = {
  id: 'id',
  code: 'code',
  supplier: 'supplier',
  status: 'status',
  subtotalUSD: 'subtotalUSD',
  totalUSD: 'totalUSD',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RequirementItemScalarFieldEnum = {
  id: 'id',
  requirementId: 'requirementId',
  productId: 'productId',
  name: 'name',
  quantity: 'quantity',
  unitCost: 'unitCost',
  total: 'total',
  createdAt: 'createdAt',
  batchNumber: 'batchNumber',
  expirationDate: 'expirationDate'
};

exports.Prisma.SaleScalarFieldEnum = {
  id: 'id',
  saleNumber: 'saleNumber',
  userId: 'userId',
  customerName: 'customerName',
  customerPhone: 'customerPhone',
  customerEmail: 'customerEmail',
  deliveryAddress: 'deliveryAddress',
  paymentMethod: 'paymentMethod',
  status: 'status',
  subtotalUSD: 'subtotalUSD',
  shippingCostUSD: 'shippingCostUSD',
  totalUSD: 'totalUSD',
  bcvRate: 'bcvRate',
  totalBS: 'totalBS',
  profitUSD: 'profitUSD',
  profitBS: 'profitBS',
  isPaid: 'isPaid',
  paidAmountUSD: 'paidAmountUSD',
  deliveryStatus: 'deliveryStatus',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PaymentScalarFieldEnum = {
  id: 'id',
  saleId: 'saleId',
  amountUSD: 'amountUSD',
  amountBS: 'amountBS',
  bcvRate: 'bcvRate',
  paymentMethod: 'paymentMethod',
  reference: 'reference',
  notes: 'notes',
  paidAt: 'paidAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InstallmentScalarFieldEnum = {
  id: 'id',
  saleId: 'saleId',
  amountUSD: 'amountUSD',
  dueDate: 'dueDate',
  status: 'status',
  paidAmount: 'paidAmount',
  paidAt: 'paidAt',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PaymentProofScalarFieldEnum = {
  id: 'id',
  installmentId: 'installmentId',
  proofUrl: 'proofUrl',
  amountUSD: 'amountUSD',
  status: 'status',
  notes: 'notes',
  paidAt: 'paidAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SaleItemScalarFieldEnum = {
  id: 'id',
  saleId: 'saleId',
  productId: 'productId',
  name: 'name',
  quantity: 'quantity',
  unitCost: 'unitCost',
  unitPrice: 'unitPrice',
  total: 'total',
  profitPerUnit: 'profitPerUnit',
  totalProfit: 'totalProfit',
  status: 'status',
  createdAt: 'createdAt',
  originalQuantity: 'originalQuantity'
};

exports.Prisma.SaleAuditLogScalarFieldEnum = {
  id: 'id',
  saleId: 'saleId',
  action: 'action',
  oldStatus: 'oldStatus',
  newStatus: 'newStatus',
  userId: 'userId',
  reason: 'reason',
  createdAt: 'createdAt',
  newDeliveryStatus: 'newDeliveryStatus',
  oldDeliveryStatus: 'oldDeliveryStatus'
};

exports.Prisma.BCVRateScalarFieldEnum = {
  id: 'id',
  rate: 'rate',
  source: 'source',
  isActive: 'isActive',
  validFrom: 'validFrom',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InventoryLogScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  changeType: 'changeType',
  previousStock: 'previousStock',
  newStock: 'newStock',
  changeAmount: 'changeAmount',
  reason: 'reason',
  createdAt: 'createdAt'
};

exports.Prisma.BrandScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SettingScalarFieldEnum = {
  id: 'id',
  key: 'key',
  value: 'value',
  type: 'type',
  group: 'group',
  label: 'label',
  description: 'description',
  isPublic: 'isPublic',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SettingHistoryScalarFieldEnum = {
  id: 'id',
  settingId: 'settingId',
  oldValue: 'oldValue',
  newValue: 'newValue',
  userId: 'userId',
  reason: 'reason',
  createdAt: 'createdAt'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  type: 'type',
  priority: 'priority',
  category: 'category',
  title: 'title',
  message: 'message',
  isRead: 'isRead',
  userId: 'userId',
  link: 'link',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.NotificationSettingScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  orders: 'orders',
  favorites: 'favorites',
  promotions: 'promotions',
  system: 'system',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};


exports.Prisma.ModelName = {
  SystemAuditLog: 'SystemAuditLog',
  BusinessEvent: 'BusinessEvent',
  User: 'User',
  Favorite: 'Favorite',
  Product: 'Product',
  Provider: 'Provider',
  InventoryBatch: 'InventoryBatch',
  InventoryBatchItem: 'InventoryBatchItem',
  Cart: 'Cart',
  CartItem: 'CartItem',
  ProductImage: 'ProductImage',
  Batch: 'Batch',
  ProductPriceHistory: 'ProductPriceHistory',
  Category: 'Category',
  Requirement: 'Requirement',
  RequirementItem: 'RequirementItem',
  Sale: 'Sale',
  Payment: 'Payment',
  Installment: 'Installment',
  PaymentProof: 'PaymentProof',
  SaleItem: 'SaleItem',
  SaleAuditLog: 'SaleAuditLog',
  BCVRate: 'BCVRate',
  InventoryLog: 'InventoryLog',
  Brand: 'Brand',
  Setting: 'Setting',
  SettingHistory: 'SettingHistory',
  Notification: 'Notification',
  NotificationSetting: 'NotificationSetting'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
