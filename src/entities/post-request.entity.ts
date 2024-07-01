import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { UserOrganization } from './user-organization.entity';

@Entity('post_request')
export class PostRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  request: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(
    () => UserOrganization,
    (userOrganization) => userOrganization.postRequests,
    {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'user_organization_id' })
  userOrganization: UserOrganization;
}
