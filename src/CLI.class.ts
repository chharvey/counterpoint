import * as xjs from 'extrajs';
import * as fs from 'fs';
import * as path from 'path';
import minimist from 'minimist'; // need `tsconfig.json#compilerOptions.allowSyntheticDefaultImports = true`
import {
	CPConfig,
	CONFIG_DEFAULT,
} from './core/index.js';
import {Builder} from './builder/index.js';



type Mutable<T> = { // NB https://github.com/microsoft/TypeScript/issues/24509
	-readonly [P in keyof T]: Mutable<T[P]>
};

type PartialCPConfig = Partial<{
	readonly languageFeatures: Partial<CPConfig['languageFeatures']>,
	readonly compilerOptions:  Partial<CPConfig['compilerOptions']>,
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
	help: boolean;
	/** Display version number. */
	version: boolean;
	/** Specify output filepath. */
	out: string;
	/** Specify configuration filepath. */
	project: string;
	/** Display configuration options. */
	config: boolean;

	// Language Features
	comments          : null | boolean,
	integerRadices    : null | boolean,
	numericSeparators : null | boolean,

	// Compiler Options
	constantFolding: null | boolean,
	intCoercion:     null | boolean,
};



/**
 * Code for the command line interface.
 * A CLI object is a single instance of a CLI run.
 */
export class CLI {
	/** Text to print on --help. */
	static readonly HELPTEXT: string = xjs.String.dedent`
		Usage: cpc <command> <filepath> [<options>]

		Parse, analyze, and compile a Counterpoint source code file.
		Executables are in WASM binary format. Plaintext outputs are in WAT format.
		See [WebAssembly](https://webassembly.org/) for details.

		Examples:
		\`\`\`
		# Compile \`test.cp\` to \`test.wasm\`:
		$ cpc compile test.cp

		# Compile \`src/input.cp\` to \`build/output.wasm\`:
		$ cpc compile src/input.cp --out build/output.wasm

		# Debug \`program.cp\` (writes to \`program.wat\`):
		$ cpc dev program.cp

		# Execute \`program.wasm\`:
		$ cpc run program.wasm
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
	static readonly CONFIGTEXT: string = xjs.String.dedent`
		The following options set individual language features and compiler options.
		These options will override those in the configuration file provided by \`--project\`.

		Language Features:
		--[no-]comments                (on by default)
		--[no-]integerRadices
		--[no-]numericSeparators

		Compiler Options:
		--[no-]constantFolding         (on by default)
		--[no-]intCoercion             (on by default)
	`.trimStart();

	/** Options argument to `minimist` function. */
	private static readonly MINIMIST_OPTS: minimist.Opts = {
		boolean: [
			// CLI Options
			'help',
			'version',
			'config',
			// Language Features
			'comments',
			'integerRadices',
			'numericSeparators',
			// Compiler Options
			'constantFolding',
			'intCoercion',
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
			comments:          null,
			integerRadices:    null,
			numericSeparators: null,

			// Compiler Options
			constantFolding: null,
			intCoercion:     null,
		},
		unknown(arg) {
			if (arg[0] === '-') { // only check unsupported options // NB https://github.com/substack/minimist/issues/86
				throw new Error(xjs.String.dedent`
					Unknown CLI option: ${ arg }
					${ CLI.HELPTEXT }
				`.trimStart());
			}
			return true;
		},
	};


