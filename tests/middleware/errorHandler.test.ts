import assert from 'node:assert/strict';
import { STATUS_CODES } from 'node:http';
import { beforeEach, describe, it, mock } from 'node:test';
import type { NextFunction, Request, Response } from 'express';
import { createErrorHandler } from '../../src/middleware/errorHandler.ts';
import { AppError, type ErrorKind } from '../../src/errors.ts';

const onUnexpected = mock.fn((_error: unknown, _req: Request) => {});
const errorHandler = createErrorHandler({ onUnexpectedError: onUnexpected });

const handle = (error: unknown) => {
    const sent: { status?: number; body?: Record<string, unknown> } = {};
    const res = {
        status(code: number) {
            sent.status = code;
            return res;
        },
        json(body: unknown) {
            sent.body = JSON.parse(JSON.stringify(body)) as Record<
                string,
                unknown
            >;
            return res;
        },
    };

    errorHandler(
        error,
        { method: 'GET', originalUrl: '/api/users' } as Request,
        res as unknown as Response,
        mock.fn() as unknown as NextFunction,
    );

    return sent;
};

describe('errorHandler', () => {
    beforeEach(() => {
        onUnexpected.mock.resetCalls();
    });

    it('maps every kind of business error to its HTTP status', () => {
        const expected: Record<ErrorKind, number> = {
            invalid: 400,
            unauthorized: 401,
            forbidden: 403,
            notFound: 404,
            conflict: 409,
        };

        for (const [kind, status] of Object.entries(expected)) {
            const sent = handle(
                new AppError('some message', kind as ErrorKind),
            );

            assert.equal(sent.status, status, kind);
            assert.deepEqual(sent.body, {
                success: false,
                message: 'some message',
            });
        }
        assert.equal(onUnexpected.mock.callCount(), 0);
    });

    it('treats a business error without a kind as invalid input (400)', () => {
        assert.equal(handle(new AppError('nope')).status, 400);
    });

    it('answers an unexpected error with 500 and a generic message', () => {
        const sent = handle(new Error('SQLITE_ERROR: no such table: users'));

        assert.equal(sent.status, 500);
        assert.deepEqual(sent.body, {
            success: false,
            message: 'Unexpected error, please try again later',
        });
    });

    it('never leaks the internal error message to the client', () => {
        const sent = handle(new Error('SQLITE_ERROR: secret table name'));

        assert.equal(JSON.stringify(sent.body).includes('SQLITE'), false);
        assert.equal(JSON.stringify(sent.body).includes('secret'), false);
    });

    it('reports an unexpected error with the original error and the request', () => {
        const failure = new Error('boom');
        handle(failure);

        assert.equal(onUnexpected.mock.callCount(), 1);
        assert.equal(onUnexpected.mock.calls[0]?.arguments[0], failure);
        assert.equal(
            onUnexpected.mock.calls[0]?.arguments[1].originalUrl,
            '/api/users',
        );
    });

    it('treats a thrown value that is not an Error as unexpected', () => {
        const sent = handle('just a string');

        assert.equal(sent.status, 500);
        assert.equal(onUnexpected.mock.calls[0]?.arguments[0], 'just a string');
    });

    it('still answers 500 when no hook is given', () => {
        const sent: { status?: number } = {};
        const res = {
            status(code: number) {
                sent.status = code;
                return res;
            },
            json() {},
        };

        createErrorHandler()(
            new Error('boom'),
            {} as Request,
            res as unknown as Response,
            mock.fn() as unknown as NextFunction,
        );

        assert.equal(sent.status, 500);
    });

    it('keeps a client error status such as a malformed JSON body', () => {
        const sent = handle(
            Object.assign(new SyntaxError('Unexpected token'), { status: 400 }),
        );

        assert.equal(sent.status, 400);
        assert.deepEqual(sent.body, {
            success: false,
            message: 'Bad Request',
        });
        assert.equal(onUnexpected.mock.callCount(), 0);
    });

    it('keeps other 4xx statuses with their standard text', () => {
        const sent = handle(
            Object.assign(new Error('too big'), { status: 413 }),
        );

        assert.equal(sent.status, 413);
        assert.equal(sent.body?.message, STATUS_CODES[413]);
    });

    it('does not trust a 5xx status coming from a library error', () => {
        const sent = handle(
            Object.assign(new Error('upstream'), { status: 503 }),
        );

        assert.equal(sent.status, 500);
        assert.equal(onUnexpected.mock.callCount(), 1);
    });
});
