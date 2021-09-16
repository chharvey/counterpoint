import {
	generate,
} from '@chharvey/parser';
import * as xjs from 'extrajs';
import * as fs from 'fs';
import * as path from 'path';

const DIRNAME = path.dirname(new URL(import.meta.url).pathname);
(async () => {
	const grammar_solid = fs.promises.readFile(path.join(DIRNAME, '../docs/spec/grammar/syntax.ebnf'), 'utf8');
	return fs.promises.writeFile(path.join(DIRNAME, '../src/parser/Parser.auto.ts'), xjs.String.dedent`
		/*----------------------------------------------------------------/
		| WARNING: Do not manually update this file!
		| It is auto-generated via <@chharvey/parser>.
		| If you need to make updates, make them there.
		/----------------------------------------------------------------*/
		import {
			SolidConfig,
			CONFIG_DEFAULT,
		} from '../core/index.js';
		${ generate(await grammar_solid, 'Solid')
			.replace(`import {LEXER} from './Lexer';`, `import {LexerSolid} from './Lexer.js';`)
			.replace(`import * as TERMINAL from './Terminal';`, `import * as TERMINAL from './Terminal.js';`)
			.replace(/export const PARSER: Parser<ParseNodeGoal> = new Parser<ParseNodeGoal>\((.*)\);/s, xjs.String.dedent`
				export class ParserSolid extends Parser<ParseNodeGoal> {
					constructor (config: SolidConfig = CONFIG_DEFAULT) {
						super($1);
					}
				}
			`)
			.replace(`LEXER,`, `new LexerSolid(config),`)
		}
	`);
})().catch((err) => {
	console.error(err);
	process.exit(1);
});
