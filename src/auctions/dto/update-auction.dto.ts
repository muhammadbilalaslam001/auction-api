import {
  IsString,
  IsNumber,
  IsDate,
  IsOptional,
  Min,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AuctionStatus } from '@prisma/client';

export class UpdateAuctionDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  startPrice?: number;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  endDate?: Date;

  @IsEnum(AuctionStatus)
  @IsOptional()
  status?: AuctionStatus;
}
