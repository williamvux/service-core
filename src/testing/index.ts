import type { RequestHandler, Router } from 'express';

type RegisteredRoute = {
    method: string;
    path: string;
    handlers: RequestHandler[];
};

export const makeFakeRouter = () => {
    const routes: RegisteredRoute[] = [];
    const add =
        (method: string) =>
        (path: string, ...handlers: RequestHandler[]) => {
            routes.push({ method, path, handlers });
        };
    const router = {
        get: add('get'),
        post: add('post'),
        put: add('put'),
        patch: add('patch'),
        delete: add('delete'),
    } as unknown as Router;
    return { router, routes };
};

export const callRoute = async (
    route: RegisteredRoute,
    req: object = {},
): Promise<{ status?: number; body?: unknown }> => {
    const sent: { status?: number; body?: unknown } = {};
    const res = {
        status(code: number) {
            sent.status = code;
            return this;
        },
        json(body: unknown) {
            sent.body = body;
        },
    };
    const handler = route.handlers[route.handlers.length - 1] as unknown as (
        req: object,
        res: object,
        next: () => void,
    ) => Promise<void>;
    await handler(req, res, () => {});
    return sent;
};
