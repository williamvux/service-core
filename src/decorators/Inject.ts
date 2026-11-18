import DI from '../di/DI.ts';

type Constructor<T> = new (...args: never[]) => T;

const tokensOf = new WeakMap<object, string[]>();

export function Inject(...tokens: string[]) {
    return (target: Constructor<unknown>, _context: ClassDecoratorContext) => {
        tokensOf.set(target, tokens);
    };
}

export function instantiate<T>(target: Constructor<T>): T {
    const dependencies = (tokensOf.get(target) ?? []).map((token) =>
        DI.get(token),
    );
    return new target(...(dependencies as never[]));
}
