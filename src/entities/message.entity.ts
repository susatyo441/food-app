import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { File } from './file.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'receiver_id' })
  receiver: User;

  @Column({ nullable: true })
  message: string;

  @Column({ nullable: true, default: false })
  is_read: boolean;

  @ManyToOne(() => File, { nullable: true })
  @JoinColumn({ name: 'file_id' })
  file: File;

  @CreateDateColumn()
  timestamp: Date;
}
