import * as fs from 'node:fs';
import * as path from 'node:path';
import * as xjs from 'extrajs';
import minimist from 'minimist'; // need `tsconfig.json#compilerOptions.allowSyntheticDefaultImports = true`
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../core/index.ts';
import {Program} from './Program.ts';



type Mutable<T> = { // NB https://github.com/microsoft/TypeScript/issues/24509
	-readonly [P in keyof T]: Mutable<T[P]>
};

type PartialCplConfig = Partial<{
	readonly languageFeatures: Partial<CplConfig['languageFeatures']>,
	readonly compilerOptions:  Partial<CplConfig['compilerOptions']>,
}>;

export enum Command {
	HELP,
	VERSION,
	COMPILE,
	DEV,
	RUN,
}

type CustomArgsType = {
	// CLI Options
	/** Display help text. */
	help:     boolean,
	/** Display version number. */
	version:  boolean,
	/** Specify output filepath. */
	out?:     string,
	/** Specify configuration filepath. */
	project?: string,
	/** Display configuration options. */
	config:   boolean,
	// abbrevs
	h:        boolean,
	v:        boolean,
	o:        string,
	p:        string,

	// Language Features

	// Compiler Options
};



/**
 * Code for the command line interface.
 * A Cli object is a single instance of a CLI run.
 */
export class Cli {
	/** Text to print on --help. */
	public static readonly HELPTEXT: string = xjs.String.dedent`
		Usage: cplc <command> <filepath> [<options>]

		Parse, analyze, and compile a Counterpoint source code file.
		Executables are in WASM binary format. Plaintext outputs are in WAT format.
		See [WebAssembly](https://webassembly.org/) for details.

		Examples:
		\`\`\`
		# Compile \`test.cpls\` to \`test.wasm\`:
		$ cplc compile test.cpls

		# Compile \`src/input.cpls\` to \`build/output.wasm\`:
		$ cplc compile src/input.cpls --out build/output.wasm

		# Debug \`program.cpls\` (writes to \`program.wat\`):
		$ cplc dev program.cpls

		# Execute \`program.wasm\`:
		$ cplc run program.wasm
		\`\`\`

		Commands:
		help                           Print this help message.
		version                        Print the version of Counterpoint currently installed.
		c, compile                     Compile a Counterpoint file into a \`*.wasm\` executable binary.
		d, dev                         Compile a Counterpoint file into a \`*.wat\` text file for inspection.
		r, run                         Execute a compiled binary file. Ignore the \`--out\` option.

		Options:
		-h, --help                     Print this help message.
		-v, --version                  Print the version of Counterpoint currently installed.
		-o, --out=file                 Specify the output file.
		                               Otherwise, the default output filepath is the input filepath except
		                               with the extension changed to \`.wasm\` (compile) or \`.wat\` (dev).
		-p, --project=file             Specify a configuration file.
		--config                       Print all possible configuration options.
	`.trimStart();

	/** Text to print on --config. */
	public static readonly CONFIGTEXT: string = xjs.String.dedent`
		The following options set individual language features and compiler options.
		These options will override those in the configuration file provided by \`--project\`.

		Language Features:

		Compiler Options:
	`.trimStart();

	/** Options argument to `minimist` function. */
	private static readonly MINIMIST_OPTS: minimist.Opts = {
		boolean: [
			// CLI Options
			'help',
			'version',
			'config',
			// Language Features
			// Compiler Options
		],
		string: [
			// CLI Options
			'out',
			'project',
		],
		alias: {
			h: 'help',
			v: 'version',
			o: 'out',
			p: 'project',
		},
		default: {
			// CLI Options
			help:    false,
			version: false,
			config:  false,

			// Language Features

			// Compiler Options
		},
		unknown(arg) {
			if (arg.startsWith('-')) { // only check unsupported options // NB https://github.com/substack/minimist/issues/86
				throw new Error(xjs.String.dedent`
					Unknown CLI option: ${ arg }
					${ Cli.HELPTEXT }
				`.trimStart());
			}
			return true;
		},
	};


