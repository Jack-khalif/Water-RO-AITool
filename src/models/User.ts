import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Quotation } from './Quotation';

export enum UserRole {
  ADMIN = 'admin',
  ENGINEER = 'engineer',
  SALES = 'sales',
  CUSTOMER = 'customer',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @Column({ select: false })
  password: string;

  @Column({ nullable: true })
  company: string;

  @Column({ nullable: true })
  phone: string;

  @OneToMany(() => Quotation, (quotation) => quotation.createdBy)
  quotations: Quotation[];

  @CreateDateColumn()
  createdAt: Date;
}
