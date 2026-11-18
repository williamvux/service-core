import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import type { Response } from 'express';
import {
    ApiResult,
    JsonResponse,
    sendResponse,
} from '../../src/response/index.ts';

describe('ApiResult', () => {
    it('keeps the status separate from the body', () => {
        const result = new ApiResult(201, { any: 'payload' });

        assert.equal(result.status, 201);
        assert.deepEqual(result.body, { any: 'payload' });
    });
});

describe('JsonResponse', () => {
    it('success keeps the status outside the body', () => {
        const response = JsonResponse.success(201, { id: 1 });

        assert.equal(response.status, 201);
        assert.deepEqual(response.body, { success: true, data: { id: 1 } });
        assert.equal('status' in response.body, false);
    });

    it('ok is a 200 success without data', () => {
        const response = JsonResponse.ok();

        assert.equal(response.status, 200);
        assert.deepEqual(response.body, { success: true });
    });

    it('err defaults to 400 and accepts a custom status', () => {
        const defaulted = JsonResponse.err(new Error('bad input'));

        assert.equal(defaulted.status, 400);
        assert.deepEqual(defaulted.body, {
            success: false,
            message: 'bad input',
        });
        assert.equal(JsonResponse.err(new Error('gone'), 410).status, 410);
    });

    it('err turns a value that is not an Error into its text', () => {
        assert.equal(JsonResponse.err('boom').body.message, 'boom');
    });

    it('has ready-made responses with the right status', () => {
        assert.equal(JsonResponse.notFound().status, 404);
        assert.equal(JsonResponse.unAuthorised().status, 401);
        assert.equal(JsonResponse.forbidden().status, 403);
        assert.equal(JsonResponse.noRole().status, 403);
        assert.equal(JsonResponse.unexpected().status, 500);
    });

    it('marks every error response as unsuccessful with a message', () => {
        for (const response of [
            JsonResponse.notFound(),
            JsonResponse.unAuthorised(),
            JsonResponse.forbidden(),
            JsonResponse.noRole(),
            JsonResponse.unexpected(),
        ]) {
            assert.equal(response.body.success, false);
            assert.notEqual(response.body.message, '');
            assert.equal('status' in response.body, false);
        }
    });
});

describe('sendResponse', () => {
    it('uses the status as the HTTP status code and sends only the body', () => {
        const json = mock.fn();
        const status = mock.fn(() => ({ json }));
        const response = JsonResponse.success(201, { id: 1 });

        sendResponse({ status } as unknown as Response, response);

        assert.deepEqual(status.mock.calls[0]?.arguments, [201]);
        assert.equal(json.mock.calls[0]?.arguments[0], response.body);
        assert.deepEqual(json.mock.calls[0]?.arguments[0], {
            success: true,
            data: { id: 1 },
        });
    });
});
