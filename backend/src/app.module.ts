import { JobsModule } from './jobs/jobs.module';
import { IdempotencyInterceptor } from './common/idempotency.interceptor';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { FirebaseAuthGuard } from './common/guards/firebase-auth.guard';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { FirebaseModule } from './firebase/firebase.module';

// Application modules
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
import { LoyaltyModule } from './loyalty/loyalty.module';
import { PricingModule } from './pricing/pricing.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { CorridorsModule } from './corridors/corridors.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 100, // 100 requests per minute general API
      },
      {
        name: 'auth',
        ttl: 60000,
        skipIf: (context) =>
          !Reflect.getMetadata('THROTTLER:LIMITauth', context.getHandler()) &&
          !Reflect.getMetadata('THROTTLER:LIMITauth', context.getClass()),
        limit: 10, // 10 requests per minute for sensitive auth & OTP
      },
      {
        name: 'ai',
        ttl: 60000,
        skipIf: (context) =>
          !Reflect.getMetadata('THROTTLER:LIMITai', context.getHandler()) &&
          !Reflect.getMetadata('THROTTLER:LIMITai', context.getClass()),
        limit: 15, // 15 requests per minute for expensive AI operations
      },
      {
        name: 'financial',
        ttl: 60000,
        skipIf: (context) =>
          !Reflect.getMetadata(
            'THROTTLER:LIMITfinancial',
            context.getHandler(),
          ) &&
          !Reflect.getMetadata('THROTTLER:LIMITfinancial', context.getClass()),
        limit: 20, // 20 requests per minute for payment endpoints
      },
    ]),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      exclude: ['/api/*path'],
      serveStaticOptions: {
        setHeaders: (res, path) => {
          if (path.endsWith('.html')) {
            res.setHeader(
              'Cache-Control',
              'no-cache, no-store, must-revalidate',
            );
          }
        },
      },
    }),
    PrismaModule,
    JobsModule,
    FirebaseModule,

    // Core & Identity
    AuthModule,
    UsersModule,
    AdminModule,
    VerificationModule,
    LoyaltyModule,

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
    PricingModule,
    SubscriptionsModule,
    CorridorsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor },
    { provide: APP_GUARD, useClass: FirebaseAuthGuard },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
