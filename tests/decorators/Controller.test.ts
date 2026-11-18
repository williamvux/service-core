import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    Controller,
    Get,
    registerControllers,
} from '../../src/decorators/index.ts';
import { registeredControllers } from '../../src/decorators/Controller.ts';
import { makeFakeRouter } from '../../src/testing/index.ts';

@Controller()
class FirstController {
    @Get('/first')
    async first() {
        return 1;
    }
}

@Controller()
class SecondController {
    @Get('/second')
    async second() {
        return 2;
    }
}

class UndecoratedController {
    @Get('/undecorated')
    async undecorated() {
        return 3;
    }
}

describe('@Controller', () => {
    it('collects decorated classes in definition order', () => {
        assert.deepEqual(registeredControllers(), [
            FirstController,
            SecondController,
        ]);
    });

    it('collects a class once even if it is decorated again', () => {
        Controller()(FirstController, {} as ClassDecoratorContext);

        assert.deepEqual(registeredControllers(), [
            FirstController,
            SecondController,
        ]);
    });

    it('does not collect classes without the decorator', () => {
        assert.ok(!registeredControllers().includes(UndecoratedController));
    });

    it('registerControllers registers every decorated controller and nothing else', () => {
        const { router, routes } = makeFakeRouter();
        registerControllers(router);

        assert.deepEqual(
            routes.map((r) => r.path),
            ['/first', '/second'],
        );
    });
});
