import PACKAGE from '../package.json' with {type: 'json'};
import {
	CLI,
	Command,
} from './CLI.class.ts';



(async (): Promise<void> => {
	const cli = new CLI(process.argv);
	switch (cli.command) {
		case Command.HELP: {
			console.log(CLI.HELPTEXT);
			if (cli.argv.config) {
				console.log(`\n${ CLI.CONFIGTEXT }`);
			}
			break;
		}
		case Command.VERSION: {
			console.log(`counterpoint version ${ PACKAGE.version }`);
			break;
		}
		case Command.COMPILE:
		case Command.DEV: {
			const result: [string, undefined] = await cli.compileOrDev(process.cwd());
			console.log(result[0]);
			console.log('Success!');
			break;
		}
		case Command.RUN: {
			const result: [string, ...unknown[]] = await cli.run(process.cwd());
			console.log(result[0]);
			console.log('Result:', result.slice(1));
			break;
		}
	}
})().catch((err) => {
	if (err instanceof AggregateError) {
		err.errors.forEach((er) => console.error(er));
	} else {
		console.error(err);
	}
	process.exit(1);
});
