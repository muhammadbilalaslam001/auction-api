import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { AuctionStatus } from '@prisma/client';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { UpdateAuctionDto } from './dto/update-auction.dto';

@Controller('auctions')
export class AuctionsController {
  constructor(private readonly auctionsService: AuctionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createAuctionDto: CreateAuctionDto,
    @CurrentUser() user: User,
  ) {
    return this.auctionsService.create({
      ...createAuctionDto,
      user: {
        connect: {
          id: user.id,
        },
      },
    });
  }

  @Get()
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('status') status?: AuctionStatus,
  ) {
    return this.auctionsService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.auctionsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateAuctionDto: UpdateAuctionDto,
    @CurrentUser() user: User,
  ) {
    return this.auctionsService.update(id, updateAuctionDto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.auctionsService.remove(id, user.id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id') id: string, @Body('status') status: AuctionStatus) {
    return this.auctionsService.updateStatus(id, status);
  }
}
