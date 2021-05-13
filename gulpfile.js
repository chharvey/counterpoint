const {
	Scanner,
} = require('@chharvey/parser');
const fs = require('fs');
const gulp = require('gulp');



async function test_dev() {
	const {CONFIG_DEFAULT}         = require('./build/SolidConfig.js')
	const {Lexer, Screener} = require('./build/lexer/')
	const {ParserSolid: Parser} = require('./build/class/Parser.class.js');
	const {default: CodeGenerator} = require('./build/vm/Builder.class.js')

	const input = fs.promises.readFile('./sample/test-v0.2.solid', 'utf8')

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

	console.log("\n\nHere are the tokens returned by the screener:")
	const screener = new Screener(await input, CONFIG_DEFAULT).generate()
	let iterator_result_screen = screener.next()
	while (!iterator_result_screen.done) {
		if (iterator_result_screen.value !== null) console.log(iterator_result_screen.value.serialize())
		iterator_result_screen = screener.next()
	}

	const tree = new Parser(await input, CONFIG_DEFAULT).parse()
	const code = new CodeGenerator(await input, CONFIG_DEFAULT).print()
	console.log("\n\nThe parse tree returned by the parser is written to file: `./sample/output.xml`")
	console.log("\n\nThe semantic tree returned by the decorator is written to file: `./sample/output-1.xml`")
	console.log("\n\nThe compiled output returned by the compiler is written to file: `./sample/output-2.wat`")

	return Promise.all([
		fs.promises.writeFile('./sample/output.xml', tree.serialize()),
		fs.promises.writeFile('./sample/output-1.xml', tree.decorate().serialize()),
		fs.promises.writeFile('./sample/output-2.wat', code),
	])
}

const dev = test_dev

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
	dev,
		test_dev,
	random,
}
