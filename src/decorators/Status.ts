import type { Handler } from './Handler.ts';

const statuses = new WeakMap<object, number>();

export function Status(code: number) {
    return (method: Handler, _context: ClassMethodDecoratorContext): void => {
        statuses.set(method, code);
    };
}

export const statusOf = (method: Handler): number =>
    statuses.get(method) ?? 200;
