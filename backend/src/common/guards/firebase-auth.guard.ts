import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { getAuth } from 'firebase-admin/auth';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.split('Bearer ')[1];

    try {
      const decodedToken = await getAuth().verifyIdToken(token);

      // Upsert user on first sight atomically — never race condition or 500
      const user = await this.prisma.user.upsert({
        where: { firebaseUid: decodedToken.uid },
        update: {
          email: decodedToken.email ?? undefined,
          displayName: decodedToken.name ?? undefined,
          photoUrl: decodedToken.picture ?? undefined,
        },
        create: {
          firebaseUid: decodedToken.uid,
          email: decodedToken.email ?? null,
          phone: decodedToken.phone_number ?? null,
          displayName: decodedToken.name ?? null,
          photoUrl: decodedToken.picture ?? null,
        },
      });

      // Attach user to request for downstream use
      request.user = user;
      request.firebaseUser = decodedToken;

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired Firebase token');
    }
  }
}
