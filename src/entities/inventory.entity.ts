import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from './user.entity'; // Adjust the import path as necessary

@Entity('inventory')
export class Inventory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  image: string;

  @Column()
  quantity: number;

  @Column()
  expiredAt: Date;

  @Column({ default: false })
  isNotify: boolean;

  @Column({ default: false })
  isPreNotify: boolean;

  @ManyToOne(() => User, (user) => user.inventories, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
