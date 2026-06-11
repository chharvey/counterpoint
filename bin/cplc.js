#!/usr/bin/env node
import PACKAGE from '../package.json' with {type: 'json'};
import {
	Cli,
	Command,
} from '../dist/index.js';



(async () => {
	const cli = new Cli(process.argv);
	switch (cli.command) {
		case Command.HELP: {
			console.log(Cli.HELPTEXT);
			if (cli.argv.config) {
				console.log(`\n${ Cli.CONFIGTEXT }`);
			}
			break;
		}
		case Command.VERSION: {
			console.log(`counterpoint version ${ PACKAGE.version }`);
			break;
		}
		case Command.INTERPRET: {
			const result = await cli.interpret(process.cwd());
			console.log(result[0]);
			result[1]();
			console.log('Success!');
			break;
		}
		case Command.COMPILE:
		case Command.DEV: {
			const result = await cli.compileOrDev(process.cwd());
			console.log(result[0]);
			console.log('Success!');
			break;
		}
		case Command.RUN: {
			const result = await cli.run(process.cwd());
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
