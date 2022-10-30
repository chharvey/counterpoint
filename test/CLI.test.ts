import * as assert from 'assert';
import {
	CLI,
	Command,
} from '../src/CLI.class.js';



describe('CLI', () => {
	describe('#constructor', () => {
		context('no args', () => {
			it('prints the help message.', () => {
				const cli: CLI = new CLI(`
					npx cpc
				`.trim().split(' '));
				assert.deepStrictEqual([cli.argv.h, cli.argv.help], [false, false]);
				assert.deepStrictEqual(cli.command, Command.HELP);
			});
		});
		context('--help', () => {
			it('same as `-h`; prints help message.', () => {
				const cli: CLI = new CLI(`
					npx cpc -h
				`.trim().split(' '));
				assert.strictEqual(cli.argv.help, true);
				assert.strictEqual(cli.argv.help, cli.argv.h);
				assert.strictEqual(cli.command, Command.HELP);
			});
		});
		context('--help --config', () => {
			it('prints help text and config options.', () => {
				const cli: CLI = new CLI(`
					npx cpc -h --config
				`.trim().split(' '));
				assert.strictEqual(cli.argv.help, true);
				assert.strictEqual(cli.argv.config, true);
				assert.strictEqual(cli.command, Command.HELP);
			});
		});
		context('--version', () => {
			it('same as `-v`; prints version number.', () => {
				const cli: CLI = new CLI(`
					npx cpc -v
				`.trim().split(' '));
				assert.strictEqual(cli.argv.version, true);
				assert.strictEqual(cli.argv.version, cli.argv.v);
				assert.strictEqual(cli.command, Command.VERSION);
			});
		});
		context('compile', () => {
			it('same as `c`; compiles given file.', () => {
				['compile', 'c'].forEach((command) => {
					const cli: CLI = new CLI(`
						npx cpc ${ command } ./sample/test-v0.1.cp
					`.trim().split(' '));
					assert.strictEqual(cli.argv._[1], './sample/test-v0.1.cp');
					assert.strictEqual(cli.command, Command.COMPILE);
				});
			});
		});
		context('compile --out', () => {
			it('same as `-o`; compiles given file to specified output.', () => {
				const cli: CLI = new CLI(`
					npx cpc compile ./sample/test-v0.1.cp --out ./sample/testout.wasm
				`.trim().split(' '));
				assert.strictEqual(cli.argv._[1], './sample/test-v0.1.cp');
				assert.strictEqual(cli.argv.out, './sample/testout.wasm');
				assert.strictEqual(cli.argv.out, cli.argv.o);
			});
			it('throws when no output file is provided.', () => {
				assert.throws(
					() => new CLI(`
						npx cpc compile ./sample/test-v0.1.cp --out
					`.trim().split(' ')),
					/Invalid CLI arguments!/,
				);
			});
		});
		context('compile --project', () => {
			it('same as `-p`; compiles given file with the specified project settings.', () => {
				const cli: CLI = new CLI(`
					npx cpc compile ./sample/test-v0.1.cp --project ./sample/counterpoint-config.json
				`.trim().split(' '));
				assert.strictEqual(cli.argv._[1], './sample/test-v0.1.cp');
				assert.strictEqual(cli.argv.project, './sample/counterpoint-config.json');
				assert.strictEqual(cli.argv.project, cli.argv.p);
			});
			it('throws when no project file is provided.', () => {
				assert.throws(
					() => new CLI(`
						npx cpc compile ./sample/test-v0.1.cp --project
					`.trim().split(' ')),
					/Invalid CLI arguments!/,
				);
			});
		});
		context('dev', () => {
			it('same as `d`; debugs given file.', () => {
				['dev', 'd'].forEach((command) => {
					const cli: CLI = new CLI(`
						npx cpc ${ command } ./sample/test-v0.1.cp
					`.trim().split(' '));
					assert.strictEqual(cli.argv._[1], './sample/test-v0.1.cp');
					assert.strictEqual(cli.command, Command.DEV);
				});
			});
		});
		context('dev --out', () => {
			it('same as `-o`; debugs given file to specified output.', () => {
				const cli: CLI = new CLI(`
					npx cpc dev ./sample/test-v0.1.cp --out ./sample/testout.wat
				`.trim().split(' '));
				assert.strictEqual(cli.argv._[1], './sample/test-v0.1.cp');
				assert.strictEqual(cli.argv.out, './sample/testout.wat');
				assert.strictEqual(cli.argv.out, cli.argv.o);
			});
			it('throws when no output file is provided.', () => {
				assert.throws(
					() => new CLI(`
						npx cpc dev ./sample/test-v0.1.cp --out
					`.trim().split(' ')),
					/Invalid CLI arguments!/,
				);
			});
		});
		context('dev --project', () => {
			it('same as `-p`; debugs given file with the specified project settings.', () => {
				const cli: CLI = new CLI(`
					npx cpc dev ./sample/test-v0.1.cp --project ./sample/counterpoint-config.json
				`.trim().split(' '));
				assert.strictEqual(cli.argv._[1], './sample/test-v0.1.cp');
				assert.strictEqual(cli.argv.project, './sample/counterpoint-config.json');
				assert.strictEqual(cli.argv.project, cli.argv.p);
			});
			it('throws when no project file is provided.', () => {
				assert.throws(
					() => new CLI(`
						npx cpc dev ./sample/test-v0.1.cp --project
					`.trim().split(' ')),
					/Invalid CLI arguments!/,
				);
			});
		});
		context('run', () => {
			it('same as `r`; runs given file.', () => {
				['run', 'r'].forEach((command) => {
					const cli: CLI = new CLI(`
						npx cpc ${ command } ./sample/test-v0.1.wasm
					`.trim().split(' '));
					assert.strictEqual(cli.argv._[1], './sample/test-v0.1.wasm');
					assert.strictEqual(cli.command, Command.RUN);
				});
			});
		});
	});
});
