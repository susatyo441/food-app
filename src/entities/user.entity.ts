// src/models/user.model.ts

import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { IsNotEmpty, IsEmail } from 'class-validator';

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

  @Column({ default: () => 'CURRENT_TIMESTAMP' }) // Setelah update, kolom ini akan diisi dengan waktu saat itu
  createdAt: Date;

  @Column({ default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' }) // Setelah update, kolom ini akan diisi dengan waktu saat itu
  updatedAt: Date;
}
