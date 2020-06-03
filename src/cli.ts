import Dev from './class/Dev.class'
import CLI, {
	Command,
} from './class/CLI.class'



;(async () => {
	const cli: CLI = new CLI(process.argv)
	if (cli.command === Command.HELP) {
		console.log(CLI.HELPTEXT)
		if (cli.argv.config) {
			console.log(CLI.CONFIGTEXT)
		}
	} else if (cli.command === Command.VERSION) {
		console.log(`solid version ${ Dev.VERSION }`)
	} else if (cli.command === Command.COMPILE || cli.command === Command.DEV) {
		const result: Promise<[string, void]> = cli.compileOrDev(process.cwd())
		console.log((await result)[0])
		console.log('Success!')
	} else if (cli.command === Command.RUN) {
		const result: Promise<[string, unknown]> = cli.run(process.cwd())
		console.log((await result)[0])
		console.log('Result:', (await result)[1])
	}
})().catch((err) => {
	console.error(err)
	process.exit(1)
})
