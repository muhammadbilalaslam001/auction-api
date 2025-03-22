import { IoAdapter } from '@nestjs/platform-socket.io';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

export class WebSocketAdapter extends IoAdapter {
  constructor(
    private readonly app: any,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService, // Inject JWT Service
  ) {
    super(app);
  }

  createIOServer(port: number, options?: any): Server {
    const cors = {
      origin:
        this.configService.get<string>('NODE_ENV') === 'development'
          ? this.configService.get<string>('APP_LOCALHOST_URL')
          : this.configService.get<string>('APP_FRONTEND_URL'),
      credentials: true,
    };

    const optionsWithCORS = {
      ...options,
      cors,
      transports: ['websocket', 'polling'], // Allow both transports
    };

    const server = super.createIOServer(port, optionsWithCORS);

    // **Handle authentication manually in WebSocket**
    server.use((socket: Socket, next) => {
      const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      try {       
        const decoded = this.jwtService.verify(token);
        socket.data.user = decoded; // Attach user data
        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });

    return server;
  }
}
