  import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
  import { JwtService } from '@nestjs/jwt';
  import { WsException } from '@nestjs/websockets';
  import { Socket } from 'socket.io';

  @Injectable()
  export class WsJwtAuthGuard implements CanActivate {
    constructor(private jwtService: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      try {
        const client: Socket = context.switchToWs().getClient();

        const token = this.extractTokenFromHeader(client);
        
        if (!token) {
          throw new WsException('Unauthorized: No token provided');
        }

        const payload = await this.jwtService.verifyAsync(token);
        client.data.user = payload;
        return true;
      } catch (err) {
        throw new WsException('Unauthorized: Invalid token');
      }
    }

    private extractTokenFromHeader(client: Socket): string | undefined {
      const [type, token] =
        client.handshake.headers.authorization?.split(' ') ?? [];
      return type === 'Bearer' ? token : undefined;
    }
  }
