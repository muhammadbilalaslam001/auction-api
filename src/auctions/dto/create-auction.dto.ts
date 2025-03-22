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

export class CreateAuctionDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  startPrice: number;

  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @IsEnum(AuctionStatus)
  @IsOptional()
  status?: AuctionStatus;
}
