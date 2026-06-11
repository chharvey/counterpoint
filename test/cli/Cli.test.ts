import * as assert from 'node:assert';
import * as test from 'node:test';
import {
	Cli,
	Command,
} from '../../src/index.ts';



test.suite('Cli', () => {
	test.suite('#constructor', () => {
		test.suite('no args', () => {
			test.test('prints the help message.', () => {
				const cli = new Cli(`
					npx cplc
				`.trim().split(' '));
				assert.deepStrictEqual([cli.argv.h, cli.argv.help], [false, false]);
				return assert.strictEqual(cli.command, Command.HELP);
			});
		});
		test.suite('--help', () => {
			test.test('same as `-h`; prints help message.', () => {
				const cli = new Cli(`
					npx cplc -h
				`.trim().split(' '));
				assert.strictEqual(cli.argv.help, true);
				assert.strictEqual(cli.argv.help, cli.argv.h);
				assert.strictEqual(cli.command, Command.HELP);
			});
		});
		test.suite('--help --config', () => {
			test.test('prints help text and config options.', () => {
				const cli = new Cli(`
					npx cplc -h --config
				`.trim().split(' '));
				assert.strictEqual(cli.argv.help, true);
				assert.strictEqual(cli.argv.config, true);
				assert.strictEqual(cli.command, Command.HELP);
			});
		});
		test.suite('--version', () => {
			test.test('same as `-v`; prints version number.', () => {
				const cli = new Cli(`
					npx cplc -v
				`.trim().split(' '));
				assert.strictEqual(cli.argv.version, true);
				assert.strictEqual(cli.argv.version, cli.argv.v);
				assert.strictEqual(cli.command, Command.VERSION);
			});
		});
		test.suite('interpret', () => {
			test.test('same as `i`; interprets given file.', () => {
				['interpret', 'i'].forEach((command) => {
					const cli = new Cli(`
						npx cplc ${ command } ./sample/test-v0.1.cpls
					`.trim().split(' '));
					assert.strictEqual(cli.argv._[1], './sample/test-v0.1.cpls');
					assert.strictEqual(cli.command, Command.INTERPRET);
				});
			});
		});
		test.suite('compile', () => {
			test.test('same as `c`; compiles given file.', () => {
				['compile', 'c'].forEach((command) => {
					const cli = new Cli(`
						npx cplc ${ command } ./sample/test-v0.1.cpls
					`.trim().split(' '));
					assert.strictEqual(cli.argv._[1], './sample/test-v0.1.cpls');
					assert.strictEqual(cli.command, Command.COMPILE);
				});
			});
		});
		test.suite('compile --out', () => {
			test.test('same as `-o`; compiles given file to specified output.', () => {
				const cli = new Cli(`
					npx cplc compile ./sample/test-v0.1.cpls --out ./sample/testout.wasm
				`.trim().split(' '));
				assert.strictEqual(cli.argv._[1], './sample/test-v0.1.cpls');
				assert.strictEqual(cli.argv.out, './sample/testout.wasm');
				assert.strictEqual(cli.argv.out, cli.argv.o);
			});
			test.test('throws when no output file is provided.', () => {
				assert.throws(
					() => new Cli(`
						npx cplc compile ./sample/test-v0.1.cpls --out
					`.trim().split(' ')),
					/Invalid CLI arguments!/,
				);
			});
		});
		test.suite('compile --project', () => {
			test.test('same as `-p`; compiles given file with the specified project settings.', () => {
				const cli = new Cli(`
					npx cplc compile ./sample/test-v0.1.cpls --project ./sample/counterpoint-config.json
				`.trim().split(' '));
				assert.strictEqual(cli.argv._[1], './sample/test-v0.1.cpls');
				assert.strictEqual(cli.argv.project, './sample/counterpoint-config.json');
				assert.strictEqual(cli.argv.project, cli.argv.p);
			});
			test.test('throws when no project file is provided.', () => {
				assert.throws(
					() => new Cli(`
						npx cplc compile ./sample/test-v0.1.cpls --project
					`.trim().split(' ')),
					/Invalid CLI arguments!/,
				);
			});
		});
		test.suite('dev', () => {
			test.test('same as `d`; debugs given file.', () => {
				['dev', 'd'].forEach((command) => {
					const cli = new Cli(`
						npx cplc ${ command } ./sample/test-v0.1.cpls
					`.trim().split(' '));
					assert.strictEqual(cli.argv._[1], './sample/test-v0.1.cpls');
					assert.strictEqual(cli.command, Command.DEV);
				});
			});
		});
		test.suite('dev --out', () => {
			test.test('same as `-o`; debugs given file to specified output.', () => {
				const cli = new Cli(`
					npx cplc dev ./sample/test-v0.1.cpls --out ./sample/testout.wat
				`.trim().split(' '));
				assert.strictEqual(cli.argv._[1], './sample/test-v0.1.cpls');
				assert.strictEqual(cli.argv.out, './sample/testout.wat');
				assert.strictEqual(cli.argv.out, cli.argv.o);
			});
			test.test('throws when no output file is provided.', () => {
				assert.throws(
					() => new Cli(`
						npx cplc dev ./sample/test-v0.1.cpls --out
					`.trim().split(' ')),
					/Invalid CLI arguments!/,
				);
			});
		});
		test.suite('dev --project', () => {
			test.test('same as `-p`; debugs given file with the specified project settings.', () => {
				const cli = new Cli(`
					npx cplc dev ./sample/test-v0.1.cpls --project ./sample/counterpoint-config.json
				`.trim().split(' '));
				assert.strictEqual(cli.argv._[1], './sample/test-v0.1.cpls');
				assert.strictEqual(cli.argv.project, './sample/counterpoint-config.json');
				assert.strictEqual(cli.argv.project, cli.argv.p);
			});
			test.test('throws when no project file is provided.', () => {
				assert.throws(
					() => new Cli(`
						npx cplc dev ./sample/test-v0.1.cpls --project
					`.trim().split(' ')),
					/Invalid CLI arguments!/,
				);
			});
		});
		test.suite('run', () => {
			test.test('same as `r`; runs given file.', () => {
				['run', 'r'].forEach((command) => {
					const cli = new Cli(`
						npx cplc ${ command } ./sample/test-v0.1.wasm
					`.trim().split(' '));
					assert.strictEqual(cli.argv._[1], './sample/test-v0.1.wasm');
					assert.strictEqual(cli.command, Command.RUN);
				});
			});
		});
	});
});
