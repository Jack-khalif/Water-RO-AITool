import { AppDataSource } from '../src/config/database';
import { User } from '../src/models/User';
import bcrypt from 'bcrypt';

async function createTestUser() {
  await AppDataSource.initialize();
  
  const userRepo = AppDataSource.getRepository(User);
  
  const testUser = userRepo.create({
    email: 'test@hydroflow.com',
    name: 'Test User',
    password: await bcrypt.hash('hydroflow123', 10),
    role: 'admin'
  });
  
  await userRepo.save(testUser);
  console.log('Test user created:', testUser);
}

createTestUser().catch(console.error);
