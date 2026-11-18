import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { RequestHandler } from 'express';
import {
    Controller,
    Delete,
    Get,
    Guard,
    Patch,
    Post,
    Put,
    registerControllers,
    Status,
} from '../../src/decorators/index.ts';
import { JsonResponse } from '../../src/response/index.ts';
import { callRoute, makeFakeRouter } from '../../src/testing/index.ts';

const guard: RequestHandler = (_req, _res, next) => next();
const first: RequestHandler = (_req, _res, next) => next();
const second: RequestHandler = (_req, _res, next) => next();

@Controller()
export class SampleController {
    @Get('/plain')
    async plain() {
        return { a: 1 };
    }

    @Post('/created', guard)
    @Status(201)
    async created() {
        return { b: 2 };
    }

    @Put('/custom')
    async custom() {
        return JsonResponse.notFound();
    }

    @Patch('/self')
    async self() {
        return { same: this instanceof SampleController };
    }

    @Delete('/boom')
    async boom(): Promise<never> {
        throw new Error('boom');
    }

    @Get('/one', guard)
    @Guard(first)
    async me() {
        return {};
    }

    @Get('/two', guard)
    @Guard(first, second)
    async admin() {
        return {};
    }

    notARoute() {}
}

const setup = () => {
    const { router, routes } = makeFakeRouter();
    registerControllers(router);
    const find = (method: string, path: string) => {
        const found = routes.find(
            (r) => r.method === method && r.path === path,
        );
        assert.ok(found, `${method} ${path} should be registered`);
        return found;
    };
    return { routes, find };
};

describe('registerControllers routes', () => {
    it('registers only decorated methods, in source order', () => {
        const { routes } = setup();

        assert.deepEqual(
            routes.map((r) => `${r.method} ${r.path}`),
            [
                'get /plain',
                'post /created',
                'put /custom',
                'patch /self',
                'delete /boom',
                'get /one',
                'get /two',
            ],
        );
    });

    it('puts the middlewares before the controller handler', () => {
        const { find } = setup();
        const route = find('post', '/created');

        assert.equal(route.handlers.length, 2);
        assert.equal(route.handlers[0], guard);
    });

    it('puts the guards, in order, before the route middlewares', () => {
        const { find } = setup();

        assert.equal(find('get', '/plain').handlers.length, 1);
        assert.equal(find('get', '/one').handlers.length, 3);
        assert.equal(find('get', '/one').handlers[0], first);
        assert.equal(find('get', '/one').handlers[1], guard);
        assert.equal(find('get', '/two').handlers.length, 4);
        assert.deepEqual(find('get', '/two').handlers.slice(0, 3), [
            first,
            second,
            guard,
        ]);
    });

    it('wraps returned data as a 200 success by default', async () => {
        const sent = await callRoute(setup().find('get', '/plain'));

        assert.equal(sent.status, 200);
        assert.deepEqual(sent.body, { success: true, data: { a: 1 } });
    });

    it('uses the status given to @Status', async () => {
        const sent = await callRoute(setup().find('post', '/created'));

        assert.equal(sent.status, 201);
        assert.deepEqual(sent.body, { success: true, data: { b: 2 } });
    });

    it('sends an ApiResult as it is', async () => {
        const sent = await callRoute(setup().find('put', '/custom'));

        assert.equal(sent.status, 404);
        assert.deepEqual(sent.body, { success: false, message: 'Not Found' });
    });

    it('calls the method with the controller as this', async () => {
        const sent = await callRoute(setup().find('patch', '/self'));

        assert.deepEqual(sent.body, { success: true, data: { same: true } });
    });

    it('rejects when the method throws so Express can forward the error', async () => {
        await assert.rejects(
            callRoute(setup().find('delete', '/boom')),
            /boom/,
        );
    });

    it('keeps routes of different instances separate', () => {
        const first = makeFakeRouter();
        const second = makeFakeRouter();
        registerControllers(first.router);
        registerControllers(second.router);

        assert.equal(first.routes.length, 7);
        assert.equal(second.routes.length, 7);
    });
});
