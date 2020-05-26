import * as fs from 'fs'
import * as path from 'path'

import minimist from 'minimist' // need `tsconfig.json#compilerOptions.esModuleInterop = true`

import {
	CodeGenerator,
} from '../'



const helptext: string = `
	Usage: solid <command> <filepath> [options]

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
`
const argv = minimist<{
	/** Display help text. */
	help: boolean;
	/** Display version number. */
	version: boolean;
	/** If compiling, specify output filepath. */
	out: string;
}>(process.argv.slice(2), {
	boolean: [
		'help',
		'version',
	],
	string: [
		'out',
	],
	alias: {
		h: 'help',
		v: 'version',
		o: 'out',
	}
})
const valid_args: boolean = (
	typeof argv.help  === 'boolean' &&
	typeof argv.version === 'boolean' &&
	(argv.out === void 0 || typeof argv.out === 'string' && argv.out !== '')
)
if (!valid_args) throw new Error(`
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
	(argv.help) ? Command.HELP :
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
if (command === Command.VERSION) {
	console.log(`solid version ${ require('../package.json').version }`)
	process.exit(0)
} else if (command === Command.HELP) {
	console.log(helptext)
	process.exit(0)
}

if (!argv._[1]) throw new Error(`
	No path specified!
	${ helptext }
`)
const inputpath: string = path.normalize(argv._[1])
const inputfilepath: string = path.join(process.cwd(), inputpath)

if (command === Command.COMPILE || command === Command.DEV) {
	const outputpath: string|null = argv.out ? path.normalize(argv.out) : null
	const outputfilepath: string = path.join(process.cwd(), outputpath || path.format({
		...path.parse(inputpath),
		base: void 0,
		ext: command === Command.DEV ? '.wat' : '.wasm',
	}))
	const sourcecode: Promise<string> = fs.promises.readFile(inputfilepath, 'utf8')

	console.log(`
		Compiling………
		Source file: ${ inputfilepath }
		${command === Command.DEV
			? `Intermediate text file (for debugging):`
			: `Destination binary file:`
		} ${ outputfilepath }
	`)

	;(async () => {
		const generator: CodeGenerator = new CodeGenerator(await sourcecode)
		await fs.promises.writeFile(outputfilepath, command === Command.DEV ? generator.print() : generator.compile())
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
