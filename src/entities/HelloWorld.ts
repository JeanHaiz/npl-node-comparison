import { Entity, Column } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { IsNotEmpty, IsOptional } from 'class-validator';

/**
 * @swagger
 * components:
 *   schemas:
 *     HelloWorld:
 *       type: object
 *       required:
 *         - username
 *         - ownerId
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Auto-generated UUID
 *         username:
 *           type: string
 *           description: Username for personalized greeting
 *         ownerId:
 *           type: string
 *           description: User ID who owns this HelloWorld instance
 *         hasBeenGreeted:
 *           type: boolean
 *           description: Whether the sayHello endpoint has been called
 *           default: false
 *         greetedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when greeting was performed
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         createdBy:
 *           type: string
 *           description: User ID who created the HelloWorld
 *         updatedBy:
 *           type: string
 *           description: User ID who last updated the HelloWorld
 */
@Entity('hello_worlds')
export class HelloWorld extends BaseEntity {
  @Column()
  @IsNotEmpty()
  username!: string;

  @Column({ name: 'owner_id' })
  @IsNotEmpty()
  ownerId!: string;

  @Column({ name: 'has_been_greeted', default: false })
  hasBeenGreeted!: boolean;

  @Column({ name: 'greeted_at', nullable: true })
  @IsOptional()
  greetedAt?: Date;
}
