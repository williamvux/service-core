import { execFileSync } from 'node:child_process';
import {
    mkdirSync,
    readFileSync,
    mkdtempSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const pkgDir = join(import.meta.dirname, '..');
const { name } = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));
const dir = mkdtempSync(join(tmpdir(), 'demo-docker-pack-'));
const tarball = join(dir, 'core.tgz');
const consumer = join(dir, 'consumer');
const run = (command, args, cwd) =>
    execFileSync(command, args, { cwd, stdio: 'inherit' });

const files = {
    'package.json': JSON.stringify({
        name: 'consumer',
        type: 'module',
        private: true,
    }),
    'tsconfig.json': JSON.stringify({
        compilerOptions: {
            target: 'esnext',
            module: 'nodenext',
            strict: true,
            noEmit: true,
            skipLibCheck: false,
            types: ['node'],
        },
        include: ['app.ts'],
    }),
    'app.ts': `
import assert from 'node:assert/strict';
import express, { type RequestHandler } from 'express';
import {
    AppError, Controller, createErrorHandler,
    DI, Get, Guard, Inject, Post, registerControllers, Status,
} from '${name}';
import { makeFakeRouter } from '${name}/testing';

assert.equal(makeFakeRouter().routes.length, 0);
const unexpected: unknown[] = [];

DI.set('greeting', () => 'hi');
const requireName: RequestHandler = (req, _res, next) =>
    typeof req.body?.name === 'string' ? next() : next(new AppError('name is required', 'invalid'));
const keyGuard: RequestHandler = (req, _res, next) =>
    req.headers['x-key'] === 'k' ? next() : next(new AppError('no key', 'unauthorized'));

@Controller()
@Inject('greeting')
class DemoController {
    private greeting: string;
    constructor(greeting: string) { this.greeting = greeting; }

    @Get('/hello')
    async hello() { return this.greeting; }

    @Post('/echo', requireName)
    @Status(201)
    async echo(req: express.Request) { return req.body; }

    @Get('/guarded')
    @Guard(keyGuard)
    async guarded() { return 'secret'; }

    @Get('/boom')
    async boom(): Promise<never> { throw new Error('boom'); }
}

const app = express();
app.use(express.json());
const router = express.Router();
registerControllers(router);
app.use('/api', router);
app.use(createErrorHandler({ onUnexpectedError: (error) => unexpected.push(error) }));

const server = app.listen(0);
await new Promise((resolve) => server.once('listening', resolve));
const base = 'http://127.0.0.1:' + (server.address() as { port: number }).port + '/api';
const call = async (path: string, init?: RequestInit) => {
    const response = await fetch(base + path, init);
    return { status: response.status, body: await response.json() };
};
const post = (body: unknown) => ({
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
});

try {
    assert.deepEqual(await call('/hello'), { status: 200, body: { success: true, data: 'hi' } });
    assert.equal((await call('/echo', post({ name: 'x' }))).status, 201);
    assert.equal((await call('/echo', post({}))).status, 400);
    assert.equal((await call('/guarded')).status, 401);
    assert.equal((await call('/guarded', { headers: { 'x-key': 'k' } })).status, 200);
    assert.equal((await call('/boom')).status, 500);
    assert.equal(unexpected.length, 1, 'only /boom is unexpected');
    console.log('consumer app passed');
} finally {
    server.close();
}
`,
};

try {
    run('yarn', ['pack', '--filename', tarball], pkgDir);

    const listing = execFileSync('tar', ['-tzf', tarball], {
        encoding: 'utf8',
    });
    for (const expected of [
        'package/dist/index.js',
        'package/dist/testing.js',
        'package/dist/types/index.d.ts',
        'package/package.json',
    ]) {
        assert.ok(listing.includes(expected), `tarball is missing ${expected}`);
    }
    for (const unexpected of [
        'package/src/',
        'package/tests/',
        'package/scripts/',
    ]) {
        assert.ok(
            !listing.includes(unexpected),
            `tarball must not contain ${unexpected}`,
        );
    }

    mkdirSync(consumer);
    for (const [name, content] of Object.entries(files)) {
        writeFileSync(join(consumer, name), content);
    }
    run(
        'npm',
        [
            'install',
            '--no-audit',
            '--no-fund',
            '--silent',
            tarball,
            'express@5',
            'knex@3',
            '@types/express@5',
            '@types/node@22',
            'typescript@7',
            'tsx',
        ],
        consumer,
    );

    run('npx', ['tsc', '--noEmit'], consumer);
    run('npx', ['tsx', 'app.ts'], consumer);
    console.log('pack check passed');
} catch (error) {
    console.error(error);
    process.exitCode = 1;
} finally {
    rmSync(dir, { recursive: true, force: true });
}
