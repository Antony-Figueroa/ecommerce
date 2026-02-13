import { PrismaClient } from '../src/generated/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando limpieza de usuarios de prueba...')
  
  try {
    // Buscar usuarios que contengan "test" en el email, nombre o username
    const testUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: 'test' } },
          { name: { contains: 'Test' } },
          { username: { contains: 'test' } }
        ]
      }
    })

    console.log(`Se encontraron ${testUsers.length} usuarios de prueba para eliminar.`)

    if (testUsers.length > 0) {
      const ids = testUsers.map(u => u.id)
      
      // Eliminar registros relacionados si no tienen onDelete: Cascade
      // Basado en el schema, la mayoría tiene onDelete: Cascade, 
      // pero SystemAuditLog y BusinessEvent no lo especifican explícitamente en el schema (usan el default)
      
      console.log('Eliminando registros relacionados...')
      await prisma.systemAuditLog.deleteMany({ where: { userId: { in: ids } } })
      await prisma.businessEvent.deleteMany({ where: { userId: { in: ids } } })
      
      console.log('Eliminando usuarios...')
      const result = await prisma.user.deleteMany({
        where: {
          id: { in: ids }
        }
      })
      
      console.log(`Se eliminaron ${result.count} usuarios correctamente.`)
    } else {
      console.log('No se encontraron usuarios de prueba para eliminar.')
    }

    console.log('Operación completada con éxito.')
  } catch (error) {
    console.error('Error durante la eliminación:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
