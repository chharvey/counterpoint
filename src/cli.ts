import {requireJSON} from '@chharvey/requirejson';
import * as path from 'path';
import {
	CLI,
	Command,
} from './CLI.class.js';

const DIRNAME = path.dirname(new URL(import.meta.url).pathname);


/** The current version of this project (as defined in `package.json`). */
const VERSION: Promise<string> = requireJSON(path.join(DIRNAME, '../package.json')).then((pkg: any) => pkg.version);


(async (): Promise<void> => {
	const cli = new CLI(process.argv);
	async function handleCompileOrDev(): Promise<void> {
		const result: [string, void] = await cli.compileOrDev(process.cwd());
		console.log(result[0]);
		console.log('Success!');
	}
	await new Map<Command, () => void | Promise<void>>([
		[Command.HELP, () => {
			console.log(CLI.HELPTEXT);
			if (cli.argv.config) {
				console.log('\n' + CLI.CONFIGTEXT);
			};
		}],
		[Command.VERSION, async () => {
			console.log(`counterpoint version ${ await VERSION }`);
		}],
		[Command.COMPILE, handleCompileOrDev],
		[Command.DEV,     handleCompileOrDev],
		[Command.RUN, async () => {
			const result: [string, ...unknown[]] = await cli.run(process.cwd());
			console.log(result[0]);
			console.log('Result:', result.slice(1));
		}],
	]).get(cli.command)!();
})().catch((err) => {
	if (err instanceof AggregateError) {
		err.errors.forEach((er) => console.error(er));
	} else {
		console.error(err);
	};
	process.exit(1);
});
