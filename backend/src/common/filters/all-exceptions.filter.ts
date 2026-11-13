import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Error interno del servidor';

    if (exception instanceof HttpException) {
      // Errores: 404, 400, validación...
      status = exception.getStatus();
      const body = exception.getResponse() as { message?: string | string[] };
      message = body.message ?? exception.message;
    } else if ((exception as { code?: string }).code === 'ER_NO_REFERENCED_ROW_2') {
      // Foreign key: el cliente no existe
      status = HttpStatus.NOT_FOUND;
      message = 'El registro relacionado no existe';
    } else {
      // Cualquier otro error es un bug: se registra, pero no se muestra
      this.logger.error(exception);
    }

    res.status(status).json({
      statusCode: status,
      message,
      path: req.url,
    });
  }
}