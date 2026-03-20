import { prisma } from '../src/infrastructure/persistence/prisma.client.js'

async function cleanup() {
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true, email: true } })
  const adminIds = new Set(admins.map(a => a.id))

  const nonAdmins = await prisma.user.findMany({ where: { NOT: { role: 'ADMIN' } }, select: { id: true, email: true } })
  const ids = nonAdmins.map(u => u.id)

  if (ids.length === 0) {
    console.log('No hay usuarios no ADMIN para eliminar')
    return
  }

  console.log('Admins conservados:', admins.map(a => a.email))
  console.log('Usuarios a eliminar:', nonAdmins.map(u => u.email))

  await prisma.$transaction(async (tx) => {
    await tx.notificationSetting.deleteMany({ where: { userId: { in: ids } } })
    await tx.saleAuditLog.deleteMany({ where: { userId: { in: ids } } })
    await tx.settingHistory.deleteMany({ where: { userId: { in: ids } } })
    await tx.notification.deleteMany({ where: { userId: { in: ids } } })

    await tx.sale.updateMany({ where: { userId: { in: ids } }, data: { userId: null } })

    const { count } = await tx.user.deleteMany({ where: { NOT: { role: 'ADMIN' } } })
    console.log(`Usuarios eliminados: ${count}`)
  })

  const remaining = await prisma.user.count()
  console.log(`Usuarios restantes: ${remaining}`)
}

cleanup().catch(err => {
  console.error('Error en limpieza:', err)
  process.exit(1)
})
