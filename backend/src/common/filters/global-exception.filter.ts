import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(error: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp(),
      res = ctx.getResponse(),
      req = ctx.getRequest();
    let status = 500,
      message: any = 'An unexpected internal error occurred',
      name = 'InternalServerError';
    if (error instanceof HttpException) {
      status = error.getStatus();
      const detail: any = error.getResponse();
      message = typeof detail === 'string' ? detail : detail.message || message;
      name =
        typeof detail === 'object' ? detail.error || error.name : error.name;
    } else if (error?.code === 'P2002') {
      status = 409;
      message = 'A resource with these identifiers already exists';
      name = 'Conflict';
    } else if (error?.code === 'P2025') {
      status = 404;
      message = 'Resource not found';
      name = 'NotFound';
    } else if (['P2003', 'P2004', 'P2011'].includes(error?.code)) {
      status = 400;
      message = 'Request conflicts with stored data constraints';
      name = 'BadRequest';
    } else if (error?.type === 'entity.too.large') {
      status = 413;
      message = 'Request body is too large';
      name = 'PayloadTooLarge';
    } else if (error?.type === 'entity.parse.failed') {
      status = 400;
      message = 'Invalid JSON body';
      name = 'BadRequest';
    }
    // Never echo ORM queries, provider payloads or URL query secrets into responses.
    res.status(status).json({
      statusCode: status,
      error: name,
      message,
      path: String(req.originalUrl || req.url || '').split('?')[0],
      timestamp: new Date().toISOString(),
    });
  }
}
