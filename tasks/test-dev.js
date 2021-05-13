const fs = require('fs');
const path = require('path');

(async () => {
	const {ParserSolid: Parser} = require('../build/parser/index.js');
	const {Builder} = require('../build/builder/index.js');
	const {Decorator} = require('../build/validator/index.js');

	const input = fs.promises.readFile(path.join(__dirname, '../sample/test-v0.3.solid'), 'utf8');
	const tree = new Parser(await input).parse();
	const code = new Builder(await input).print();
	console.log('\nThe parse tree returned by the parser is written to file: `./sample/output.xml`');
	console.log('\nThe semantic tree returned by the decorator is written to file: `./sample/output-1.xml`');
	console.log('\nThe compiled output returned by the compiler is written to file: `./sample/output-2.wat`');

	return Promise.all([
		fs.promises.writeFile(path.join(__dirname, '../sample/output.xml'), tree.serialize()),
		fs.promises.writeFile(path.join(__dirname, '../sample/output-1.xml'), Decorator.decorate(tree).serialize()),
		fs.promises.writeFile(path.join(__dirname, '../sample/output-2.wat'), code),
	]);
})().catch((err) => {
	console.error(err);
	process.exit(1);
});
