import type { RequestHandler } from 'express';
import type { Handler } from './Handler.ts';

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';
export type Route = {
    httpMethod: HttpMethod;
    path: string;
    middlewares: RequestHandler[];
    name: string;
};

const routes = new WeakMap<object, Route[]>();

const route =
    (httpMethod: HttpMethod) =>
    (path: string, ...middlewares: RequestHandler[]) =>
    (_method: Handler, context: ClassMethodDecoratorContext<object>) => {
        context.addInitializer(function () {
            const list = routes.get(this) ?? [];
            list.push({
                httpMethod,
                path,
                middlewares,
                name: String(context.name),
            });
            routes.set(this, list);
        });
    };

export const Get = route('get');
export const Post = route('post');
export const Put = route('put');
export const Patch = route('patch');
export const Delete = route('delete');

export const routesOf = (controller: object): Route[] =>
    routes.get(controller) ?? [];
