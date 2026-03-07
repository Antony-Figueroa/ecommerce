import { PrismaClient } from '../src/generated/client/index.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const prisma = new PrismaClient();

async function main() {
  const email = 'antonysamuel0903@gmail.com';
  const password = 'Admin123';
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log(`\n🚀 Iniciando inyección de usuario maestro: ${email}...`);

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        emailVerified: true,
        name: 'Antony Figueroa (Maestro)',
        phone: '+58 412-1234567',
        address: 'Distrito Capital, Caracas, Venezuela',
        username: 'antony_maestro',
        avatarUrl: `https://ui-avatars.com/api/?name=Antony+Figueroa&background=10b981&color=fff&size=256`
      },
      create: {
        email,
        passwordHash: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        emailVerified: true,
        name: 'Antony Figueroa (Maestro)',
        phone: '+58 412-1234567',
        address: 'Distrito Capital, Caracas, Venezuela',
        username: 'antony_maestro',
        avatarUrl: `https://ui-avatars.com/api/?name=Antony+Figueroa&background=10b981&color=fff&size=256`
      },
    });

    console.log('✅ ¡Usuario maestro inyectado con éxito!');
    console.log('-------------------------------------------');
    console.log(`ID:        ${user.id}`);
    console.log(`Email:     ${user.email}`);
    console.log(`Usuario:   ${user.username}`);
    console.log(`Rol:       ${user.role}`);
    console.log(`Nombre:    ${user.name}`);
    console.log('-------------------------------------------');
    console.log('Utiliza estas credenciales para acceder al panel admin.\n');
  } catch (error) {
    console.error('❌ Error al inyectar el usuario:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
