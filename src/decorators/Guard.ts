import type { RequestHandler } from 'express';
import type { Handler } from './Handler.ts';

const guards = new WeakMap<object, RequestHandler[]>();

export function Guard(...middlewares: RequestHandler[]) {
    return (method: Handler, _context: ClassMethodDecoratorContext): void => {
        guards.set(method, middlewares);
    };
}

export const guardsOf = (method: Handler): RequestHandler[] =>
    guards.get(method) ?? [];
