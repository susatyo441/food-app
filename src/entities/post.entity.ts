// src/models/post.entity.ts

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { CategoryPost } from './category-post.entity';
import { Variant } from './variant.entity';
import { Transaction } from './transactions.entity';
import { Address } from './address.entity';
import { PostMedia } from './post-media.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  title: string;

  @Column({ nullable: false, type: 'text', comment: 'Content of the post' })
  body: string;

  @ManyToOne(() => User, (user) => user.posts, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Address, (address) => address.posts, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'address_id' })
  address: Address;

  @Column({ nullable: false, default: 1 })
  status: number;

  @CreateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @OneToMany(() => CategoryPost, (categoryPosts) => categoryPosts.post)
  categoryPosts: CategoryPost[];

  @OneToMany(() => Variant, (variants) => variants.post)
  variants: Variant[];

  @OneToMany(() => Transaction, (transaction) => transaction.post)
  transactions: Transaction[];

  @OneToMany(() => PostMedia, (postMedia) => postMedia.post)
  media: PostMedia[];
}
