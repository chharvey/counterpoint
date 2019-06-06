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
	const { Scanner } = require('./')

	const input = util.promisify(fs.readFile)('./sample/sample-input.solid', 'utf8')
	console.log("Here are the characters returned by the scanner:")
	console.log("  line col  character")
	const scanner = new Scanner(await input)

	let character = scanner.next()
	while (character.cargo !== '\u0003') {
		console.log(character.toString())
		character = scanner.next()
	}

	return Promise.resolve(null)
}

const build = gulp.series(dist, test)



module.exports = {
	build,
		dist,
		test,
}