	public readonly command: Command;
	public readonly argv:    CustomArgsType & minimist.ParsedArgs;
	/**
	 * Construct a new CLI object.
	 * @param process_argv the arguments sent to NodeJS.Process.argv
	 */
	public constructor(process_argv: readonly string[]) {
		this.argv = minimist<CustomArgsType>(process_argv.slice(2), Cli.MINIMIST_OPTS);
		this.command = (
			(this.argv.help || this.argv.config) ? Command.HELP :
			(this.argv.version) ? Command.VERSION :
			new Map<string, Command>([
				['help',    Command.HELP],
				['version', Command.VERSION],
				['compile', Command.COMPILE],
				['c',       Command.COMPILE],
				['dev',     Command.DEV],
				['d',       Command.DEV],
				['run',     Command.RUN],
				['r',       Command.RUN],
			]).get(this.argv._[0]) ?? Command.HELP
		);
		if (this.argv.out === '' || this.argv.project === '') {
			throw new Error(`
				Invalid CLI arguments!
				${ Cli.HELPTEXT }
			`);
		}
	}

	/**
	 * Compute the cascading configuration for this Cli.
	 * Cascade in order of precedence (1 is lowest):
	 * 1. The Counterpoint Default Configuration file.
	 * 2. A configuration file specified via `--project` CLI option.
	 * 3. Any individual CLI options.
	 * @param cwd the current working directory, `process.cwd()`
	 * @return the computed configuration object
	 */
	private async computeConfig(cwd: string): Promise<CplConfig> {
		const config: PartialCplConfig = this.argv.project
			? JSON.parse(await fs.promises.readFile(path.join(cwd, path.normalize(this.argv.project)), 'utf8')) as PartialCplConfig
			: {};

		const returned: Mutable<CplConfig> = {
			...CONFIG_DEFAULT,
			...config,
			languageFeatures: {
				...CONFIG_DEFAULT.languageFeatures,
				...config.languageFeatures,
			},
			compilerOptions: {
				...CONFIG_DEFAULT.compilerOptions,
				...config.compilerOptions,
			},
		};

		return returned;
	}

	/**
	 * Helper method for validating input path.
	 * @param cwd the current working directory, `process.cwd()`
	 * @return a valid path to the input file
	 */
	private inputPath(cwd: string): string {
		if (!this.argv._[1]) {
			throw new Error(`
				No path specified!
				${ Cli.HELPTEXT }
			`);
		}
		return path.join(cwd, path.normalize(this.argv._[1]));
	}

	/**
	 * Run the command `compile` or `dev`.
	 * @param cwd the current working directory, `process.cwd()`
	 */
	public async compileOrDev(cwd: string): Promise<[string, undefined]> {
		const inputfilepath: string = this.inputPath(cwd);
		const outputfilepath: string = this.argv.out ? path.join(cwd, path.normalize(this.argv.out)) : path.format({
			...path.parse(inputfilepath),
			base: void 0,
			ext:  this.command === Command.DEV ? '.wat' : '.wasm',
		});
		const program = new Program(...await Promise.all([
			fs.promises.readFile(inputfilepath, 'utf8'),
			this.computeConfig(cwd),
		]));
		return Promise.all([
			// eslint-disable-next-line @typescript-eslint/await-thenable --- we want to return the string and promise together while it’s resolving
			xjs.String.dedent`
				Compiling………
				Source file: ${ inputfilepath }
				${ (this.command === Command.DEV) ? 'Intermediate text file (for debugging):' : 'Destination binary file:' } ${ outputfilepath }
			`.trimStart(),
			fs.promises.writeFile(outputfilepath, this.command === Command.DEV ? program.print() : program.compile()) as Promise<undefined>,
		]);
	}

	/**
	 * Run the command `run`.
	 * @param cwd the current working directory, `process.cwd()`
	 */
	public async run(cwd: string): Promise<[string, ...unknown[]]> {
		const inputfilepath: string                = this.inputPath(cwd);
		const bytes:         Promise<BufferSource> = fs.promises.readFile(inputfilepath);
		return [
			xjs.String.dedent`
				Executing………
				Binary path: ${ inputfilepath }
			`.trimStart(),
			...(Object.values((await WebAssembly.instantiate(await bytes)).instance.exports) as Array<() => unknown>).map((func) => func()),
		];
	}
}
