import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as core from '../src/index.ts';

describe('public API', () => {
    it('exports everything an app needs', () => {
        assert.deepEqual(Object.keys(core).sort(), [
            'ApiResult',
            'AppError',
            'BaseRepository',
            'Controller',
            'DI',
            'Delete',
            'Get',
            'Guard',
            'Inject',
            'JsonResponse',
            'Patch',
            'Post',
            'Put',
            'Status',
            'createErrorHandler',
            'errorHandler',
            'instantiate',
            'registerControllers',
            'sendResponse',
        ]);
    });
});
