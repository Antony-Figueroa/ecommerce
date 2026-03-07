
import { prisma } from './server/src/infrastructure/persistence/prisma.client.js';

async function test() {
  try {
    console.log('Fetching locations...');
    const locations = await prisma.inventoryLocation.findMany();
    console.log('Locations found:', locations.length);
    console.log(JSON.stringify(locations, null, 2));
    
    if (locations.length === 0) {
      console.log('No locations found. Creating default...');
      const defaultLoc = await prisma.inventoryLocation.create({
        data: {
          name: 'Tienda Principal',
          description: 'Ubicación física principal de la tienda',
          address: 'Caracas, Venezuela',
          isDefault: true,
          isActive: true
        }
      });
      console.log('Created default location:', defaultLoc);
    }
  } catch (error) {
    console.error('DATABASE ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
