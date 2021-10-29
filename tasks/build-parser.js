import {
	generate,
} from '@chharvey/parser';
import * as xjs from 'extrajs';
import * as fs from 'fs';
import * as path from 'path';

const DIRNAME = path.dirname(new URL(import.meta.url).pathname);
(async () => {
	const grammar_solid = fs.promises.readFile(path.join(DIRNAME, '../docs/spec/grammar/syntax.ebnf'), 'utf8');
	return fs.promises.writeFile(path.join(DIRNAME, '../src/parser/ParserSolid.ts'), xjs.String.dedent`
		/*----------------------------------------------------------------/
		| WARNING: Do not manually update this file!
		| It is auto-generated via <@chharvey/parser>.
		| If you need to make updates, make them there.
		/----------------------------------------------------------------*/
		import {
			NonemptyArray,
			SolidConfig,
			CONFIG_DEFAULT,
		} from './package.js';
		import {Production} from './Production.js';
		import {
			Grammar,
			GrammarSymbol,
		} from './Grammar.js';
		import type {Token} from './Token.js';
		import {ParseNode} from './ParseNode.js';
		import {Parser} from './Parser.js';
		${ generate(await grammar_solid, 'Solid')
			.replace(xjs.String.dedent`
				import {
					NonemptyArray,
					Token,
					ParseNode,
					Parser,
					Production,
					Grammar,
					GrammarSymbol,
				} from '@chharvey/parser';
			`, '')
			.replace(`import {LEXER} from './Lexer';`, `import {LexerSolid, LEXER} from './LexerSolid.js';`)
			.replace(`import * as TERMINAL from './Terminal';`, `import * as TERMINAL from './terminal/index.js';`)
			.replace(/export const PARSER: Parser<ParseNodeGoal> = new Parser<ParseNodeGoal>\((.*)\);/s, xjs.String.dedent`
				export class ParserSolid extends Parser<ParseNodeGoal> {
					constructor (config: SolidConfig = CONFIG_DEFAULT) {
						super($1);
					}
				}
				export const PARSER: ParserSolid = new ParserSolid();
			`)
			.replace(`LEXER,`, `(config === CONFIG_DEFAULT) ? LEXER : new LexerSolid(config),`)
		}
	`);
})().catch((err) => {
	console.error(err);
	process.exit(1);
});
