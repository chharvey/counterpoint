const {default: CodeGenerator} = require('./build/vm/Builder.class.js')

module.exports.print   = (sourcecode, config = module.exports.CONFIG_DEFAULT) => new CodeGenerator(sourcecode, config).print()
module.exports.compile = (sourcecode, config = module.exports.CONFIG_DEFAULT) => new CodeGenerator(sourcecode, config).compile()
