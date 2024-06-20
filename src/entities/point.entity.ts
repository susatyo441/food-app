import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity'; // Adjust the import path as necessary

@Entity('points')
export class Points {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  points: number;

  @OneToOne(() => User, (user) => user.points)
  @JoinColumn()
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
