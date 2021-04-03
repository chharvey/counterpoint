import {
	CLI,
	Command,
} from './CLI.class';


/** The current version of this project (as defined in `package.json`). */
const VERSION: string = require('../package.json').version;


(async () => {
	async function handleCompileOrDev() {
		const result: [string, void] = await cli.compileOrDev(process.cwd());
		console.log(result[0]);
		console.log('Success!');
	}
	const cli: CLI = new CLI(process.argv);
	await new Map<Command, () => void | Promise<void>>([
		[Command.HELP, () => {
			console.log(CLI.HELPTEXT);
			if (cli.argv.config) {
				console.log('\n' + CLI.CONFIGTEXT);
			};
		}],
		[Command.VERSION, () => {
			console.log(`solid version ${ VERSION }`);
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
