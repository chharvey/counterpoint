import * as assert from 'node:assert';
import * as test from 'node:test';
import {
	type MethodDecorator,
	type GetterDecorator,
	noopMethod,
	noopGetter,
} from '../../src/index.ts';



test.suite('@noopMethod', () => {
	test.test('does not apply nor call decorator.', () => {
		let decorator_applications: bigint = 0n;
		let decorated_calls:        bigint = 0n;

		function decorator(method: (this: Klass) => string): typeof method {
			decorator_applications++;
			return function () {
				decorated_calls++;
				return `${ method.call(this) }!!`;
			};
		}

		class Klass {
			public notDecorated(): string {
				return 'A';
			}

			@decorator
			public decorated(): string {
				return 'B';
			}

			@noopMethod(decorator)
			public decoratorCancelled(): string {
				return 'C';
			}
		}

		assert.strictEqual(decorator_applications, 1n, 'decorator should be applied on class declaration. decorator should not be applied when it’s an argument to `noop`.');
		assert.strictEqual(decorated_calls,        0n);

		const obj = new Klass();

		obj.notDecorated();
		const a = obj.notDecorated();
		assert.strictEqual(decorated_calls, 0n, 'decorator function should not be called since method is not decorated.');
		assert.strictEqual(a, 'A');

		obj.decorated();
		const b = obj.decorated();
		assert.strictEqual(decorated_calls, 2n, 'decorator function should be called on method call.');
		assert.strictEqual(b, 'B!!');

		obj.decoratorCancelled();
		const c = obj.decoratorCancelled();
		assert.strictEqual(decorated_calls, 2n, 'decorator function should not be called when it’s an argument to `noop`.');
		assert.strictEqual(c, 'C');

		assert.strictEqual(decorator_applications, 1n);
	});


	test.test('does execute factory.', () => {
		let factory_calls:          bigint = 0n;
		let decorator_applications: bigint = 0n;
		let decorated_calls:        bigint = 0n;

		function decoratorFactory(): MethodDecorator<Klass, (this: Klass) => string> {
			factory_calls++;
			return (method) => {
				decorator_applications++;
				return function () {
					decorated_calls++;
					return `${ method.call(this) }!!`;
				};
			};
		}

		class Klass {
			public notDecorated(): string {
				return 'A';
			}

			@decoratorFactory()
			public decorated(): string {
				return 'B';
			}

			@noopMethod(decoratorFactory())
			public decoratorCancelled(): string {
				return 'C';
			}
		}

		assert.strictEqual(factory_calls,          2n, 'factories are called when decorators are applied, even when it’s an argument to `noop`.');
		assert.strictEqual(decorator_applications, 1n);
		assert.strictEqual(decorated_calls,        0n);

		const obj = new Klass();

		obj.notDecorated();
		const a = obj.notDecorated();
		assert.strictEqual(decorated_calls, 0n);
		assert.strictEqual(a, 'A');

		obj.decorated();
		const b = obj.decorated();
		assert.strictEqual(decorated_calls, 2n);
		assert.strictEqual(b, 'B!!');

		obj.decoratorCancelled();
		const c = obj.decoratorCancelled();
		assert.strictEqual(decorated_calls, 2n);
		assert.strictEqual(c, 'C');

		assert.strictEqual(factory_calls,          2n);
		assert.strictEqual(decorator_applications, 1n);
	});
});



/* eslint-disable @typescript-eslint/class-literal-property-style */
test.suite('@noopGetter', () => {
	test.test('does not apply nor call decorator.', () => {
		let decorator_applications: bigint = 0n;
		let decorated_calls:        bigint = 0n;

		function decorator(getter: (this: Klass) => string): typeof getter {
			decorator_applications++;
			return function () {
				decorated_calls++;
				return `${ getter.call(this) }!!`;
			};
		}

		class Klass {
			public get notDecorated(): string {
				return 'A';
			}

			@decorator
			public get decorated(): string {
				return 'B';
			}

			@noopGetter(decorator)
			public get decoratorCancelled(): string {
				return 'C';
			}
		}

		assert.strictEqual(decorator_applications, 1n, 'decorator should be applied on class declaration. decorator should not be applied when it’s an argument to `noop`.');
		assert.strictEqual(decorated_calls,        0n);

		const obj = new Klass();

		obj.notDecorated;
		const a = obj.notDecorated;
		assert.strictEqual(decorated_calls, 0n, 'decorator function should not be called since method is not decorated.');
		assert.strictEqual(a, 'A');

		obj.decorated;
		const b = obj.decorated;
		assert.strictEqual(decorated_calls, 2n, 'decorator function should be called on method call.');
		assert.strictEqual(b, 'B!!');

		obj.decoratorCancelled;
		const c = obj.decoratorCancelled;
		assert.strictEqual(decorated_calls, 2n, 'decorator function should not be called when it’s an argument to `noop`.');
		assert.strictEqual(c, 'C');

		assert.strictEqual(decorator_applications, 1n);
	});


	test.test('does execute factory.', () => {
		let factory_calls:          bigint = 0n;
		let decorator_applications: bigint = 0n;
		let decorated_calls:        bigint = 0n;

		function decoratorFactory(): GetterDecorator<Klass, string> {
			factory_calls++;
			return (getter) => {
				decorator_applications++;
				return function () {
					decorated_calls++;
					return `${ getter.call(this) }!!`;
				};
			};
		}

		class Klass {
			public get notDecorated(): string {
				return 'A';
			}

			@decoratorFactory()
			public get decorated(): string {
				return 'B';
			}

			@noopGetter(decoratorFactory())
			public get decoratorCancelled(): string {
				return 'C';
			}
		}

		assert.strictEqual(factory_calls,          2n, 'factories are called when decorators are applied, even when it’s an argument to `noop`.');
		assert.strictEqual(decorator_applications, 1n);
		assert.strictEqual(decorated_calls,        0n);

		const obj = new Klass();

		obj.notDecorated;
		const a = obj.notDecorated;
		assert.strictEqual(decorated_calls, 0n);
		assert.strictEqual(a, 'A');

		obj.decorated;
		const b = obj.decorated;
		assert.strictEqual(decorated_calls, 2n);
		assert.strictEqual(b, 'B!!');

		obj.decoratorCancelled;
		const c = obj.decoratorCancelled;
		assert.strictEqual(decorated_calls, 2n);
		assert.strictEqual(c, 'C');

		assert.strictEqual(factory_calls,          2n);
		assert.strictEqual(decorator_applications, 1n);
	});
});
/* eslint-enable @typescript-eslint/class-literal-property-style */
