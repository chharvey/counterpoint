const Lexer_module = require('./build/class/Lexer.class.js')

module.exports = {
	Scanner: require('./build/class/Scanner.class.js').default,
	Lexer    : Lexer_module.default,
	TokenType: Lexer_module.TokenType,
}
