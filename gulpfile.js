const fs = require('fs')
const util = require('util')

const gulp       = require('gulp')
const typescript = require('gulp-typescript')
// require('typescript') // DO NOT REMOVE … peerDependency of `gulp-typescript`

const tsconfig      = require('./tsconfig.json')
const typedocconfig = tsconfig.typedocOptions


function dist() {
	return gulp.src('./src/**/*.ts')
		.pipe(typescript(tsconfig.compilerOptions))
		.pipe(gulp.dest('./build/'))
}

async function test() {
	const { Scanner, Lexer, TokenType } = require('./')
	const input = util.promisify(fs.readFile)('./test/test-v0.1.solid', 'utf8')

	console.log("Here are the characters returned by the scanner:")
	console.log("  line col  character")
	const scanner = Scanner.generate(await input)
	let character = scanner.next()
	while (!character.done) {
		console.log(character.value.toString())
		character = scanner.next()
	}

	console.log("Here are the tokens returned by the lexer:")
	const lexer = Lexer.generate(await input)
	let token = lexer.next()
	while (!token.done) {
		console.log(token.value.show(true))
		token = lexer.next()
	}

	return Promise.resolve(null)
}

const build = gulp.series(dist, test)



module.exports = {
	build,
		dist,
		test,
}
