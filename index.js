const {default: CodeGenerator} = require('./build/class/CodeGenerator.class.js')

module.exports.print   = (sourcecode, config = module.exports.CONFIG_DEFAULT) => new CodeGenerator(sourcecode, config).print()
module.exports.compile = (sourcecode, config = module.exports.CONFIG_DEFAULT) => new CodeGenerator(sourcecode, config).compile()
