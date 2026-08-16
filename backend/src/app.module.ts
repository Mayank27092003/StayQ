import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { FirebaseModule } from './firebase/firebase.module';

// Auto-wired modules from 5 Subagents
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { PropertiesModule } from './properties/properties.module';
import { ExperiencesModule } from './experiences/experiences.module';
import { BookingsModule } from './bookings/bookings.module';
import { LeasesModule } from './leases/leases.module';
import { DisputesModule } from './disputes/disputes.module';
import { PaymentsModule } from './payments/payments.module';
import { WalletModule } from './wallet/wallet.module';
import { EarningsModule } from './earnings/earnings.module';
import { CommissionModule } from './commission/commission.module';
import { MessagingModule } from './messaging/messaging.module';
import { ReviewsModule } from './reviews/reviews.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { HostOnboardingModule } from './host-onboarding/host-onboarding.module';
import { HostDashboardModule } from './host-dashboard/host-dashboard.module';
import { QubeModule } from './qube/qube.module';
import { SupportModule } from './support/support.module';
import { VerificationModule } from './verification/verification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100, // 100 requests per minute globally (can be overridden per route)
    }]),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      exclude: ['/api/{*splat}'],
      serveStaticOptions: {
        setHeaders: (res, path) => {
          if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          }
        },
      },
    }),
    PrismaModule,
    FirebaseModule,
    
    // Core & Identity
    AuthModule,
    UsersModule,
    AdminModule,
    VerificationModule,
    
    // Inventory
    PropertiesModule,
    ExperiencesModule,
    
    // Booking & Legal
    BookingsModule,
    LeasesModule,
    DisputesModule,
    
    // Finance
    PaymentsModule,
    WalletModule,
    EarningsModule,
    CommissionModule,
    
    // Social & Comms
    MessagingModule,
    ReviewsModule,
    NotificationsModule,
    WishlistModule,
    HostOnboardingModule,
    HostDashboardModule,
    QubeModule,
    SupportModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
