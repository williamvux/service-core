import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import DI from '../../src/di/DI.ts';
import { Inject, instantiate } from '../../src/decorators/Inject.ts';

describe('@Inject and instantiate', () => {
    DI.set('inject.a', () => 'A');
    DI.set('inject.b', () => 'B');

    @Inject('inject.a', 'inject.b')
    class WithDependencies {
        a: string;
        b: string;
        constructor(a: string, b: string) {
            this.a = a;
            this.b = b;
        }
    }

    class WithoutDependencies {
        value = 1;
    }

    @Inject('inject.missing')
    class WithMissingDependency {}

    it('passes the dependencies to the constructor in the declared order', () => {
        const instance = instantiate(WithDependencies);

        assert.ok(instance instanceof WithDependencies);
        assert.deepEqual([instance.a, instance.b], ['A', 'B']);
    });

    it('builds a class without @Inject with no arguments', () => {
        assert.equal(instantiate(WithoutDependencies).value, 1);
    });

    it('throws when a declared token is not registered', () => {
        assert.throws(
            () => instantiate(WithMissingDependency),
            /No dependency registered for inject.missing/,
        );
    });

    it('resolves transient dependencies again for every instance', () => {
        let created = 0;
        DI.set('inject.counter', () => ++created);

        @Inject('inject.counter')
        class Counted {
            n: number;
            constructor(n: number) {
                this.n = n;
            }
        }

        assert.deepEqual(
            [instantiate(Counted).n, instantiate(Counted).n],
            [1, 2],
        );
    });
});
