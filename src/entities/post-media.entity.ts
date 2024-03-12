// post-media.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Post } from './post.entity';

@Entity('post_media')
export class PostMedia {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Post, post => post.media, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column({ nullable: false, type: 'text' })
  url: string;

  @Column({ nullable: false, type: 'datetime' })
  createdAt: Date;

  @Column({ nullable: false, type: 'datetime' })
  updatedAt: Date;
}
