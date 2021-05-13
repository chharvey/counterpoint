const {
	generate,
} = require('@chharvey/parser');
const xjs = require('extrajs');
const fs = require('fs');
const path = require('path');

(async () => {
	const grammar_solid = fs.promises.readFile(path.join(__dirname, '../docs/spec/grammar/syntax.ebnf'), 'utf8');
	return fs.promises.writeFile(path.join(__dirname, '../src/parser/Parser.auto.ts'), xjs.String.dedent`
		/*----------------------------------------------------------------/
		| WARNING: Do not manually update this file!
		| It is auto-generated via <@chharvey/parser>.
		| If you need to make updates, make them there.
		/----------------------------------------------------------------*/
		import {
			SolidConfig,
			CONFIG_DEFAULT,
		} from '../core/';
		${ generate(await grammar_solid, 'Solid')
			.replace(`constructor (source: string)`, `constructor (source: string, config: SolidConfig = CONFIG_DEFAULT)`)
			.replace(`new LexerSolid(source)`, `new LexerSolid(source, config)`) }
	`);
})().catch((err) => {
	console.error(err);
	process.exit(1);
});
