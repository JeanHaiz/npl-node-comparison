import { Entity, Column } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Auto-generated UUID
 *         title:
 *           type: string
 *           description: Task title
 *         description:
 *           type: string
 *           description: Task description
 *         status:
 *           type: string
 *           enum: [TODO, IN_PROGRESS, DONE]
 *           default: TODO
 *         priority:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT]
 *           default: MEDIUM
 *         dueDate:
 *           type: string
 *           format: date-time
 *           description: Task due date
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         createdBy:
 *           type: string
 *           description: User ID who created the task
 *         updatedBy:
 *           type: string
 *           description: User ID who last updated the task
 */
@Entity('tasks')
export class Task extends BaseEntity {
  @Column()
  @IsNotEmpty()
  title!: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  description?: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  @IsEnum(TaskStatus)
  status!: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  @IsEnum(TaskPriority)
  priority!: TaskPriority;

  @Column({ name: 'due_date', nullable: true })
  @IsOptional()
  dueDate?: Date;
}
