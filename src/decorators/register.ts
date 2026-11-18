import type { RequestHandler, Router } from 'express';
import { guardsOf } from './Guard.ts';
import { registeredControllers } from './Controller.ts';
import type { Handler } from './Handler.ts';
import { instantiate } from './Inject.ts';
import { routesOf } from './Route.ts';
import { statusOf } from './Status.ts';
import {
    type AnyResult,
    ApiResult,
    JsonResponse,
    sendResponse,
} from '../response/index.ts';

const methodOf = (controller: object, name: string): Handler => {
    const method: unknown = (controller as Record<string, unknown>)[name];
    if (typeof method !== 'function') {
        throw new Error(`${name} is not a controller method`);
    }
    return method as Handler;
};

const toHandler = (controller: object, method: Handler): RequestHandler => {
    const status = statusOf(method);
    return async (req, res) => {
        const data: unknown = await method.call(controller, req as never);
        sendResponse(
            res,
            data instanceof ApiResult
                ? (data as AnyResult)
                : JsonResponse.success(status, data),
        );
    };
};

const registerRoutes = (controller: object, router: Router): void => {
    for (const { httpMethod, path, middlewares, name } of routesOf(
        controller,
    )) {
        const method = methodOf(controller, name);
        router[httpMethod](
            path,
            ...guardsOf(method),
            ...middlewares,
            toHandler(controller, method),
        );
    }
};

export const registerControllers = (router: Router): void => {
    for (const controller of registeredControllers()) {
        registerRoutes(instantiate(controller), router);
    }
};
