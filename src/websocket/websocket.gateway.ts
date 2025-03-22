import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtAuthGuard } from '../auth/guards/ws-jwt-auth.guard';
import { Auction, Bid, User } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

type AuctionWithHighestBid = Auction & {
  bids: (Bid & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      callback(null, true); // Dynamic CORS will be configured in constructor
    },
    credentials: true,
  },
})
@UseGuards(WsJwtAuthGuard)
export class AuctionWebSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private connectedClients: Map<string, Set<string>> = new Map(); // auctionId -> Set of socketIds

  constructor(private readonly configService: ConfigService) {}

  async handleConnection(client: Socket) {
    // The user is already authenticated by WsJwtAuthGuard
    const userId = client.data.user.sub;
    console.log(`Client connected: ${client.id} (User: ${userId})`);
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.user.sub;
    console.log(`Client disconnected: ${client.id} (User: ${userId})`);
    // Remove client from all auction rooms
    this.connectedClients.forEach((clients, auctionId) => {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.connectedClients.delete(auctionId);
      }
    });
  }

  @SubscribeMessage('joinAuction')
  async handleJoinAuction(client: Socket, auctionId: string) {
    const userId = client.data.user.sub;
    client.join(`auction:${auctionId}`);

    // Track connected clients for this auction
    if (!this.connectedClients.has(auctionId)) {
      this.connectedClients.set(auctionId, new Set());
    }
    const clients = this.connectedClients.get(auctionId);
    if (clients) {
      clients.add(client.id);
    }
  }

  @SubscribeMessage('leaveAuction')
  handleLeaveAuction(client: Socket, auctionId: string) {
    const userId = client.data.user.sub;
    client.leave(`auction:${auctionId}`);

    // Remove client from tracking
    const clients = this.connectedClients.get(auctionId);
    if (clients) {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.connectedClients.delete(auctionId);
      }
    }
  }

  // Method to broadcast auction updates to all connected clients
  async broadcastAuctionUpdate(
    auctionId: string,
    data: { currentPrice: number; highestBid: any },
  ) {
    this.server.to(`auction:${auctionId}`).emit('auctionUpdate', {
      auctionId,
      currentPrice: data.currentPrice,
      highestBid: data.highestBid,
    });
  }
}
