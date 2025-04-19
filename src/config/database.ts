import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../models/User';
import { Quotation } from '../models/Quotation';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'hydroflow',
  synchronize: true,
  logging: false,
  entities: [User, Quotation],
  migrations: [],
  subscribers: [],
});

// Initialize connection
export async function initializeDatabase() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}
