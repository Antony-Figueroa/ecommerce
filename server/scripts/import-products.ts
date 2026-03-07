
import { productManager } from '../src/shared/container.js';
import { prisma } from '../src/infrastructure/persistence/prisma.client.js';

const productsToImport = [ 
   { 
     "nombre": "Triple Omega 3-6-9", 
     "precio_costo_walmart": 6.88, 
     "stock_inicial": 5, 
     "categoria": "Salud Cardiovascular", 
     "marca": "Spring Valley", 
     "formato": "Capsulas", 
     "descripcion": "Mezcla de aceites para el corazón y articulaciones" 
   }, 
   { 
     "nombre": "Glucosamine Chondroitin", 
     "precio_costo_walmart": 19.94, 
     "stock_inicial": 2, 
     "categoria": "Cuidado Articular", 
     "marca": "Spring Valley", 
     "formato": "Tabletas", 
     "descripcion": "Apoyo para la movilidad y salud de las articulaciones" 
   }, 
   { 
     "nombre": "Biotina", 
     "precio_costo_walmart": 8.88, 
     "stock_inicial": 2, 
     "categoria": "Cabello, Piel y Uñas", 
     "marca": "Spring Valley", 
     "formato": "Gomitas", 
     "descripcion": "Promueve la salud del cabello y metabolismo energético" 
   }, 
   { 
     "nombre": "Centrum Silver Women", 
     "precio_costo_walmart": 10.76, 
     "stock_inicial": 2, 
     "categoria": "Multivitamínico", 
     "marca": "Centrum", 
     "formato": "Tabletas", 
     "descripcion": "Complejo para mujeres 50+ con vitaminas B, C, D3 y E" 
   }, 
   { 
     "nombre": "Calcio, Magnesio y Zinc + D3", 
     "precio_costo_walmart": 6.57, 
     "stock_inicial": 4, 
     "categoria": "Salud Ósea", 
     "marca": "Spring Valley", 
     "formato": "Tabletas", 
     "descripcion": "Combinación esencial para huesos y función muscular" 
   }, 
   { 
     "nombre": "Vitamina C con Rose Hips", 
     "precio_costo_walmart": 13.22, 
     "stock_inicial": 3, 
     "categoria": "Inmunidad", 
     "marca": "Spring Valley", 
     "formato": "Tabletas", 
     "descripcion": "Potente antioxidante que apoya el sistema inmune" 
   }, 
   { 
     "nombre": "Zinc High Potency", 
     "precio_costo_walmart": 3.74, 
     "stock_inicial": 2, 
     "categoria": "Inmunidad", 
     "marca": "Spring Valley", 
     "formato": "Tabletas", 
     "descripcion": "Mineral clave para la respuesta inmune y salud celular" 
   }, 
   { 
     "nombre": "Nutrex Creatina Drive", 
     "precio_costo_walmart": 27.99, 
     "stock_inicial": 3, 
     "categoria": "Rendimiento Deportivo", 
     "marca": "Nutrex", 
     "formato": "Polvo", 
     "descripcion": "Creatina monohidratada pura para fuerza y potencia" 
   }, 
   { 
     "nombre": "Centrum Silver Adults", 
     "precio_costo_walmart": 10.76, 
     "stock_inicial": 2, 
     "categoria": "Multivitamínico", 
     "marca": "Centrum", 
     "formato": "Tabletas", 
     "descripcion": "Apoyo nutricional completo para adultos mayores de 50" 
   }, 
   { 
     "nombre": "Vinagre de Manzana", 
     "precio_costo_walmart": 12.48, 
     "stock_inicial": 2, 
     "categoria": "Bienestar Natural", 
     "marca": "Spring Valley", 
     "formato": "Capsulas", 
     "descripcion": "Ayuda en procesos digestivos y metabolismo natural" 
   }, 
   { 
     "nombre": "Ácido Fólico", 
     "precio_costo_walmart": 4.88, 
     "stock_inicial": 2, 
     "categoria": "Salud de la Mujer", 
     "marca": "Spring Valley", 
     "formato": "Tabletas", 
     "descripcion": "Nutriente esencial para el sistema nervioso y cardiovascular" 
   }, 
   { 
     "nombre": "Colágeno + Biotina", 
     "precio_costo_walmart": 6.88, 
     "stock_inicial": 4, 
     "categoria": "Salud Estética", 
     "marca": "Spring Valley", 
     "formato": "Capsulas", 
     "descripcion": "Suplemento para el soporte de la piel y regeneración" 
   }, 
   { 
     "nombre": "Vitamina E 400 IU", 
     "precio_costo_walmart": 16.94, 
     "stock_inicial": 2, 
     "categoria": "Antioxidante", 
     "marca": "Spring Valley", 
     "formato": "Capsulas", 
     "descripcion": "Apoyo al corazón y salud inmunológica" 
   }, 
   { 
     "nombre": "Turmeric Curcumin + Jengibre", 
     "precio_costo_walmart": 8.88, 
     "stock_inicial": 2, 
     "categoria": "Bienestar Natural", 
     "marca": "Spring Valley", 
     "formato": "Capsulas", 
     "descripcion": "Propiedades antiinflamatorias y antioxidantes" 
   }, 
   { 
     "nombre": "Ajo (Garlic) 1000 mg", 
     "precio_costo_walmart": 6.50, 
     "stock_inicial": 2, 
     "categoria": "Salud Cardiovascular", 
     "marca": "Spring Valley", 
     "formato": "Capsulas", 
     "descripcion": "Apoyo para la presión arterial y el sistema circulatorio" 
   } 
];

