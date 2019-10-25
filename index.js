const Lexer_module = require('./build/class/Lexer.class.js')

module.exports = {
	Scanner: require('./build/class/Scanner.class.js').default,
	Lexer    : Lexer_module.default,
	Token    : Lexer_module.Token,
	TokenType: Lexer_module.TokenType,
}
