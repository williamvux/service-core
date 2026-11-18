import { STATUS_CODES } from 'node:http';
import type { NextFunction, Request, Response } from 'express';
import { JsonResponse, sendResponse } from '../response/index.ts';
import { AppError, type ErrorKind } from '../errors.ts';

const STATUS_BY_KIND: Record<ErrorKind, number> = {
    invalid: 400,
    unauthorized: 401,
    forbidden: 403,
    notFound: 404,
    conflict: 409,
};

const clientErrorStatus = (error: unknown): number | undefined => {
    if (typeof error !== 'object' || error === null) return undefined;
    if (!('status' in error) || typeof error.status !== 'number') {
        return undefined;
    }
    return error.status >= 400 && error.status < 500 ? error.status : undefined;
};

type ErrorHandlerOptions = {
    onUnexpectedError?: (error: unknown, req: Request) => void;
};

export const createErrorHandler =
    ({ onUnexpectedError }: ErrorHandlerOptions = {}) =>
    (
        error: unknown,
        req: Request,
        res: Response,
        _next: NextFunction,
    ): void => {
        if (error instanceof AppError) {
            return sendResponse(
                res,
                JsonResponse.err(error, STATUS_BY_KIND[error.kind]),
            );
        }

        const status = clientErrorStatus(error);
        if (status) {
            return sendResponse(
                res,
                JsonResponse.err(
                    new Error(STATUS_CODES[status] ?? 'Bad Request'),
                    status,
                ),
            );
        }

        onUnexpectedError?.(error, req);
        return sendResponse(res, JsonResponse.unexpected());
    };

const errorHandler = createErrorHandler();

export default errorHandler;