async function main() {
  console.log('🚀 Iniciando importación robusta de productos...');
  
  // Buscar usuario administrador para la auditoría
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });
  const auditorId = adminUser?.id || undefined;
  
  if (auditorId) {
    console.log(`👤 Usando usuario auditor: ${adminUser?.email}`);
  } else {
    console.log('⚠️ No se encontró usuario administrador. La auditoría se registrará sin usuario.');
  }

  let importedCount = 0;
  let skippedCount = 0;

  for (const item of productsToImport) {
    try {
      // 1. Obtener o crear categoría mediante el manager
      const category = await productManager.getOrCreateCategory(item.categoria);
      
      // 2. Generar slug para verificar existencia
      const slug = item.nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      // Verificar si ya existe el producto para evitar errores de duplicado
      const existing = await prisma.product.findUnique({ where: { slug } });
      
      if (existing) {
        console.log(`⚠️ Saltando: ${item.nombre} (Ya existe)`);
        skippedCount++;
        continue;
      }

      // 3. Calcular precio de venta (Costo * 1.5)
      const salePrice = Number(item.precio_costo_walmart) * 1.5;

      // 4. Crear producto usando el manager (maneja auditoría, SKUs, marcas y stock)
      // Generar un productCode más único (prefijo marca + parte de nombre)
      const brandPart = item.marca.toUpperCase().replace(/\s+/g, '').slice(0, 3);
      const namePart = item.nombre.toUpperCase().replace(/\s+/g, '_').slice(0, 10);
      const prodCode = `${brandPart}_${namePart}_${Math.floor(Math.random() * 1000)}`;

      const product = await productManager.createProduct({
        name: item.nombre,
        description: item.descripcion,
        price: salePrice,
        purchasePrice: Number(item.precio_costo_walmart),
        stock: item.stock_inicial,
        categoryIds: [category.id],
        brand: item.marca,
        format: item.formato,
        productCode: prodCode,
        isActive: true,
        minStock: 2,
        isFeatured: false,
        isOffer: false
      }, auditorId || 'SYSTEM');

      console.log(`✅ Importado: ${product.name} (SKU: ${product.sku})`);
      importedCount++;

    } catch (error) {
      console.error(`❌ Error importando ${item.nombre}:`, error);
    }
  }

  console.log('\n--- Resumen de Importación ---');
  console.log(`Total procesados: ${productsToImport.length}`);
  console.log(`Éxito:           ${importedCount}`);
  console.log(`Saltados:        ${skippedCount}`);
  console.log('-----------------------------\n');
}

main()
  .catch((e) => {
    console.error('Error fatal durante la importación:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
