  import { Module } from '@nestjs/common';
  import { AuctionWebSocketGateway } from './websocket.gateway';
  import { ConfigModule, ConfigService } from '@nestjs/config';
  import { JwtModule } from '@nestjs/jwt';
  import { WsJwtAuthGuard } from '../auth/guards/ws-jwt-auth.guard';
  import { WebSocketAdapter } from './ws.adapter';
  import { JwtService } from '@nestjs/jwt';
  @Module({
    imports: [
      JwtModule.registerAsync({
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          secret: configService.get<string>('JWT_SECRET'), // ✅ Ensure this is set
          signOptions: { expiresIn: '1h' },
        }),
      }),
    ],
    providers: [
      AuctionWebSocketGateway,
      WsJwtAuthGuard,
      {
        provide: WebSocketAdapter,
        useFactory: (configService: ConfigService, jwtService: JwtService) => {
          return new WebSocketAdapter(null, configService, jwtService);
        },
        inject: [ConfigService, JwtService], // Inject JWT service
      },
    ],
    exports: [AuctionWebSocketGateway],
  })
  export class WebSocketModule {}
  
