import * as fs from 'fs'
import * as path from 'path'

import minimist from 'minimist' // need `tsconfig.json#compilerOptions.esModuleInterop = true`

import * as solid from '../'
import type SolidConfig from './SolidConfig'
import type {PartialSolidConfig} from './SolidConfig'



type Mutable<T> = { // NB https://github.com/microsoft/TypeScript/issues/24509
	-readonly[P in keyof T]: Mutable<T[P]>
};



const helptext: string = `
	Usage: solid <command> <filepath> [<options>]

	Parse, analyze, and compile a Solid source code file.
	Executables are in WASM binary format. Plaintext outputs are in WAT format.
	See [WebAssembly](https://webassembly.org/) for details.

	Examples:
	\`\`\`
	# Compile \`test.solid\` to \`test.wasm\`:
	$ solid compile test.solid

	# Compile \`src/input.solid\` to \`build/output.wasm\`:
	$ solid compile src/input.solid --out build/output.wasm

	# Debug \`program.solid\` (writes to \`program.wat\`):
	$ solid dev program.solid

	# Execute \`program.wasm\`:
	$ solid run program.wasm
	\`\`\`

	Commands:
	help                     Print this help message.
	version                  Print the version of Solid currently installed.
	c, compile               Compile a Solid file into a \`*.wasm\` executable binary.
	d, dev                   Compile a Solid file into a \`*.wat\` text file for inspection.
	r, run                   Execute a compiled binary file. Ignore the \`--out\` option.

	Options:
	-h, --help               Print this help message.
	-v, --version            Print the version of Solid currently installed.
	-o, --out=file           Specify the output file.
	                         Otherwise, the default output filepath is the input filepath except
	                         with the extension changed to \`.wasm\` (compile) or \`.wat\` (dev).
	-p, --project=file       Specify a configuration file.
	--config                 Print all possible configuration options.
`
const configtext: string = `
	The following options set individual feature toggles and compiler options.
	These options will override those in the configuration file provided by \`--project\`.

	Feature Toggles:
	--[no-]comments               (on by default)
	--[no-]integerRadices         (on by default)
	--[no-]numericSeparators

	Compiler Options:
	--[no-]constantFolding        (on by default)
`



const argv = minimist<{
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

	// Feature Toggles
	comments          : null | boolean,
	integerRadices    : null | boolean,
	numericSeparators : null | boolean,

	// Compiler Options
	constantFolding : null | boolean,
}>(process.argv.slice(2), {
	boolean: [
		// CLI Options
		'help',
		'version',
		'config',
		// Feature Toggles
		'comments',
		'integerRadices',
		'numericSeparators',
		// Compiler Options
		'constantFolding',
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
		help    : false,
		version : false,
		config  : false,
		// Feature Toggles
		comments          : null,
		integerRadices    : null,
		numericSeparators : null,
		// Compiler Options
		constantFolding : null,
	},
	unknown(arg) {
		if (arg[0] === '-') { // only check unsupported options // NB https://github.com/substack/minimist/issues/86
			throw new Error(`
				Unknown CLI option: ${ arg }
				${ helptext }
			`)
		}
		return true
	},
})
if (!(
	(argv.out     === void 0 || typeof argv.out     === 'string' && argv.out     !== '') &&
	(argv.project === void 0 || typeof argv.project === 'string' && argv.project !== '')
)) throw new Error(`
	Invalid CLI arguments!
	${ helptext }
`)


enum Command {
	HELP,
	VERSION,
	COMPILE,
	DEV,
	RUN,
}
const command: Command =
	(argv.help || argv.config) ? Command.HELP :
	(argv.version) ? Command.VERSION :
	new Map<string, Command>([
		['help'    , Command.HELP],
		['version' , Command.VERSION],
		['compile' , Command.COMPILE],
		['c'       , Command.COMPILE],
		['dev'     , Command.DEV],
		['d'       , Command.DEV],
		['run'     , Command.RUN],
		['r'       , Command.RUN],
	]).get(argv._[0]) || Command.HELP
if (command === Command.HELP) {
	console.log(helptext)
	if (argv.config) {
		console.log(configtext)
	}
	process.exit(0)
} else if (command === Command.VERSION) {
	console.log(`solid version ${ require('../package.json').version }`)
	process.exit(0)
}



async function computeConfig(config: PartialSolidConfig | Promise<PartialSolidConfig>): Promise<SolidConfig> {
	const returned: Mutable<SolidConfig> = {
		...solid.CONFIG_DEFAULT,
		...await config,
		features: {
			...solid.CONFIG_DEFAULT.features,
			...(await config).features,
		},
		compilerOptions: {
			...solid.CONFIG_DEFAULT.compilerOptions,
			...(await config).compilerOptions,
		},
	}

	if (argv.comments          !== null) returned.features.comments          = argv.comments
	if (argv.integerRadices    !== null) returned.features.integerRadices    = argv.integerRadices
	if (argv.numericSeparators !== null) returned.features.numericSeparators = argv.numericSeparators

	if (argv.constantFolding !== null) returned.compilerOptions.constantFolding = argv.constantFolding

	return returned
}



if (!argv._[1]) throw new Error(`
	No path specified!
	${ helptext }
`)
const inputpath: string = path.normalize(argv._[1])
const inputfilepath: string = path.join(process.cwd(), inputpath)

if (command === Command.COMPILE || command === Command.DEV) {
	const sourcecode: Promise<string> = fs.promises.readFile(inputfilepath, 'utf8')

	const outputfilepath: string = path.join(process.cwd(), argv.out ? path.normalize(argv.out) : path.format({
		...path.parse(inputpath),
		base: void 0,
		ext: command === Command.DEV ? '.wat' : '.wasm',
	}))

	const config: SolidConfig | Promise<SolidConfig> = computeConfig(argv.project ?
		fs.promises.readFile(path.join(process.cwd(), path.normalize(argv.project)), 'utf8').then((text) => JSON.parse(text))
	: {})

	console.log(`
		Compiling………
		Source file: ${ inputfilepath }
		${command === Command.DEV
			? `Intermediate text file (for debugging):`
			: `Destination binary file:`
		} ${ outputfilepath }
	`)

	;(async () => {
		await fs.promises.writeFile(outputfilepath, command === Command.DEV
			? solid.print  (await sourcecode, await config)
			: solid.compile(await sourcecode, await config)
		)
		return console.log('Success!')
	})().catch((err) => {
		console.error(err)
		process.exit(1)
	})
} else {
	const bytes: Promise<Buffer> = fs.promises.readFile(inputfilepath)

	console.log(`
		Executing………
		Binary path: ${ inputfilepath }
	`)

	;(async () => {
		console.log(((await WebAssembly.instantiate(await bytes)).instance.exports.run as Function)())
	})().catch((err) => {
		console.error(err)
		process.exit(1)
	})
}
