export type ErrorKind =
    'invalid' | 'unauthorized' | 'forbidden' | 'notFound' | 'conflict';

export class AppError extends Error {
    public readonly kind: ErrorKind;

    constructor(message: string, kind: ErrorKind = 'invalid') {
        super(message);
        this.name = 'AppError';
        this.kind = kind;
    }
}
