import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostRequest } from '../entities/post-request.entity';
import { UserOrganization } from '../entities/user-organization.entity';
import * as geolib from 'geolib';

@Injectable()
export class PostRequestService {
  constructor(
    @InjectRepository(PostRequest)
    private postRequestRepository: Repository<PostRequest>,
    @InjectRepository(UserOrganization)
    private userOrgRepository: Repository<UserOrganization>,
  ) {}

  async createPostRequest(
    userId: number,
    request: string,
  ): Promise<PostRequest> {
    const user = await this.userOrgRepository.findOne({
      where: { id: userId },
    });
    const postRequest = this.postRequestRepository.create({
      request,
      userOrganization: user,
    });
    return this.postRequestRepository.save(postRequest);
  }

  async getPostsSortedByLocation(lat: number, long: number): Promise<any[]> {
    const postRequests = await this.postRequestRepository.find({
      relations: ['userOrganization'],
    });

    const postsWithDistance = postRequests.map((post) => {
      const distance = geolib.getDistance(
        { latitude: lat, longitude: long },
        {
          latitude: post.userOrganization.lat,
          longitude: post.userOrganization.long,
        },
      );

      return {
        ...post,
        distance,
        user: {
          id: post.userOrganization.id,
          name: post.userOrganization.name,
          profilePicture: post.userOrganization.profile_picture,
          address: post.userOrganization.address,
          email: post.userOrganization.email,
          lat: post.userOrganization.lat,
          long: post.userOrganization.long,
        },
      };
    });

    // Sort posts by distance
    postsWithDistance.sort((a, b) => a.distance - b.distance);

    // Format the distance to be in meters or kilometers
    const formattedPosts = postsWithDistance.map((post) => {
      const formattedDistance =
        post.distance >= 1000
          ? `${(post.distance / 1000).toFixed(1)} km`
          : `${post.distance} meter`;

      return {
        id: post.id,
        request: post.request,
        distance: formattedDistance,
        user: post.user,
      };
    });

    return formattedPosts;
  }

  async deletePostRequest(id: number): Promise<void> {
    const result = await this.postRequestRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Post request with ID ${id} not found`);
    }
  }

  async getAllPostsByUser(userId: number): Promise<PostRequest[]> {
    return await this.postRequestRepository.find({
      where: { userOrganization: { id: userId } },
      relations: ['userOrganization'],
    });
  }
}
