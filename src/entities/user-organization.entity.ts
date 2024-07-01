import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { PostRequest } from './post-request.entity';

@Entity('user_organization')
export class UserOrganization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  profile_picture: string;

  @Column('double precision')
  lat: number;

  @Column('double precision')
  long: number;

  @Column()
  name: string;

  @Column()
  address: string;

  @OneToMany(() => PostRequest, (postRequest) => postRequest.userOrganization)
  postRequests: PostRequest[];
}
