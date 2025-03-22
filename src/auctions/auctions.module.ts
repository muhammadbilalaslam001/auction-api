import { Module } from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { AuctionsController } from './auctions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BidsModule } from '../bids/bids.module';

@Module({
  imports: [PrismaModule, BidsModule],
  controllers: [AuctionsController],
  providers: [AuctionsService],
  exports: [AuctionsService],
})
export class AuctionsModule {}
