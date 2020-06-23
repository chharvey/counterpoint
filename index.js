const {default: CodeGenerator} = require('./build/class/CodeGenerator.class.js')

module.exports.print = (sourcecode) =>
	new CodeGenerator(sourcecode).print()

module.exports.compile = (sourcecode) =>
	new CodeGenerator(sourcecode).compile()
