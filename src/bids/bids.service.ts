import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Bid, AuctionStatus } from '@prisma/client';
import { AuctionWebSocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class BidsService {
  constructor(
    private prisma: PrismaService,
    private auctionsGateway: AuctionWebSocketGateway,
  ) {}

  async create(data: {
    amount: number;
    auctionId: string;
    userId: string;
  }): Promise<Bid> {
    // Use a transaction to ensure atomicity
    const bid = await this.prisma.$transaction(async (tx) => {
      // Get the auction with its current version and highest bid
      const auction = await tx.auction.findUnique({
        where: { id: data.auctionId },
        include: {
          bids: {
            orderBy: { amount: 'desc' },
            take: 1,
          },
        },
      });

      if (!auction) {
        throw new NotFoundException(
          `Auction with ID ${data.auctionId} not found`,
        );
      }

      if (auction.status !== AuctionStatus.ACTIVE) {
        throw new BadRequestException('Can only bid on active auctions');
      }

      if (auction.endDate < new Date()) {
        throw new BadRequestException('Auction has ended');
      }

      if (auction.userId === data.userId) {
        throw new BadRequestException('Cannot bid on your own auction');
      }

      const highestBid = auction.bids[0]?.amount || auction.startPrice;
      if (data.amount <= highestBid) {
        throw new BadRequestException(
          'Bid amount must be higher than the current highest bid',
        );
      }

      // Update the auction's current price and version atomically
      const updatedAuction = await tx.auction.update({
        where: {
          id: data.auctionId,
          version: auction.version, // Optimistic locking
        },
        data: {
          currentPrice: data.amount,
          version: {
            increment: 1,
          },
        },
      });

      if (!updatedAuction) {
        throw new ConflictException(
          'Auction was updated by another user. Please try again.',
        );
      }

      // Create the bid
      return tx.bid.create({
        data: {
          amount: data.amount,
          auction: {
            connect: { id: data.auctionId },
          },
          user: {
            connect: { id: data.userId },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });

    // Broadcast the update to all connected clients
    await this.auctionsGateway.broadcastAuctionUpdate(data.auctionId, {
      currentPrice: bid.amount,
      highestBid: bid,
    });

    return bid;
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }): Promise<Bid[]> {
    const { skip, take, where, orderBy } = params;
    return this.prisma.bid.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findOne(id: string): Promise<Bid> {
    const bid = await this.prisma.bid.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        auction: {
          select: {
            id: true,
            title: true,
            currentPrice: true,
          },
        },
      },
    });

    if (!bid) {
      throw new NotFoundException(`Bid with ID ${id} not found`);
    }

    return bid;
  }

  async getAuctionBids(auctionId: string): Promise<Bid[]> {
    return this.prisma.bid.findMany({
      where: { auctionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        amount: 'desc',
      },
    });
  }

  async getUserBids(userId: string): Promise<Bid[]> {
    return this.prisma.bid.findMany({
      where: { userId },
      include: {
        auction: {
          select: {
            id: true,
            title: true,
            currentPrice: true,
            status: true,
            endDate: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
