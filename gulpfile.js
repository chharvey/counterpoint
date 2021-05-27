const {
	Scanner,
	generate,
} = require('@chharvey/parser');
const xjs = require('extrajs');
const fs = require('fs');
const gulp = require('gulp');
const mocha = require('gulp-mocha');
const typescript = require('gulp-typescript');
const path = require('path');
// require('ts-node'); // DO NOT REMOVE … peerDependency of `gulp-mocha`
// require('typescript'); // DO NOT REMOVE … peerDependency of `gulp-typescript`

const tsconfig      = require('./tsconfig.json')
const typedocconfig = tsconfig.typedocOptions


function dist() {
	return gulp.src('./src/**/*.ts')
		.pipe(typescript(tsconfig.compilerOptions))
		.pipe(gulp.dest('./build/'))
}

async function postdist() {
	const grammar_solid = fs.promises.readFile(path.join(__dirname, './docs/spec/grammar/syntax.ebnf'), 'utf8');
	return fs.promises.writeFile(path.join(__dirname, './src/parser/Parser.auto.ts'), xjs.String.dedent`
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
}

function test() {
	return gulp.src('./test/**/*.ts')
		.pipe(mocha({
			require: 'ts-node/register',
		}))
}

async function test_dev() {
	const {Scanner} = require('@chharvey/parser');
	const {CONFIG_DEFAULT} = require('./build/core/');
	const {LexerSolid: Lexer, ParserSolid: Parser} = require('./build/parser/');
	const {Decorator} = require('./build/validator/');
	const {Builder} = require('./build/builder/');

	const input = fs.promises.readFile('./sample/test-v0.3.solid', 'utf8');

	console.log("\n\nHere are the characters returned by the scanner:")
	console.log("  line col  character")
	const scanner = new Scanner(await input).generate()
	let iterator_result_char = scanner.next()
	while (!iterator_result_char.done) {
		console.log(iterator_result_char.value.serialize())
		iterator_result_char = scanner.next()
	}

	console.log("\n\nHere are the tokens returned by the lexer:")
	const lexer = new Lexer(await input, CONFIG_DEFAULT).generate()
	let iterator_result_token = lexer.next()
	while (!iterator_result_token.done) {
		console.log(iterator_result_token.value.serialize())
		iterator_result_token = lexer.next()
	}

	const tree = new Parser  (await input, CONFIG_DEFAULT).parse();
	const code = new Builder (await input, CONFIG_DEFAULT).print();
	console.log("\n\nThe parse tree returned by the parser is written to file: `./sample/output.xml`")
	console.log("\n\nThe semantic tree returned by the decorator is written to file: `./sample/output-1.xml`")
	console.log("\n\nThe compiled output returned by the compiler is written to file: `./sample/output-2.wat`")

	return Promise.all([
		fs.promises.writeFile('./sample/output.xml', tree.serialize()),
		fs.promises.writeFile('./sample/output-1.xml', Decorator.decorate(tree).serialize()),
		fs.promises.writeFile('./sample/output-2.wat', code),
	])
}

const build = gulp.parallel(gulp.series(dist, postdist), test)

const dev = gulp.series(dist, test_dev)

async function random() {
	const {ParserSolid, Grammar} = require('./build/parser/')
	const sample = new Grammar().random().join(' ').replace(/\u0002|\u0003/g, '') // inserted by Scanner
	console.log(sample.replace(/\u000d/g, '\u240d'))
	const parser = new ParserSolid(sample)
	let tree;
	try {
		tree = parser.parse()
	} catch (err) {
		console.log(parser.viewStack())
		throw err
	}
	return Promise.all([
		fs.promises.writeFile('./sample/output.xml', tree.serialize()),
		fs.promises.writeFile('./sample/output-1.xml', tree.decorate().serialize()),
	])
}


module.exports = {
	build,
		dist,
		postdist,
		test,
	dev,
		test_dev,
	random,
}
