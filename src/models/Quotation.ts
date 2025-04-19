import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum QuotationStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SENT = 'sent',
}

@Entity()
export class Quotation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('jsonb')
  data: any;

  @Column({ type: 'enum', enum: QuotationStatus, default: QuotationStatus.DRAFT })
  status: QuotationStatus;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ nullable: true })
  rejectionReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