	readonly command: Command;
	readonly argv: CustomArgsType & minimist.ParsedArgs;
	/**
	 * Construct a new CLI object.
	 * @param process_argv the arguments sent to NodeJS.Process.argv
	 */
	constructor(process_argv: readonly string[]) {
		this.argv = minimist<CustomArgsType>(process_argv.slice(2), CLI.MINIMIST_OPTS);
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
			]).get(this.argv._[0]) || Command.HELP
		);
		if (!(
			   (this.argv.out     === void 0 || typeof this.argv.out     === 'string' && this.argv.out     !== '')
			&& (this.argv.project === void 0 || typeof this.argv.project === 'string' && this.argv.project !== '')
		)) throw new Error(`
			Invalid CLI arguments!
			${ CLI.HELPTEXT }
		`);
	}

	/**
	 * Compute the cascading configuration for this CLI.
	 * Cascade in order of precedence (1 is lowest):
	 * 1. The Counterpoint Default Configuration file.
	 * 2. A configuration file specified via `--project` CLI option.
	 * 3. Any individual CLI options.
	 * @param cwd the current working directory, `process.cwd()`
	 * @return the computed configuration object
	 */
	private async computeConfig(cwd: string): Promise<CPConfig> {
		const config: PartialCPConfig | Promise<PartialCPConfig> = (this.argv.project)
			? fs.promises.readFile(path.join(cwd, path.normalize(this.argv.project)), 'utf8').then((text) => JSON.parse(text))
			: {};

		const returned: Mutable<CPConfig> = {
			...CONFIG_DEFAULT,
			...await config,
			languageFeatures: {
				...CONFIG_DEFAULT.languageFeatures,
				...(await config).languageFeatures,
			},
			compilerOptions: {
				...CONFIG_DEFAULT.compilerOptions,
				...(await config).compilerOptions,
			},
		};

		if (this.argv.comments          !== null) returned.languageFeatures.comments          = this.argv.comments;
		if (this.argv.integerRadices    !== null) returned.languageFeatures.integerRadices    = this.argv.integerRadices;
		if (this.argv.numericSeparators !== null) returned.languageFeatures.numericSeparators = this.argv.numericSeparators;
		if (this.argv.constantFolding   !== null) returned.compilerOptions.constantFolding    = this.argv.constantFolding;
		if (this.argv.intCoercion       !== null) returned.compilerOptions.intCoercion        = this.argv.intCoercion;

		return returned;
	}

	/**
	 * Helper method for validating input path.
	 * @param cwd the current working directory, `process.cwd()`
	 * @return a valid path to the input file
	 */
	private inputPath(cwd: string): string {
		if (!this.argv._[1]) throw new Error(`
			No path specified!
			${ CLI.HELPTEXT }
		`);
		return path.join(cwd, path.normalize(this.argv._[1]));
	}

	/**
	 * Run the command `compile` or `dev`.
	 * @param cwd the current working directory, `process.cwd()`
	 */
	async compileOrDev(cwd: string): Promise<[string, void]> {
		const inputfilepath: string = this.inputPath(cwd);
		const outputfilepath: string = this.argv.out ? path.join(cwd, path.normalize(this.argv.out)) : path.format({
			...path.parse(inputfilepath),
			base: void 0,
			ext:  this.command === Command.DEV ? '.wat' : '.wasm',
		});
		const cg: Builder = new Builder(...await Promise.all([
			fs.promises.readFile(inputfilepath, 'utf8'),
			this.computeConfig(cwd),
		]));
		return Promise.all([
			xjs.String.dedent`
				Compiling………
				Source file: ${ inputfilepath }
				${ (this.command === Command.DEV) ? 'Intermediate text file (for debugging):' : 'Destination binary file:' } ${ outputfilepath }
			`.trimStart(),
			fs.promises.writeFile(outputfilepath, this.command === Command.DEV ? cg.print() : await cg.compile()),
		]);
	}

	/**
	 * Run the command `run`.
	 * @param cwd the current working directory, `process.cwd()`
	 */
	async run(cwd: string): Promise<[string, ...unknown[]]> {
		const inputfilepath: string          = this.inputPath(cwd);
		const bytes:         Promise<Buffer> = fs.promises.readFile(inputfilepath);
		return [
			xjs.String.dedent`
				Executing………
				Binary path: ${ inputfilepath }
			`.trimStart(),
			...(Object.values((await WebAssembly.instantiate(await bytes)).instance.exports) as Function[]).map((func) => func()),
		];
	}
}
