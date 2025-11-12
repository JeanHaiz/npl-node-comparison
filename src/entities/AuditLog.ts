import { Entity, Column, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'entity_name' })
  entityName!: string;

  @Column({ name: 'entity_id' })
  entityId!: string;

  @Column({ type: 'varchar', length: 50 })
  action!: 'CREATE' | 'UPDATE' | 'DELETE';

  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @Column({ name: 'user_email', nullable: true })
  userEmail?: string;

  @Column({ type: 'jsonb', nullable: true })
  oldValues?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  newValues?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  changes?: Record<string, any>;

  @Column({ type: 'inet', nullable: true })
  ipAddress?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
