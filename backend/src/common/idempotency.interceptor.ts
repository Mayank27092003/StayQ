import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  ConflictException,
} from '@nestjs/common';
import { Observable, from, lastValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { fingerprint, idempotencyKey } from './utils/input.util';
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const rawKey =
      req.headers['idempotency-key'] || req.headers['x-idempotency-key'];
    if (!rawKey || !req.user || !['POST', 'PUT', 'PATCH'].includes(req.method))
      return next.handle();
    // Checkout, messages and bookings have dedicated recovery with durable domain IDs.
    // Verification codes must never be cached/replayed as proof after consumption.
    if (
      /\/(payments|subscriptions|bookings|verification|auth)(\/|$)|\/boost\/(checkout|activate)|\/loyalty\/(upgrade-tier|redeem|create-order)|\/messaging\//.test(
        req.path,
      )
    )
      return next.handle();
    return from(
      (async () => {
        const key = `${req.user.id}:${req.method}:${req.path}:${idempotencyKey(rawKey)}`;
        const hash = fingerprint(req.body);
        const claim = await this.prisma.$transaction(async (tx) => {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key},0))`;
          const record = await tx.apiRequest.findUnique({ where: { key } });
          if (record) {
            if (record.requestHash !== hash)
              throw new ConflictException(
                'Idempotency key has conflicting inputs',
              );
            if (record.status === 'COMPLETED') return { record, replay: true };
            throw new ConflictException(
              'This request is pending reconciliation; check its saved resource before retrying',
            );
          }
          return {
            record: await tx.apiRequest.create({
              data: { key, ownerId: req.user.id, requestHash: hash },
            }),
            replay: false,
          };
        });
        if (claim.replay) {
          res.status(claim.record.statusCode || 200);
          return claim.record.result;
        }
        try {
          const result = await lastValueFrom(next.handle());
          await this.prisma.apiRequest.update({
            where: { id: claim.record.id },
            data: {
              status: 'COMPLETED',
              statusCode: res.statusCode,
              result: JSON.parse(JSON.stringify(result ?? null)),
            },
          });
          return result;
        } catch (error: any) {
          // Validation/authorization errors occur before writes. An uncertain internal
          // failure stays recorded so a generic retry cannot duplicate a side effect.
          if (typeof error.getStatus === 'function' && error.getStatus() < 500)
            await this.prisma.apiRequest.delete({
              where: { id: claim.record.id },
            });
          throw error;
        }
      })(),
    );
  }
}
