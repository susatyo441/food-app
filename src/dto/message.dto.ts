import { IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  receiverId: number;

  @IsOptional()
  @IsString()
  message?: string;
}
