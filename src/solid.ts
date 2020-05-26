import * as fs from 'fs'
import * as path from 'path'

import minimist from 'minimist' // need `tsconfig.json#compilerOptions.esModuleInterop = true`

import {
	CodeGenerator,
} from '../'



const helptext: string = `
	Usage: solid [options] filepath

	Parse, analyze, and compile a Solid source code file into an executable binary.
	Or if the \`--run\` option is provided, run the executable.
	Executables are in WASM format. See [WebAssembly](https://webassembly.org/) for details.

	Examples:
	\`\`\`
	# Compile \`test.solid\` to \`test.wasm\`:
	$ solid test.solid

	# Compile \`src/input.solid\` to \`build/output.wasm\`:
	$ solid src/input.solid -o build/output.wasm

	# Execute \`program.wasm\`:
	$ solid -r program.wasm
	\`\`\`

	Options:
	-h, --help               Print this help message.
	-v, --version            Print the version of Solid currently installed.
	-o, --output=file        Specify the output file.
	                         Otherwise, the default output filepath is the input filepath except
	                         with the extension changed to \`.wasm\` (or \`.wat\` if \`-d\` is given).
	-d, --debug              Save compilation as \`*.wat\` source code for inspection,
	                         instead of \`*.wasm\` binary.
	                         If \`-o\` is given, save to that filepath.
	-r, --run                Execute the input binary file. Ignore all other options.
`
const argv = minimist<{
	/** Display help text. */
	help: boolean;
	/** Display version number. */
	version: boolean;
	/** If compiling, specify output filepath. */
	output: string;
	/** Save intermediate representation (*.wat) output file for inspecting. */
	debug: boolean;
	/** Run (execute) an already-compiled binary file. */
	run: boolean;
}>(process.argv.slice(2), {
	boolean: [
		'help',
		'version',
		'debug',
		'run',
	],
	string: [
		'output',
	],
	alias: {
		h: 'help',
		v: 'version',
		o: 'output',
		d: 'debug',
		r: 'run',
	}
})
const valid_args: boolean = (
	typeof argv.help  === 'boolean' &&
	typeof argv.version === 'boolean' &&
	typeof argv.debug === 'boolean' &&
	typeof argv.run   === 'boolean' &&
	(argv.output === void 0 || typeof argv.output === 'string' && argv.output !== '')
)
if (!valid_args) throw new Error(`
	Invalid CLI arguments!
	${ helptext }
`)
if (argv.version) {
	console.log(`solid version ${ require('../package.json').version }`)
	process.exit(0)
} else if (argv.help || !argv._[0]) {
	console.log(helptext)
	process.exit(0)
}


const inputpath: string = path.normalize(argv._[0])
const outputpath: string|null = argv.output ? path.normalize(argv.output) : null

const inputfilepath: string = path.join(process.cwd(), inputpath)
const outputfilepath: string = path.join(process.cwd(), outputpath || path.format({
	...path.parse(inputpath),
	base: void 0,
	ext: argv.debug ? '.wat' : '.wasm',
}))


if (!argv.run) {
	const sourcecode: Promise<string> = fs.promises.readFile(inputfilepath, 'utf8')

	console.log(`
		Compiling………
		Source file: ${ inputfilepath }
		${argv.debug
			? `Intermediate text file (for debugging):`
			: `Destination binary file:`
		} ${ outputfilepath }
	`)

	;(async () => {
		const generator: CodeGenerator = new CodeGenerator(await sourcecode)
		await fs.promises.writeFile(outputfilepath, argv.debug ? generator.print() : generator.compile())
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
