// src/models/address.entity.ts

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Post } from './post.entity';
import { User } from './user.entity';

@Entity('address')
export class Address {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.addresses, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: false})
  provinsi: string;

  @Column({ nullable: false})
  kota: string;

  @Column({ nullable: false})
  kecamatan: string;

  @Column({ nullable: false})
  kode_pos: string;

  @Column({ nullable: false})
  alamat: string;

  @Column({ nullable: true})
  coordinate: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToMany(() => Post, posts => posts.address)
  posts: Post[];
}
