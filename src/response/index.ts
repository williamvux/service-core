import type { Response } from 'express';

export type SuccessBody<T> = { success: true; data?: T | undefined };
export type ErrorBody = { success: false; message: string };

export class ApiResult<TBody> {
    public readonly status: number;
    public readonly body: TBody;
    constructor(status: number, body: TBody) {
        this.status = status;
        this.body = body;
    }
}

export type AnyResult = ApiResult<SuccessBody<unknown> | ErrorBody>;

export class JsonResponse {
    constructor() {}

    static err(error: unknown, status: number = 400): ApiResult<ErrorBody> {
        const message = error instanceof Error ? error.message : String(error);
        return new ApiResult(status, { success: false, message });
    }

    static notFound(): ApiResult<ErrorBody> {
        return JsonResponse.err('Not Found', 404);
    }

    static noRole(): ApiResult<ErrorBody> {
        return JsonResponse.err('No Authentication', 403);
    }

    static unexpected(): ApiResult<ErrorBody> {
        return JsonResponse.err(
            'Unexpected error, please try again later',
            500,
        );
    }

    static forbidden(): ApiResult<ErrorBody> {
        return JsonResponse.err('Forbidden', 403);
    }

    static unAuthorised(): ApiResult<ErrorBody> {
        return JsonResponse.err('No Authorisation', 401);
    }

    static success<T>(status: number, data: T): ApiResult<SuccessBody<T>> {
        return new ApiResult(status, { success: true, data });
    }

    static ok<T = never>(): ApiResult<SuccessBody<T>> {
        return new ApiResult(200, { success: true });
    }
}

export const sendResponse = (res: Response, result: AnyResult): void => {
    res.status(result.status).json(result.body);
};
