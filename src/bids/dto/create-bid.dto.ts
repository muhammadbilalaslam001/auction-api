import { IsNumber, IsString, Min } from 'class-validator';

export class CreateBidDto {
  @IsString()
  auctionId: string;

  @IsNumber()
  @Min(0)
  amount: number;
}
