import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { BidsService } from './bids.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { CreateBidDto } from './dto/create-bid.dto';

@Controller('bids')
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createBidDto: CreateBidDto, @CurrentUser() user: User) {
    return this.bidsService.create({
      ...createBidDto,
      userId: user.id,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query('skip') skip?: string, @Query('take') take?: string) {
    return this.bidsService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('auction/:auctionId')
  getAuctionBids(@Param('auctionId') auctionId: string) {
    return this.bidsService.getAuctionBids(auctionId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bidsService.findOne(id);
  }
}
