
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const prisma = new PrismaClient();

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
  console.log('Iniciando importación de productos...');

  for (const item of productsToImport) {
    // 1. Obtener o crear Categoría
    let category = await prisma.category.findFirst({
      where: { name: item.categoria }
    });

    if (!category) {
      const slug = item.categoria.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      category = await prisma.category.create({
        data: {
          name: item.categoria,
          slug: slug,
          isActive: true
        }
      });
      console.log(`Categoría creada: ${item.categoria}`);
    }

    // 2. Obtener o crear Marca
    let brand = await prisma.brand.findUnique({
      where: { name: item.marca }
    });

    if (!brand) {
      brand = await prisma.brand.create({
        data: {
          name: item.marca,
          isActive: true
        }
      });
      console.log(`Marca creada: ${item.marca}`);
    }

    // 3. Generar SKU y Slug
    const slug = item.nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const categoryPrefix = category.name.substring(0, 3).toUpperCase();
    const namePrefix = item.nombre.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    const count = await prisma.product.count();
    const sku = `${categoryPrefix}-${namePrefix}-${(count + 1).toString().padStart(4, '0')}`;

    // 4. Calcular precio final (utilidad del 1.5 por defecto)
    const profitMargin = 1.5;
    const finalPrice = Number(item.precio_costo_walmart) * profitMargin;

    // 5. Crear producto
    try {
      const product = await prisma.product.upsert({
        where: { slug: slug },
        update: {
          stock: { increment: item.stock_inicial },
          purchasePrice: item.precio_costo_walmart,
          price: finalPrice,
          inStock: true
        },
        create: {
          sku: sku,
          name: item.nombre,
          slug: slug,
          description: item.descripcion,
          price: finalPrice,
          purchasePrice: item.precio_costo_walmart,
          profitMargin: profitMargin,
          stock: item.stock_inicial,
          inStock: item.stock_inicial > 0,
          categoryId: category.id,
          brand: item.marca,
          brandId: brand.id,
          format: item.formato,
          isActive: true
        }
      });

      console.log(`Producto importado/actualizado: ${product.name} (SKU: ${product.sku})`);

      // 6. Crear log de inventario
      await prisma.inventoryLog.create({
        data: {
          productId: product.id,
          changeType: 'INITIAL_STOCK',
          previousStock: 0,
          newStock: item.stock_inicial,
          changeAmount: item.stock_inicial,
          reason: 'Importación masiva JSON'
        }
      });

    } catch (error) {
      console.error(`Error importando ${item.nombre}:`, error);
    }
  }

  console.log('Importación finalizada.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
