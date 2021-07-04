import {requireJSON} from '@chharvey/requirejson';
import * as path from 'path';
import {
	CLI,
	Command,
} from './CLI.class.js';

const DIRNAME = path.dirname(new URL(import.meta.url).pathname);


/** The current version of this project (as defined in `package.json`). */
const VERSION: Promise<string> = requireJSON(path.join(DIRNAME, '../package.json')).then((pkg: any) => pkg.version);


;(async () => {
	const cli: CLI = new CLI(process.argv)
	if (cli.command === Command.HELP) {
		console.log(CLI.HELPTEXT)
		if (cli.argv.config) {
			console.log('\n' + CLI.CONFIGTEXT)
		}
	} else if (cli.command === Command.VERSION) {
		console.log(`solid version ${ await VERSION }`);
	} else if (cli.command === Command.COMPILE || cli.command === Command.DEV) {
		const result: [string, void] = await cli.compileOrDev(process.cwd())
		console.log(result[0])
		console.log('Success!')
	} else if (cli.command === Command.RUN) {
		const result: [string, ...unknown[]] = await cli.run(process.cwd())
		console.log(result[0])
		console.log('Result:', result.slice(1))
	}
})().catch((err) => {
	console.error(err)
	process.exit(1)
})
