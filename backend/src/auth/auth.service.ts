import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SyncProfileDto } from './dto/sync-profile.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async syncProfile(userId: string, dto: SyncProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
  }

  async becomeHost(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    
    if (user.roles.includes('HOST')) {
      return user;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          push: 'HOST',
        },
      },
    });
  }
}
