import { IsString, IsOptional, IsUrl, Allow } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Allow() // Allows the value to be an empty string if provided
  nickname?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  avatarUrl?: string;
}
