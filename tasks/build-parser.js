#!/usr/bin/env node

import * as xjs from 'extrajs';
import * as fs from 'fs';
import * as path from 'path';
import {
	ParseNode,
	PARSER_EBNF,
	DECORATOR_EBNF,
} from '../build/index.js';
import {Production} from '../build/parser/Production.js';
import {Grammar} from '../build/parser/Grammar.js';
import {Parser} from '../build/parser/Parser.js';

function generate(ebnf) {
	const jsons       = DECORATOR_EBNF.decorate(PARSER_EBNF.parse(ebnf)).transform();
	const nonabstract = jsons.filter((j) => j.family !== true);
	return [
		nonabstract.map((j) => Production.fromJSON(j)).join(''),
		jsons      .map((j) => ParseNode .fromJSON(j)).join(''),
		Grammar.fromJSON(nonabstract),
		Parser .fromJSON(nonabstract),
	].join('\n');
}

const DIRNAME = path.dirname(new URL(import.meta.url).pathname);
const preamble = xjs.String.dedent`
	/*----------------------------------------------------------------/
	| WARNING: Do not manually update this file!
	| It is auto-generated via \`/tasks/build-parser.js\`.
	| If you need to make updates, make them there.
	/----------------------------------------------------------------*/
`;
await Promise.all([
	(async () => fs.promises.writeFile(path.join(DIRNAME, '../src/parser/ParserEbnf.ts'), xjs.String.dedent`
		${ preamble }
		import type {
			NonemptyArray,
		} from './package.js';
		import type {
			GrammarSymbol,
		} from './utils-private.js';
		import * as TERMINAL from './terminal-ebnf/index.js';
		import {Production} from './Production.js';
		import {Grammar} from './Grammar.js';
		import type {Token} from './Token.js';
		import {ParseNode} from './ParseNode.js';
		import {LEXER} from './LexerEbnf.js';
		import {Parser} from './Parser.js';
		${ generate(await fs.promises.readFile(path.join(DIRNAME, '../docs/spec/grammar-ebnf/syntax.ebnf'), 'utf8')) }
	`))(),
	(async () => fs.promises.writeFile(path.join(DIRNAME, '../src/parser/ParserSolid.ts'), xjs.String.dedent`
		${ preamble }
		import {
			NonemptyArray,
			SolidConfig,
			CONFIG_DEFAULT,
		} from './package.js';
		import type {
			GrammarSymbol,
		} from './utils-private.js';
		import * as TERMINAL from './terminal-solid/index.js';
		import {Production} from './Production.js';
		import {Grammar} from './Grammar.js';
		import type {Token} from './Token.js';
		import {ParseNode} from './ParseNode.js';
		import {LexerSolid, LEXER} from './LexerSolid.js';
		import {Parser} from './Parser.js';
		${ generate(await fs.promises.readFile(path.join(DIRNAME, '../docs/spec/grammar-solid/syntax.ebnf'), 'utf8'))
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
	`))(),
]);
