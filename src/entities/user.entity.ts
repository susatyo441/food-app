// src/models/user.model.ts

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { IsNotEmpty, IsEmail } from 'class-validator';
import { Post } from './post.entity';
import { Transaction } from './transactions.entity';
import { Notification } from './notification.entity';
import { Points } from './point.entity';
import { Extend } from './extend.entity';

export enum Gender {
  l = 'l',
  p = 'p',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsNotEmpty()
  name: string;

  @Column()
  @IsEmail()
  email: string;

  @Column({ select: false })
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column({
    type: 'enum',
    enum: Gender,
  })
  gender: string;

  @Column({
    nullable: false,
    type: 'varchar',
    default:
      'https://static.vecteezy.com/system/resources/previews/026/630/551/original/profile-icon-symbol-design-illustration-vector.jpg',
  })
  profile_picture: string;

  @Column({ nullable: true, default: null, select: false })
  @Exclude({ toPlainOnly: true })
  token: string;

  @Column({ default: false })
  @Exclude({ toPlainOnly: true })
  isDeleted: boolean;

  @Column({ nullable: true })
  fcmToken: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }) // Setelah update, kolom ini akan diisi dengan waktu saat itu
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  }) // Setelah update, kolom ini akan diisi dengan waktu saat itu
  updatedAt: Date;

  @OneToMany(() => Post, (posts) => posts.user)
  posts: Post[];

  @OneToMany(() => Transaction, (transaction) => transaction.userDonor)
  transactionsAsDonor: Transaction[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => Transaction, (transaction) => transaction.userRecipient)
  transactionsAsRecipient: Transaction[];

  @OneToOne(() => Points, (points) => points.user)
  points: Points;

  @OneToMany(() => Extend, (extend) => extend.user)
  extend: Extend[];
}
