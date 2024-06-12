import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { CategoryPost } from './category-post.entity';
import { Variant } from './variant.entity';
import { Transaction } from './transactions.entity';
import { PostMedia } from './post-media.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  title: string;

  @Column('json', { nullable: false })
  body: {
    alamat: string;
    coordinate: string;
    deskripsi?: string; // Add deskripsi key
  };

  @ManyToOne(() => User, (user) => user.posts, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: ['visible', 'hidden'],
    nullable: false,
  })
  status: 'visible' | 'hidden';

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
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
