import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      // SQL and ORM errors may contain sensitive values; application errors are handled centrally.
      log: ['warn'],
    });
  }

  // Override $transaction to provide high-reliability default timeouts (30s timeout, 10s maxWait)
  // so slow queries, remote latency, or pool contention never trigger 5000ms "transaction already closed" errors!
  override $transaction: typeof PrismaClient.prototype.$transaction = ((
    arg: any,
    options?: any,
  ) => {
    if (typeof arg === 'function') {
      const merged = { maxWait: 10000, timeout: 30000, ...(options || {}) };
      return (super.$transaction as any)(arg, merged);
    }
    return (super.$transaction as any)(arg, options);
  }) as any;

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
