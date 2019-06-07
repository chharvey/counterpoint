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
	const input = util.promisify(fs.readFile)('./sample/sample-input.solid', 'utf8')

	console.log("Here are the characters returned by the scanner:")
	console.log("  line col  character")
	let gen = Scanner.generator(await input)
	let character = gen.next()
	while (!character.done) {
		console.log(character.value[0].toString());
		character = gen.next();
	}

	console.log("Here are the tokens returned by the lexer:")
	const lexer = new Lexer(await input)
	let token = lexer.get()
	while (token.type !== TokenType.EOF) {
		console.log(token.show(true))
		token = lexer.get()
	}

	return Promise.resolve(null)
}

const build = gulp.series(dist, test)



module.exports = {
	build,
		dist,
		test,
}
