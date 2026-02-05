
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const predefinedCategories = [
    { name: 'Vitaminas y Suplementos', icon: '💊', description: 'Multivitamínicos, minerales y suplementos nutricionales' },
    { name: 'Analgésicos', icon: '🩹', description: 'Alivio del dolor y reducción de fiebre' },
    { name: 'Antibióticos', icon: '💉', description: 'Tratamiento de infecciones bacterianas' },
    { name: 'Cuidado Personal', icon: '🧴', description: 'Higiene, cuidado de la piel y el cabello' },
    { name: 'Primeros Auxilios', icon: '🚑', description: 'Material de curación y emergencias' },
    { name: 'Infantil y Maternidad', icon: '🍼', description: 'Productos para bebés y cuidado materno' },
    { name: 'Salud Digestiva', icon: '🍵', description: 'Antiácidos, laxantes y probióticos' },
    { name: 'Equipos Médicos', icon: '🩺', description: 'Tensiómetros, termómetros y nebulizadores' },
    { name: 'Deporte y Energía', icon: '⚡', description: 'Proteínas, creatinas y pre-entrenos' },
    { name: 'Bienestar Natural', icon: '🌿', description: 'Hierbas, aceites esenciales y medicina natural' },
    { name: 'Dermocosmética', icon: '✨', description: 'Cuidado avanzado de la piel y estética' },
    { name: 'Salud Cardiovascular', icon: '❤️', description: 'Suplementos y equipos para el corazón' },
    { name: 'Diabetes', icon: '🩸', description: 'Insumos y suplementos para control de azúcar' }
  ]

  console.log('Iniciando siembra de categorías...')

  for (let i = 0; i < predefinedCategories.length; i++) {
    const cat = predefinedCategories[i]
    const slug = cat.name.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

    await prisma.category.upsert({
      where: { slug },
      update: {
        icon: cat.icon,
        description: cat.description,
      },
      create: {
        name: cat.name,
        slug,
        icon: cat.icon,
        description: cat.description,
        isActive: true,
        sortOrder: i
      }
    })
  }

  console.log('Categorías sembradas con éxito.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
