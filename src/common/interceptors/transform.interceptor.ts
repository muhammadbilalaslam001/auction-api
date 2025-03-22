import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;

    const messages = {
      // Auth endpoints
      'POST /api/auth/login': 'User logged in successfully',
      'POST /api/auth/register': 'User registered successfully',
      'GET /api/users/me': 'Current user retrieved successfully',

      // Auction endpoints
      'POST /api/auctions': 'Auction created successfully',
      'GET /api/auctions': 'Auctions retrieved successfully',
      'GET /api/auctions/:id': 'Auction retrieved successfully',
      'PATCH /api/auctions/:id': 'Auction updated successfully',
      'DELETE /api/auctions/:id': 'Auction deleted successfully',
      'PATCH /api/auctions/:id/status': 'Auction status updated successfully',

      // Bid endpoints
      'POST /api/bids': 'Bid placed successfully',
      'GET /api/bids': 'Bids retrieved successfully',
      'GET /api/bids/my': 'Your bids retrieved successfully',
      'GET /api/bids/auction/:auctionId': 'Auction bids retrieved successfully',
      'GET /api/bids/:id': 'Bid retrieved successfully',

      // Fallback messages
      GET: 'Data retrieved successfully',
      POST: 'Data created successfully',
      PUT: 'Data updated successfully',
      PATCH: 'Data updated successfully',
      DELETE: 'Data deleted successfully',
    };

    // Try to match the exact endpoint first
    let message = messages[`${method} ${url}`];

    // If no exact match, try to match with parameters
    if (!message) {
      const urlPattern = url.replace(/\/[^/]+/g, '/:id');
      message = messages[`${method} ${urlPattern}`];
    }

    // If still no match, use the default message for the HTTP method
    if (!message) {
      message = messages[method];
    }

    return next.handle().pipe(
      map((data) => ({
        success: true,
        message,
        data,
      })),
    );
  }
}
