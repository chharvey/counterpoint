import PACKAGE from '../package.json' with {type: 'json'};
import {
	CLI,
	Command,
} from './CLI.class.ts';



(async (): Promise<void> => {
	const cli = new CLI(process.argv);
	async function handleCompileOrDev(): Promise<void> {
		const result: [string, undefined] = await cli.compileOrDev(process.cwd());
		console.log(result[0]);
		console.log('Success!');
	}
	await new Map<Command, () => void | Promise<void>>([
		[Command.HELP, () => {
			console.log(CLI.HELPTEXT);
			if (cli.argv.config) {
				console.log(`\n${ CLI.CONFIGTEXT }`);
			}
		}],
		[Command.VERSION, () => {
			console.log(`counterpoint version ${ PACKAGE.version }`);
		}],
		[Command.COMPILE, handleCompileOrDev],
		[Command.DEV,     handleCompileOrDev],
		[Command.RUN,     async () => {
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
	}
	process.exit(1);
});
