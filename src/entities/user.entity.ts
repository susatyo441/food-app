// src/models/user.model.ts

import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { IsNotEmpty, IsEmail } from 'class-validator';
import { Conversation } from './conversation.entity';
import { Post } from './post.entity';
import { Transaction } from './transactions.entity';
import { Address } from './address.entity';

export enum Gender {
  l = "l",
  p = "p",
}

@Entity("users")
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
    type: "enum",
    enum: Gender,
  })
  gender: string;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ default: () => 'CURRENT_TIMESTAMP' }) // Setelah update, kolom ini akan diisi dengan waktu saat itu
  createdAt: Date;

  @Column({ default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' }) // Setelah update, kolom ini akan diisi dengan waktu saat itu
  updatedAt: Date;
  

  @OneToMany(() => Conversation, conversation => conversation.userDonor)
  donorConversations: Conversation[];

  @OneToMany(() => Post, posts => posts.user)
  posts: Post[];

  @OneToMany(() => Conversation, conversation => conversation.userRecipient)
  recipientConversations: Conversation[];

  @OneToMany(() => Transaction, transaction => transaction.userDonor)
  transactionsAsDonor: Transaction[];

  @OneToMany(() => Transaction, transaction => transaction.userRecipient)
  transactionsAsRecipient: Transaction[];

  @OneToMany(() => Address, address => address.user)
  addresses: Address[];
}
