

/*----------------------------------------------------------------/
| WARNING: Do not manually update this file!
| It is auto-generated via `/tasks/build-parser.js`.
| If you need to make updates, make them there.
/----------------------------------------------------------------*/

import {
	NonemptyArray,
	SolidConfig,
	CONFIG_DEFAULT,
} from './package.js';
import type {
	GrammarSymbol,
} from './utils-private.js';
import * as TERMINAL from './terminal-solid/index.js';
import {Production} from './Production.js';
import {Grammar} from './Grammar.js';
import type {Token} from './Token.js';
import {ParseNode} from './ParseNode.js';
import {LexerSolid, LEXER} from './LexerSolid.js';
import {Parser} from './Parser.js';

class ProductionWord extends Production {
	static readonly instance: ProductionWord = new ProductionWord();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[TERMINAL.TerminalKeyword.instance],
			[TERMINAL.TerminalIdentifier.instance],
		];
	}
}

class ProductionPrimitiveLiteral extends Production {
	static readonly instance: ProductionPrimitiveLiteral = new ProductionPrimitiveLiteral();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['null'],
			['false'],
			['true'],
			[TERMINAL.TerminalInteger.instance],
			[TERMINAL.TerminalFloat.instance],
			[TERMINAL.TerminalString.instance],
		];
	}
}

class ProductionTypeKeyword extends Production {
	static readonly instance: ProductionTypeKeyword = new ProductionTypeKeyword();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['void'],
			['bool'],
			['int'],
			['float'],
			['str'],
			['obj'],
		];
	}
}

class ProductionEntryType extends Production {
	static readonly instance: ProductionEntryType = new ProductionEntryType();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionType.instance],
		];
	}
}

class ProductionEntryType_Optional extends Production {
	static readonly instance: ProductionEntryType_Optional = new ProductionEntryType_Optional();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['?:', ProductionType.instance],
		];
	}
}

class ProductionEntryType_Named extends Production {
	static readonly instance: ProductionEntryType_Named = new ProductionEntryType_Named();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionWord.instance, ':', ProductionType.instance],
		];
	}
}

class ProductionEntryType_Named_Optional extends Production {
	static readonly instance: ProductionEntryType_Named_Optional = new ProductionEntryType_Named_Optional();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionWord.instance, '?:', ProductionType.instance],
		];
	}
}

class ProductionItemsType__0__List extends Production {
	static readonly instance: ProductionItemsType__0__List = new ProductionItemsType__0__List();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionEntryType.instance],
			[ProductionItemsType__0__List.instance, ',', ProductionEntryType.instance],
		];
	}
}

class ProductionItemsType__1__List extends Production {
	static readonly instance: ProductionItemsType__1__List = new ProductionItemsType__1__List();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionEntryType_Optional.instance],
			[ProductionItemsType__1__List.instance, ',', ProductionEntryType_Optional.instance],
		];
	}
}

class ProductionItemsType extends Production {
	static readonly instance: ProductionItemsType = new ProductionItemsType();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionItemsType__0__List.instance],
			[ProductionItemsType__0__List.instance, ','],
			[ProductionItemsType__1__List.instance],
			[ProductionItemsType__1__List.instance, ','],
			[ProductionItemsType__0__List.instance, ',', ProductionItemsType__1__List.instance],
			[ProductionItemsType__0__List.instance, ',', ProductionItemsType__1__List.instance, ','],
		];
	}
}

class ProductionPropertiesType__0__List extends Production {
	static readonly instance: ProductionPropertiesType__0__List = new ProductionPropertiesType__0__List();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionEntryType_Named.instance],
			[ProductionPropertiesType__0__List.instance, ',', ProductionEntryType_Named.instance],
			[ProductionEntryType_Named_Optional.instance],
			[ProductionPropertiesType__0__List.instance, ',', ProductionEntryType_Named_Optional.instance],
		];
	}
}

class ProductionPropertiesType extends Production {
	static readonly instance: ProductionPropertiesType = new ProductionPropertiesType();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionPropertiesType__0__List.instance],
			[ProductionPropertiesType__0__List.instance, ','],
		];
	}
}

class ProductionTypeTupleLiteral extends Production {
	static readonly instance: ProductionTypeTupleLiteral = new ProductionTypeTupleLiteral();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['[', ']'],
			['[', ProductionItemsType.instance, ']'],
			['[', ',', ProductionItemsType.instance, ']'],
		];
	}
}

class ProductionTypeRecordLiteral extends Production {
	static readonly instance: ProductionTypeRecordLiteral = new ProductionTypeRecordLiteral();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['[', ProductionPropertiesType.instance, ']'],
			['[', ',', ProductionPropertiesType.instance, ']'],
		];
	}
}

class ProductionTypeHashLiteral extends Production {
	static readonly instance: ProductionTypeHashLiteral = new ProductionTypeHashLiteral();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['[', ':', ProductionType.instance, ']'],
		];
	}
}

class ProductionTypeMapLiteral extends Production {
	static readonly instance: ProductionTypeMapLiteral = new ProductionTypeMapLiteral();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['{', ProductionType.instance, '->', ProductionType.instance, '}'],
		];
	}
}

class ProductionGenericArguments__0__List extends Production {
	static readonly instance: ProductionGenericArguments__0__List = new ProductionGenericArguments__0__List();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionType.instance],
			[ProductionGenericArguments__0__List.instance, ',', ProductionType.instance],
		];
	}
}

class ProductionGenericArguments extends Production {
	static readonly instance: ProductionGenericArguments = new ProductionGenericArguments();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['<', ProductionGenericArguments__0__List.instance, '>'],
			['<', ProductionGenericArguments__0__List.instance, ',', '>'],
			['<', ',', ProductionGenericArguments__0__List.instance, '>'],
			['<', ',', ProductionGenericArguments__0__List.instance, ',', '>'],
		];
	}
}

class ProductionTypeUnit extends Production {
	static readonly instance: ProductionTypeUnit = new ProductionTypeUnit();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[TERMINAL.TerminalIdentifier.instance],
			[ProductionPrimitiveLiteral.instance],
			[ProductionTypeKeyword.instance],
			[ProductionTypeTupleLiteral.instance],
			[ProductionTypeRecordLiteral.instance],
			[ProductionTypeHashLiteral.instance],
			[ProductionTypeMapLiteral.instance],
			['(', ProductionType.instance, ')'],
		];
	}
}

class ProductionPropertyAccessType extends Production {
	static readonly instance: ProductionPropertyAccessType = new ProductionPropertyAccessType();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['.', TERMINAL.TerminalInteger.instance],
			['.', ProductionWord.instance],
		];
	}
}

class ProductionGenericCall extends Production {
	static readonly instance: ProductionGenericCall = new ProductionGenericCall();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['.', ProductionGenericArguments.instance],
		];
	}
}

class ProductionTypeCompound extends Production {
	static readonly instance: ProductionTypeCompound = new ProductionTypeCompound();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionTypeUnit.instance],
			[ProductionTypeCompound.instance, ProductionPropertyAccessType.instance],
			[ProductionTypeCompound.instance, ProductionGenericCall.instance],
		];
	}
}

class ProductionTypeUnarySymbol extends Production {
	static readonly instance: ProductionTypeUnarySymbol = new ProductionTypeUnarySymbol();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionTypeCompound.instance],
			[ProductionTypeUnarySymbol.instance, '?'],
			[ProductionTypeUnarySymbol.instance, '!'],
			[ProductionTypeUnarySymbol.instance, '[', ']'],
			[ProductionTypeUnarySymbol.instance, '[', TERMINAL.TerminalInteger.instance, ']'],
			[ProductionTypeUnarySymbol.instance, '{', '}'],
		];
	}
}

class ProductionTypeUnaryKeyword extends Production {
	static readonly instance: ProductionTypeUnaryKeyword = new ProductionTypeUnaryKeyword();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionTypeUnarySymbol.instance],
			['mutable', ProductionTypeUnaryKeyword.instance],
		];
	}
}

class ProductionTypeIntersection extends Production {
	static readonly instance: ProductionTypeIntersection = new ProductionTypeIntersection();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionTypeUnaryKeyword.instance],
			[ProductionTypeIntersection.instance, '&', ProductionTypeUnaryKeyword.instance],
		];
	}
}

class ProductionTypeUnion extends Production {
	static readonly instance: ProductionTypeUnion = new ProductionTypeUnion();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionTypeIntersection.instance],
			[ProductionTypeUnion.instance, '|', ProductionTypeIntersection.instance],
		];
	}
}

class ProductionType extends Production {
	static readonly instance: ProductionType = new ProductionType();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionTypeUnion.instance],
		];
	}
}

class ProductionStringTemplate__0__List extends Production {
	static readonly instance: ProductionStringTemplate__0__List = new ProductionStringTemplate__0__List();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[TERMINAL.TerminalTemplateMiddle.instance],
			[ProductionStringTemplate__0__List.instance, TERMINAL.TerminalTemplateMiddle.instance],
			[TERMINAL.TerminalTemplateMiddle.instance, ProductionExpression.instance],
			[ProductionStringTemplate__0__List.instance, TERMINAL.TerminalTemplateMiddle.instance, ProductionExpression.instance],
		];
	}
}

class ProductionStringTemplate_Dynamic__0__List extends Production {
	static readonly instance: ProductionStringTemplate_Dynamic__0__List = new ProductionStringTemplate_Dynamic__0__List();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[TERMINAL.TerminalTemplateMiddle.instance],
			[ProductionStringTemplate_Dynamic__0__List.instance, TERMINAL.TerminalTemplateMiddle.instance],
			[TERMINAL.TerminalTemplateMiddle.instance, ProductionExpression_Dynamic.instance],
			[ProductionStringTemplate_Dynamic__0__List.instance, TERMINAL.TerminalTemplateMiddle.instance, ProductionExpression_Dynamic.instance],
		];
	}
}

class ProductionStringTemplate extends Production {
	static readonly instance: ProductionStringTemplate = new ProductionStringTemplate();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[TERMINAL.TerminalTemplateFull.instance],
			[TERMINAL.TerminalTemplateHead.instance, TERMINAL.TerminalTemplateTail.instance],
			[TERMINAL.TerminalTemplateHead.instance, ProductionStringTemplate__0__List.instance, TERMINAL.TerminalTemplateTail.instance],
			[TERMINAL.TerminalTemplateHead.instance, ProductionExpression.instance, TERMINAL.TerminalTemplateTail.instance],
			[TERMINAL.TerminalTemplateHead.instance, ProductionExpression.instance, ProductionStringTemplate__0__List.instance, TERMINAL.TerminalTemplateTail.instance],
		];
	}
}

class ProductionStringTemplate_Dynamic extends Production {
	static readonly instance: ProductionStringTemplate_Dynamic = new ProductionStringTemplate_Dynamic();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[TERMINAL.TerminalTemplateFull.instance],
			[TERMINAL.TerminalTemplateHead.instance, TERMINAL.TerminalTemplateTail.instance],
			[TERMINAL.TerminalTemplateHead.instance, ProductionStringTemplate_Dynamic__0__List.instance, TERMINAL.TerminalTemplateTail.instance],
			[TERMINAL.TerminalTemplateHead.instance, ProductionExpression_Dynamic.instance, TERMINAL.TerminalTemplateTail.instance],
			[TERMINAL.TerminalTemplateHead.instance, ProductionExpression_Dynamic.instance, ProductionStringTemplate_Dynamic__0__List.instance, TERMINAL.TerminalTemplateTail.instance],
		];
	}
}

class ProductionProperty extends Production {
	static readonly instance: ProductionProperty = new ProductionProperty();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionWord.instance, '=', ProductionExpression_Dynamic.instance],
		];
	}
}

class ProductionCase extends Production {
	static readonly instance: ProductionCase = new ProductionCase();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpression_Dynamic.instance, '->', ProductionExpression_Dynamic.instance],
		];
	}
}

class ProductionTupleLiteral__0__List extends Production {
	static readonly instance: ProductionTupleLiteral__0__List = new ProductionTupleLiteral__0__List();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpression_Dynamic.instance],
			[ProductionTupleLiteral__0__List.instance, ',', ProductionExpression_Dynamic.instance],
		];
	}
}

class ProductionTupleLiteral extends Production {
	static readonly instance: ProductionTupleLiteral = new ProductionTupleLiteral();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['[', ']'],
			['[', ProductionTupleLiteral__0__List.instance, ']'],
			['[', ProductionTupleLiteral__0__List.instance, ',', ']'],
			['[', ',', ProductionTupleLiteral__0__List.instance, ']'],
			['[', ',', ProductionTupleLiteral__0__List.instance, ',', ']'],
		];
	}
}

class ProductionRecordLiteral__0__List extends Production {
	static readonly instance: ProductionRecordLiteral__0__List = new ProductionRecordLiteral__0__List();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionProperty.instance],
			[ProductionRecordLiteral__0__List.instance, ',', ProductionProperty.instance],
		];
	}
}

class ProductionRecordLiteral extends Production {
	static readonly instance: ProductionRecordLiteral = new ProductionRecordLiteral();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['[', ProductionRecordLiteral__0__List.instance, ']'],
			['[', ProductionRecordLiteral__0__List.instance, ',', ']'],
			['[', ',', ProductionRecordLiteral__0__List.instance, ']'],
			['[', ',', ProductionRecordLiteral__0__List.instance, ',', ']'],
		];
	}
}

class ProductionSetLiteral extends Production {
	static readonly instance: ProductionSetLiteral = new ProductionSetLiteral();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['{', '}'],
			['{', ProductionTupleLiteral__0__List.instance, '}'],
			['{', ProductionTupleLiteral__0__List.instance, ',', '}'],
			['{', ',', ProductionTupleLiteral__0__List.instance, '}'],
			['{', ',', ProductionTupleLiteral__0__List.instance, ',', '}'],
		];
	}
}

class ProductionMapLiteral__0__List extends Production {
	static readonly instance: ProductionMapLiteral__0__List = new ProductionMapLiteral__0__List();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionCase.instance],
			[ProductionMapLiteral__0__List.instance, ',', ProductionCase.instance],
		];
	}
}

class ProductionMapLiteral extends Production {
	static readonly instance: ProductionMapLiteral = new ProductionMapLiteral();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['{', ProductionMapLiteral__0__List.instance, '}'],
			['{', ProductionMapLiteral__0__List.instance, ',', '}'],
			['{', ',', ProductionMapLiteral__0__List.instance, '}'],
			['{', ',', ProductionMapLiteral__0__List.instance, ',', '}'],
		];
	}
}

class ProductionFunctionArguments extends Production {
	static readonly instance: ProductionFunctionArguments = new ProductionFunctionArguments();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['(', ')'],
			['(', ProductionTupleLiteral__0__List.instance, ')'],
			['(', ProductionTupleLiteral__0__List.instance, ',', ')'],
			['(', ',', ProductionTupleLiteral__0__List.instance, ')'],
			['(', ',', ProductionTupleLiteral__0__List.instance, ',', ')'],
		];
	}
}

class ProductionExpressionUnit extends Production {
	static readonly instance: ProductionExpressionUnit = new ProductionExpressionUnit();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionPrimitiveLiteral.instance],
			[ProductionStringTemplate.instance],
			[ProductionTupleLiteral.instance],
			[ProductionRecordLiteral.instance],
			[ProductionSetLiteral.instance],
			[ProductionMapLiteral.instance],
			['(', ProductionExpression.instance, ')'],
		];
	}
}

class ProductionExpressionUnit_Dynamic extends Production {
	static readonly instance: ProductionExpressionUnit_Dynamic = new ProductionExpressionUnit_Dynamic();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[TERMINAL.TerminalIdentifier.instance],
			[ProductionPrimitiveLiteral.instance],
			[ProductionStringTemplate_Dynamic.instance],
			[ProductionTupleLiteral.instance],
			[ProductionRecordLiteral.instance],
			[ProductionSetLiteral.instance],
			[ProductionMapLiteral.instance],
			['(', ProductionExpression_Dynamic.instance, ')'],
		];
	}
}

class ProductionPropertyAccess extends Production {
	static readonly instance: ProductionPropertyAccess = new ProductionPropertyAccess();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['.', TERMINAL.TerminalInteger.instance],
			['.', ProductionWord.instance],
			['.', '[', ProductionExpression_Dynamic.instance, ']'],
			['?.', TERMINAL.TerminalInteger.instance],
			['?.', ProductionWord.instance],
			['?.', '[', ProductionExpression_Dynamic.instance, ']'],
			['!.', TERMINAL.TerminalInteger.instance],
			['!.', ProductionWord.instance],
			['!.', '[', ProductionExpression_Dynamic.instance, ']'],
		];
	}
}

class ProductionPropertyAssign extends Production {
	static readonly instance: ProductionPropertyAssign = new ProductionPropertyAssign();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['.', TERMINAL.TerminalInteger.instance],
			['.', ProductionWord.instance],
			['.', '[', ProductionExpression_Dynamic.instance, ']'],
		];
	}
}

class ProductionFunctionCall extends Production {
	static readonly instance: ProductionFunctionCall = new ProductionFunctionCall();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['.', ProductionFunctionArguments.instance],
			['.', ProductionGenericArguments.instance, ProductionFunctionArguments.instance],
		];
	}
}

class ProductionExpressionCompound extends Production {
	static readonly instance: ProductionExpressionCompound = new ProductionExpressionCompound();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionUnit.instance],
		];
	}
}

class ProductionExpressionCompound_Dynamic extends Production {
	static readonly instance: ProductionExpressionCompound_Dynamic = new ProductionExpressionCompound_Dynamic();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionUnit_Dynamic.instance],
			[ProductionExpressionCompound_Dynamic.instance, ProductionPropertyAccess.instance],
			[ProductionExpressionCompound_Dynamic.instance, ProductionFunctionCall.instance],
		];
	}
}

class ProductionAssignee extends Production {
	static readonly instance: ProductionAssignee = new ProductionAssignee();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[TERMINAL.TerminalIdentifier.instance],
			[ProductionExpressionCompound_Dynamic.instance, ProductionPropertyAssign.instance],
		];
	}
}

class ProductionExpressionUnarySymbol extends Production {
	static readonly instance: ProductionExpressionUnarySymbol = new ProductionExpressionUnarySymbol();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionCompound.instance],
			['!', ProductionExpressionUnarySymbol.instance],
			['?', ProductionExpressionUnarySymbol.instance],
			['+', ProductionExpressionUnarySymbol.instance],
			['-', ProductionExpressionUnarySymbol.instance],
		];
	}
}

class ProductionExpressionUnarySymbol_Dynamic extends Production {
	static readonly instance: ProductionExpressionUnarySymbol_Dynamic = new ProductionExpressionUnarySymbol_Dynamic();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionCompound_Dynamic.instance],
			['!', ProductionExpressionUnarySymbol_Dynamic.instance],
			['?', ProductionExpressionUnarySymbol_Dynamic.instance],
			['+', ProductionExpressionUnarySymbol_Dynamic.instance],
			['-', ProductionExpressionUnarySymbol_Dynamic.instance],
		];
	}
}

class ProductionExpressionExponential extends Production {
	static readonly instance: ProductionExpressionExponential = new ProductionExpressionExponential();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionUnarySymbol.instance],
			[ProductionExpressionUnarySymbol.instance, '^', ProductionExpressionExponential.instance],
		];
	}
}

class ProductionExpressionExponential_Dynamic extends Production {
	static readonly instance: ProductionExpressionExponential_Dynamic = new ProductionExpressionExponential_Dynamic();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionUnarySymbol_Dynamic.instance],
			[ProductionExpressionUnarySymbol_Dynamic.instance, '^', ProductionExpressionExponential_Dynamic.instance],
		];
	}
}

class ProductionExpressionMultiplicative extends Production {
	static readonly instance: ProductionExpressionMultiplicative = new ProductionExpressionMultiplicative();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionExponential.instance],
			[ProductionExpressionMultiplicative.instance, '*', ProductionExpressionExponential.instance],
			[ProductionExpressionMultiplicative.instance, '/', ProductionExpressionExponential.instance],
		];
	}
}

class ProductionExpressionMultiplicative_Dynamic extends Production {
	static readonly instance: ProductionExpressionMultiplicative_Dynamic = new ProductionExpressionMultiplicative_Dynamic();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionExponential_Dynamic.instance],
			[ProductionExpressionMultiplicative_Dynamic.instance, '*', ProductionExpressionExponential_Dynamic.instance],
			[ProductionExpressionMultiplicative_Dynamic.instance, '/', ProductionExpressionExponential_Dynamic.instance],
		];
	}
}

class ProductionExpressionAdditive extends Production {
	static readonly instance: ProductionExpressionAdditive = new ProductionExpressionAdditive();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionMultiplicative.instance],
			[ProductionExpressionAdditive.instance, '+', ProductionExpressionMultiplicative.instance],
			[ProductionExpressionAdditive.instance, '-', ProductionExpressionMultiplicative.instance],
		];
	}
}

class ProductionExpressionAdditive_Dynamic extends Production {
	static readonly instance: ProductionExpressionAdditive_Dynamic = new ProductionExpressionAdditive_Dynamic();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionMultiplicative_Dynamic.instance],
			[ProductionExpressionAdditive_Dynamic.instance, '+', ProductionExpressionMultiplicative_Dynamic.instance],
			[ProductionExpressionAdditive_Dynamic.instance, '-', ProductionExpressionMultiplicative_Dynamic.instance],
		];
	}
}

class ProductionExpressionComparative extends Production {
	static readonly instance: ProductionExpressionComparative = new ProductionExpressionComparative();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionAdditive.instance],
			[ProductionExpressionComparative.instance, '<', ProductionExpressionAdditive.instance],
			[ProductionExpressionComparative.instance, '>', ProductionExpressionAdditive.instance],
			[ProductionExpressionComparative.instance, '<=', ProductionExpressionAdditive.instance],
			[ProductionExpressionComparative.instance, '>=', ProductionExpressionAdditive.instance],
			[ProductionExpressionComparative.instance, '!<', ProductionExpressionAdditive.instance],
			[ProductionExpressionComparative.instance, '!>', ProductionExpressionAdditive.instance],
			[ProductionExpressionComparative.instance, 'is', ProductionExpressionAdditive.instance],
			[ProductionExpressionComparative.instance, 'isnt', ProductionExpressionAdditive.instance],
		];
	}
}

class ProductionExpressionComparative_Dynamic extends Production {
	static readonly instance: ProductionExpressionComparative_Dynamic = new ProductionExpressionComparative_Dynamic();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionAdditive_Dynamic.instance],
			[ProductionExpressionComparative_Dynamic.instance, '<', ProductionExpressionAdditive_Dynamic.instance],
			[ProductionExpressionComparative_Dynamic.instance, '>', ProductionExpressionAdditive_Dynamic.instance],
			[ProductionExpressionComparative_Dynamic.instance, '<=', ProductionExpressionAdditive_Dynamic.instance],
			[ProductionExpressionComparative_Dynamic.instance, '>=', ProductionExpressionAdditive_Dynamic.instance],
			[ProductionExpressionComparative_Dynamic.instance, '!<', ProductionExpressionAdditive_Dynamic.instance],
			[ProductionExpressionComparative_Dynamic.instance, '!>', ProductionExpressionAdditive_Dynamic.instance],
			[ProductionExpressionComparative_Dynamic.instance, 'is', ProductionExpressionAdditive_Dynamic.instance],
			[ProductionExpressionComparative_Dynamic.instance, 'isnt', ProductionExpressionAdditive_Dynamic.instance],
		];
	}
}

class ProductionExpressionEquality extends Production {
	static readonly instance: ProductionExpressionEquality = new ProductionExpressionEquality();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionComparative.instance],
			[ProductionExpressionEquality.instance, '===', ProductionExpressionComparative.instance],
			[ProductionExpressionEquality.instance, '!==', ProductionExpressionComparative.instance],
			[ProductionExpressionEquality.instance, '==', ProductionExpressionComparative.instance],
			[ProductionExpressionEquality.instance, '!=', ProductionExpressionComparative.instance],
		];
	}
}

class ProductionExpressionEquality_Dynamic extends Production {
	static readonly instance: ProductionExpressionEquality_Dynamic = new ProductionExpressionEquality_Dynamic();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionComparative_Dynamic.instance],
			[ProductionExpressionEquality_Dynamic.instance, '===', ProductionExpressionComparative_Dynamic.instance],
			[ProductionExpressionEquality_Dynamic.instance, '!==', ProductionExpressionComparative_Dynamic.instance],
			[ProductionExpressionEquality_Dynamic.instance, '==', ProductionExpressionComparative_Dynamic.instance],
			[ProductionExpressionEquality_Dynamic.instance, '!=', ProductionExpressionComparative_Dynamic.instance],
		];
	}
}

class ProductionExpressionConjunctive extends Production {
	static readonly instance: ProductionExpressionConjunctive = new ProductionExpressionConjunctive();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionEquality.instance],
			[ProductionExpressionConjunctive.instance, '&&', ProductionExpressionEquality.instance],
			[ProductionExpressionConjunctive.instance, '!&', ProductionExpressionEquality.instance],
		];
	}
}

class ProductionExpressionConjunctive_Dynamic extends Production {
	static readonly instance: ProductionExpressionConjunctive_Dynamic = new ProductionExpressionConjunctive_Dynamic();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionEquality_Dynamic.instance],
			[ProductionExpressionConjunctive_Dynamic.instance, '&&', ProductionExpressionEquality_Dynamic.instance],
			[ProductionExpressionConjunctive_Dynamic.instance, '!&', ProductionExpressionEquality_Dynamic.instance],
		];
	}
}

class ProductionExpressionDisjunctive extends Production {
	static readonly instance: ProductionExpressionDisjunctive = new ProductionExpressionDisjunctive();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionConjunctive.instance],
			[ProductionExpressionDisjunctive.instance, '||', ProductionExpressionConjunctive.instance],
			[ProductionExpressionDisjunctive.instance, '!|', ProductionExpressionConjunctive.instance],
		];
	}
}

class ProductionExpressionDisjunctive_Dynamic extends Production {
	static readonly instance: ProductionExpressionDisjunctive_Dynamic = new ProductionExpressionDisjunctive_Dynamic();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionConjunctive_Dynamic.instance],
			[ProductionExpressionDisjunctive_Dynamic.instance, '||', ProductionExpressionConjunctive_Dynamic.instance],
			[ProductionExpressionDisjunctive_Dynamic.instance, '!|', ProductionExpressionConjunctive_Dynamic.instance],
		];
	}
}

class ProductionExpressionConditional extends Production {
	static readonly instance: ProductionExpressionConditional = new ProductionExpressionConditional();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['if', ProductionExpression.instance, 'then', ProductionExpression.instance, 'else', ProductionExpression.instance],
		];
	}
}

class ProductionExpressionConditional_Dynamic extends Production {
	static readonly instance: ProductionExpressionConditional_Dynamic = new ProductionExpressionConditional_Dynamic();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['if', ProductionExpression_Dynamic.instance, 'then', ProductionExpression_Dynamic.instance, 'else', ProductionExpression_Dynamic.instance],
		];
	}
}

class ProductionExpression extends Production {
	static readonly instance: ProductionExpression = new ProductionExpression();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionDisjunctive.instance],
			[ProductionExpressionConditional.instance],
		];
	}
}

class ProductionExpression_Dynamic extends Production {
	static readonly instance: ProductionExpression_Dynamic = new ProductionExpression_Dynamic();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionDisjunctive_Dynamic.instance],
			[ProductionExpressionConditional_Dynamic.instance],
		];
	}
}

class ProductionDeclarationType extends Production {
	static readonly instance: ProductionDeclarationType = new ProductionDeclarationType();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['type', TERMINAL.TerminalIdentifier.instance, '=', ProductionType.instance, ';'],
		];
	}
}

class ProductionDeclarationVariable extends Production {
	static readonly instance: ProductionDeclarationVariable = new ProductionDeclarationVariable();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['let', TERMINAL.TerminalIdentifier.instance, ':', ProductionType.instance, '=', ProductionExpression_Dynamic.instance, ';'],
			['let', 'unfixed', TERMINAL.TerminalIdentifier.instance, ':', ProductionType.instance, '=', ProductionExpression_Dynamic.instance, ';'],
		];
	}
}

class ProductionDeclaration extends Production {
	static readonly instance: ProductionDeclaration = new ProductionDeclaration();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionDeclarationType.instance],
			[ProductionDeclarationVariable.instance],
		];
	}
}

class ProductionStatementAssignment extends Production {
	static readonly instance: ProductionStatementAssignment = new ProductionStatementAssignment();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionAssignee.instance, '=', ProductionExpression_Dynamic.instance, ';'],
		];
	}
}

class ProductionStatement extends Production {
	static readonly instance: ProductionStatement = new ProductionStatement();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[';'],
			[ProductionExpression_Dynamic.instance, ';'],
			[ProductionDeclaration.instance],
			[ProductionStatementAssignment.instance],
		];
	}
}

class ProductionGoal__0__List extends Production {
	static readonly instance: ProductionGoal__0__List = new ProductionGoal__0__List();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionStatement.instance],
			[ProductionGoal__0__List.instance, ProductionStatement.instance],
		];
	}
}

class ProductionGoal extends Production {
	static readonly instance: ProductionGoal = new ProductionGoal();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['\u0002', '\u0003'],
			['\u0002', ProductionGoal__0__List.instance, '\u0003'],
		];
	}
}


export class ParseNodeWord extends ParseNode {
	declare readonly children:
		| readonly [Token]
		| readonly [Token]
	;
}

export class ParseNodePrimitiveLiteral extends ParseNode {
	declare readonly children:
		| readonly [Token]
		| readonly [Token]
		| readonly [Token]
		| readonly [Token]
		| readonly [Token]
		| readonly [Token]
	;
}

export class ParseNodeTypeKeyword extends ParseNode {
	declare readonly children:
		| readonly [Token]
		| readonly [Token]
		| readonly [Token]
		| readonly [Token]
		| readonly [Token]
		| readonly [Token]
	;
}

export abstract class ParseNodeEntryType$ extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeType]
		| readonly [Token, ParseNodeType]
		| readonly [ParseNodeWord, Token, ParseNodeType]
		| readonly [ParseNodeWord, Token, ParseNodeType]
	;
}

export class ParseNodeEntryType extends ParseNodeEntryType$ {
	declare readonly children:
		| readonly [ParseNodeType]
	;
}

export class ParseNodeEntryType_Optional extends ParseNodeEntryType$ {
	declare readonly children:
		| readonly [Token, ParseNodeType]
	;
}

export class ParseNodeEntryType_Named extends ParseNodeEntryType$ {
	declare readonly children:
		| readonly [ParseNodeWord, Token, ParseNodeType]
	;
}

export class ParseNodeEntryType_Named_Optional extends ParseNodeEntryType$ {
	declare readonly children:
		| readonly [ParseNodeWord, Token, ParseNodeType]
	;
}

export class ParseNodeItemsType__0__List extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeEntryType]
		| readonly [ParseNodeItemsType__0__List, Token, ParseNodeEntryType]
	;
}

export class ParseNodeItemsType__1__List extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeEntryType_Optional]
		| readonly [ParseNodeItemsType__1__List, Token, ParseNodeEntryType_Optional]
	;
}

export class ParseNodeItemsType extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeItemsType__0__List]
		| readonly [ParseNodeItemsType__0__List, Token]
		| readonly [ParseNodeItemsType__1__List]
		| readonly [ParseNodeItemsType__1__List, Token]
		| readonly [ParseNodeItemsType__0__List, Token, ParseNodeItemsType__1__List]
		| readonly [ParseNodeItemsType__0__List, Token, ParseNodeItemsType__1__List, Token]
	;
}

export class ParseNodePropertiesType__0__List extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeEntryType_Named]
		| readonly [ParseNodePropertiesType__0__List, Token, ParseNodeEntryType_Named]
		| readonly [ParseNodeEntryType_Named_Optional]
		| readonly [ParseNodePropertiesType__0__List, Token, ParseNodeEntryType_Named_Optional]
	;
}

export class ParseNodePropertiesType extends ParseNode {
	declare readonly children:
		| readonly [ParseNodePropertiesType__0__List]
		| readonly [ParseNodePropertiesType__0__List, Token]
	;
}

export class ParseNodeTypeTupleLiteral extends ParseNode {
	declare readonly children:
		| readonly [Token, Token]
		| readonly [Token, ParseNodeItemsType, Token]
		| readonly [Token, Token, ParseNodeItemsType, Token]
	;
}

export class ParseNodeTypeRecordLiteral extends ParseNode {
	declare readonly children:
		| readonly [Token, ParseNodePropertiesType, Token]
		| readonly [Token, Token, ParseNodePropertiesType, Token]
	;
}

export class ParseNodeTypeHashLiteral extends ParseNode {
	declare readonly children:
		| readonly [Token, Token, ParseNodeType, Token]
	;
}

export class ParseNodeTypeMapLiteral extends ParseNode {
	declare readonly children:
		| readonly [Token, ParseNodeType, Token, ParseNodeType, Token]
	;
}

export class ParseNodeGenericArguments__0__List extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeType]
		| readonly [ParseNodeGenericArguments__0__List, Token, ParseNodeType]
	;
}

export class ParseNodeGenericArguments extends ParseNode {
	declare readonly children:
		| readonly [Token, ParseNodeGenericArguments__0__List, Token]
		| readonly [Token, ParseNodeGenericArguments__0__List, Token, Token]
		| readonly [Token, Token, ParseNodeGenericArguments__0__List, Token]
		| readonly [Token, Token, ParseNodeGenericArguments__0__List, Token, Token]
	;
}

export class ParseNodeTypeUnit extends ParseNode {
	declare readonly children:
		| readonly [Token]
		| readonly [ParseNodePrimitiveLiteral]
		| readonly [ParseNodeTypeKeyword]
		| readonly [ParseNodeTypeTupleLiteral]
		| readonly [ParseNodeTypeRecordLiteral]
		| readonly [ParseNodeTypeHashLiteral]
		| readonly [ParseNodeTypeMapLiteral]
		| readonly [Token, ParseNodeType, Token]
	;
}

export class ParseNodePropertyAccessType extends ParseNode {
	declare readonly children:
		| readonly [Token, Token]
		| readonly [Token, ParseNodeWord]
	;
}

export class ParseNodeGenericCall extends ParseNode {
	declare readonly children:
		| readonly [Token, ParseNodeGenericArguments]
	;
}

export class ParseNodeTypeCompound extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeTypeUnit]
		| readonly [ParseNodeTypeCompound, ParseNodePropertyAccessType]
		| readonly [ParseNodeTypeCompound, ParseNodeGenericCall]
	;
}

export class ParseNodeTypeUnarySymbol extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeTypeCompound]
		| readonly [ParseNodeTypeUnarySymbol, Token]
		| readonly [ParseNodeTypeUnarySymbol, Token]
		| readonly [ParseNodeTypeUnarySymbol, Token, Token]
		| readonly [ParseNodeTypeUnarySymbol, Token, Token, Token]
		| readonly [ParseNodeTypeUnarySymbol, Token, Token]
	;
}

export class ParseNodeTypeUnaryKeyword extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeTypeUnarySymbol]
		| readonly [Token, ParseNodeTypeUnaryKeyword]
	;
}

export class ParseNodeTypeIntersection extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeTypeUnaryKeyword]
		| readonly [ParseNodeTypeIntersection, Token, ParseNodeTypeUnaryKeyword]
	;
}

export class ParseNodeTypeUnion extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeTypeIntersection]
		| readonly [ParseNodeTypeUnion, Token, ParseNodeTypeIntersection]
	;
}

export class ParseNodeType extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeTypeUnion]
	;
}

// WARNING: Manual code. Do not delete!
export abstract class ParseNodeStringTemplate$__0__List extends ParseNode {
	declare readonly children:
		| ParseNodeStringTemplate__0__List['children']
		| ParseNodeStringTemplate_Dynamic__0__List['children']
	;
}

export class ParseNodeStringTemplate__0__List extends ParseNodeStringTemplate$__0__List {
	declare readonly children:
		| readonly [Token]
		| readonly [ParseNodeStringTemplate__0__List, Token]
		| readonly [Token, ParseNodeExpression]
		| readonly [ParseNodeStringTemplate__0__List, Token, ParseNodeExpression]
	;
}

export class ParseNodeStringTemplate_Dynamic__0__List extends ParseNodeStringTemplate$__0__List {
	declare readonly children:
		| readonly [Token]
		| readonly [ParseNodeStringTemplate_Dynamic__0__List, Token]
		| readonly [Token, ParseNodeExpression_Dynamic]
		| readonly [ParseNodeStringTemplate_Dynamic__0__List, Token, ParseNodeExpression_Dynamic]
	;
}

export abstract class ParseNodeStringTemplate$ extends ParseNode {
	declare readonly children:
		| readonly [Token]
		| readonly [Token, Token]
		| readonly [Token, ParseNodeStringTemplate__0__List, Token]
		| readonly [Token, ParseNodeExpression, Token]
		| readonly [Token, ParseNodeExpression, ParseNodeStringTemplate__0__List, Token]
		| readonly [Token]
		| readonly [Token, Token]
		| readonly [Token, ParseNodeStringTemplate_Dynamic__0__List, Token]
		| readonly [Token, ParseNodeExpression_Dynamic, Token]
		| readonly [Token, ParseNodeExpression_Dynamic, ParseNodeStringTemplate_Dynamic__0__List, Token]
	;
}

export class ParseNodeStringTemplate extends ParseNodeStringTemplate$ {
	declare readonly children:
		| readonly [Token]
		| readonly [Token, Token]
		| readonly [Token, ParseNodeStringTemplate__0__List, Token]
		| readonly [Token, ParseNodeExpression, Token]
		| readonly [Token, ParseNodeExpression, ParseNodeStringTemplate__0__List, Token]
	;
}

export class ParseNodeStringTemplate_Dynamic extends ParseNodeStringTemplate$ {
	declare readonly children:
		| readonly [Token]
		| readonly [Token, Token]
		| readonly [Token, ParseNodeStringTemplate_Dynamic__0__List, Token]
		| readonly [Token, ParseNodeExpression_Dynamic, Token]
		| readonly [Token, ParseNodeExpression_Dynamic, ParseNodeStringTemplate_Dynamic__0__List, Token]
	;
}

export class ParseNodeProperty extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeWord, Token, ParseNodeExpression_Dynamic]
	;
}

export class ParseNodeCase extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeExpression_Dynamic, Token, ParseNodeExpression_Dynamic]
	;
}

export class ParseNodeTupleLiteral__0__List extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeExpression_Dynamic]
		| readonly [ParseNodeTupleLiteral__0__List, Token, ParseNodeExpression_Dynamic]
	;
}

export class ParseNodeTupleLiteral extends ParseNode {
	declare readonly children:
		| readonly [Token, Token]
		| readonly [Token, ParseNodeTupleLiteral__0__List, Token]
		| readonly [Token, ParseNodeTupleLiteral__0__List, Token, Token]
		| readonly [Token, Token, ParseNodeTupleLiteral__0__List, Token]
		| readonly [Token, Token, ParseNodeTupleLiteral__0__List, Token, Token]
	;
}

export class ParseNodeRecordLiteral__0__List extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeProperty]
		| readonly [ParseNodeRecordLiteral__0__List, Token, ParseNodeProperty]
	;
}

export class ParseNodeRecordLiteral extends ParseNode {
	declare readonly children:
		| readonly [Token, ParseNodeRecordLiteral__0__List, Token]
		| readonly [Token, ParseNodeRecordLiteral__0__List, Token, Token]
		| readonly [Token, Token, ParseNodeRecordLiteral__0__List, Token]
		| readonly [Token, Token, ParseNodeRecordLiteral__0__List, Token, Token]
	;
}

export class ParseNodeSetLiteral extends ParseNode {
	declare readonly children:
		| readonly [Token, Token]
		| readonly [Token, ParseNodeTupleLiteral__0__List, Token]
		| readonly [Token, ParseNodeTupleLiteral__0__List, Token, Token]
		| readonly [Token, Token, ParseNodeTupleLiteral__0__List, Token]
		| readonly [Token, Token, ParseNodeTupleLiteral__0__List, Token, Token]
	;
}

export class ParseNodeMapLiteral__0__List extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeCase]
		| readonly [ParseNodeMapLiteral__0__List, Token, ParseNodeCase]
	;
}

export class ParseNodeMapLiteral extends ParseNode {
	declare readonly children:
		| readonly [Token, ParseNodeMapLiteral__0__List, Token]
		| readonly [Token, ParseNodeMapLiteral__0__List, Token, Token]
		| readonly [Token, Token, ParseNodeMapLiteral__0__List, Token]
		| readonly [Token, Token, ParseNodeMapLiteral__0__List, Token, Token]
	;
}

export class ParseNodeFunctionArguments extends ParseNode {
	declare readonly children:
		| readonly [Token, Token]
		| readonly [Token, ParseNodeTupleLiteral__0__List, Token]
		| readonly [Token, ParseNodeTupleLiteral__0__List, Token, Token]
		| readonly [Token, Token, ParseNodeTupleLiteral__0__List, Token]
		| readonly [Token, Token, ParseNodeTupleLiteral__0__List, Token, Token]
	;
}

export abstract class ParseNodeExpressionUnit$ extends ParseNode {
	declare readonly children:
		| readonly [ParseNodePrimitiveLiteral]
		| readonly [ParseNodeStringTemplate]
		| readonly [ParseNodeTupleLiteral]
		| readonly [ParseNodeRecordLiteral]
		| readonly [ParseNodeSetLiteral]
		| readonly [ParseNodeMapLiteral]
		| readonly [Token, ParseNodeExpression, Token]
		| readonly [Token]
		| readonly [ParseNodePrimitiveLiteral]
		| readonly [ParseNodeStringTemplate_Dynamic]
		| readonly [ParseNodeTupleLiteral]
		| readonly [ParseNodeRecordLiteral]
		| readonly [ParseNodeSetLiteral]
		| readonly [ParseNodeMapLiteral]
		| readonly [Token, ParseNodeExpression_Dynamic, Token]
	;
}

export class ParseNodeExpressionUnit extends ParseNodeExpressionUnit$ {
	declare readonly children:
		| readonly [ParseNodePrimitiveLiteral]
		| readonly [ParseNodeStringTemplate]
		| readonly [ParseNodeTupleLiteral]
		| readonly [ParseNodeRecordLiteral]
		| readonly [ParseNodeSetLiteral]
		| readonly [ParseNodeMapLiteral]
		| readonly [Token, ParseNodeExpression, Token]
	;
}

export class ParseNodeExpressionUnit_Dynamic extends ParseNodeExpressionUnit$ {
	declare readonly children:
		| readonly [Token]
		| readonly [ParseNodePrimitiveLiteral]
		| readonly [ParseNodeStringTemplate_Dynamic]
		| readonly [ParseNodeTupleLiteral]
		| readonly [ParseNodeRecordLiteral]
		| readonly [ParseNodeSetLiteral]
		| readonly [ParseNodeMapLiteral]
		| readonly [Token, ParseNodeExpression_Dynamic, Token]
	;
}

export class ParseNodePropertyAccess extends ParseNode {
	declare readonly children:
		| readonly [Token, Token]
		| readonly [Token, ParseNodeWord]
		| readonly [Token, Token, ParseNodeExpression_Dynamic, Token]
		| readonly [Token, Token]
		| readonly [Token, ParseNodeWord]
		| readonly [Token, Token, ParseNodeExpression_Dynamic, Token]
		| readonly [Token, Token]
		| readonly [Token, ParseNodeWord]
		| readonly [Token, Token, ParseNodeExpression_Dynamic, Token]
	;
}

export class ParseNodePropertyAssign extends ParseNode {
	declare readonly children:
		| readonly [Token, Token]
		| readonly [Token, ParseNodeWord]
		| readonly [Token, Token, ParseNodeExpression_Dynamic, Token]
	;
}

export class ParseNodeFunctionCall extends ParseNode {
	declare readonly children:
		| readonly [Token, ParseNodeFunctionArguments]
		| readonly [Token, ParseNodeGenericArguments, ParseNodeFunctionArguments]
	;
}

export abstract class ParseNodeExpressionCompound$ extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeExpressionUnit]
		| readonly [ParseNodeExpressionUnit_Dynamic]
		| readonly [ParseNodeExpressionCompound_Dynamic, ParseNodePropertyAccess]
		| readonly [ParseNodeExpressionCompound_Dynamic, ParseNodeFunctionCall]
	;
}

export class ParseNodeExpressionCompound extends ParseNodeExpressionCompound$ {
	declare readonly children:
		| readonly [ParseNodeExpressionUnit]
	;
}

export class ParseNodeExpressionCompound_Dynamic extends ParseNodeExpressionCompound$ {
	declare readonly children:
		| readonly [ParseNodeExpressionUnit_Dynamic]
		| readonly [ParseNodeExpressionCompound_Dynamic, ParseNodePropertyAccess]
		| readonly [ParseNodeExpressionCompound_Dynamic, ParseNodeFunctionCall]
	;
}

export class ParseNodeAssignee extends ParseNode {
	declare readonly children:
		| readonly [Token]
		| readonly [ParseNodeExpressionCompound_Dynamic, ParseNodePropertyAssign]
	;
}

export abstract class ParseNodeExpressionUnarySymbol$ extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeExpressionCompound]
		| readonly [Token, ParseNodeExpressionUnarySymbol]
		| readonly [Token, ParseNodeExpressionUnarySymbol]
		| readonly [Token, ParseNodeExpressionUnarySymbol]
		| readonly [Token, ParseNodeExpressionUnarySymbol]
		| readonly [ParseNodeExpressionCompound_Dynamic]
		| readonly [Token, ParseNodeExpressionUnarySymbol_Dynamic]
		| readonly [Token, ParseNodeExpressionUnarySymbol_Dynamic]
		| readonly [Token, ParseNodeExpressionUnarySymbol_Dynamic]
		| readonly [Token, ParseNodeExpressionUnarySymbol_Dynamic]
	;
}

export class ParseNodeExpressionUnarySymbol extends ParseNodeExpressionUnarySymbol$ {
	declare readonly children:
		| readonly [ParseNodeExpressionCompound]
		| readonly [Token, ParseNodeExpressionUnarySymbol]
		| readonly [Token, ParseNodeExpressionUnarySymbol]
		| readonly [Token, ParseNodeExpressionUnarySymbol]
		| readonly [Token, ParseNodeExpressionUnarySymbol]
	;
}

export class ParseNodeExpressionUnarySymbol_Dynamic extends ParseNodeExpressionUnarySymbol$ {
	declare readonly children:
		| readonly [ParseNodeExpressionCompound_Dynamic]
		| readonly [Token, ParseNodeExpressionUnarySymbol_Dynamic]
		| readonly [Token, ParseNodeExpressionUnarySymbol_Dynamic]
		| readonly [Token, ParseNodeExpressionUnarySymbol_Dynamic]
		| readonly [Token, ParseNodeExpressionUnarySymbol_Dynamic]
	;
}

export abstract class ParseNodeExpressionExponential$ extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeExpressionUnarySymbol]
		| readonly [ParseNodeExpressionUnarySymbol, Token, ParseNodeExpressionExponential]
		| readonly [ParseNodeExpressionUnarySymbol_Dynamic]
		| readonly [ParseNodeExpressionUnarySymbol_Dynamic, Token, ParseNodeExpressionExponential_Dynamic]
	;
}

export class ParseNodeExpressionExponential extends ParseNodeExpressionExponential$ {
	declare readonly children:
		| readonly [ParseNodeExpressionUnarySymbol]
		| readonly [ParseNodeExpressionUnarySymbol, Token, ParseNodeExpressionExponential]
	;
}

export class ParseNodeExpressionExponential_Dynamic extends ParseNodeExpressionExponential$ {
	declare readonly children:
		| readonly [ParseNodeExpressionUnarySymbol_Dynamic]
		| readonly [ParseNodeExpressionUnarySymbol_Dynamic, Token, ParseNodeExpressionExponential_Dynamic]
	;
}

export abstract class ParseNodeExpressionMultiplicative$ extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeExpressionExponential]
		| readonly [ParseNodeExpressionMultiplicative, Token, ParseNodeExpressionExponential]
		| readonly [ParseNodeExpressionMultiplicative, Token, ParseNodeExpressionExponential]
		| readonly [ParseNodeExpressionExponential_Dynamic]
		| readonly [ParseNodeExpressionMultiplicative_Dynamic, Token, ParseNodeExpressionExponential_Dynamic]
		| readonly [ParseNodeExpressionMultiplicative_Dynamic, Token, ParseNodeExpressionExponential_Dynamic]
	;
}

export class ParseNodeExpressionMultiplicative extends ParseNodeExpressionMultiplicative$ {
	declare readonly children:
		| readonly [ParseNodeExpressionExponential]
		| readonly [ParseNodeExpressionMultiplicative, Token, ParseNodeExpressionExponential]
		| readonly [ParseNodeExpressionMultiplicative, Token, ParseNodeExpressionExponential]
	;
}

export class ParseNodeExpressionMultiplicative_Dynamic extends ParseNodeExpressionMultiplicative$ {
	declare readonly children:
		| readonly [ParseNodeExpressionExponential_Dynamic]
		| readonly [ParseNodeExpressionMultiplicative_Dynamic, Token, ParseNodeExpressionExponential_Dynamic]
		| readonly [ParseNodeExpressionMultiplicative_Dynamic, Token, ParseNodeExpressionExponential_Dynamic]
	;
}

export abstract class ParseNodeExpressionAdditive$ extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeExpressionMultiplicative]
		| readonly [ParseNodeExpressionAdditive, Token, ParseNodeExpressionMultiplicative]
		| readonly [ParseNodeExpressionAdditive, Token, ParseNodeExpressionMultiplicative]
		| readonly [ParseNodeExpressionMultiplicative_Dynamic]
		| readonly [ParseNodeExpressionAdditive_Dynamic, Token, ParseNodeExpressionMultiplicative_Dynamic]
		| readonly [ParseNodeExpressionAdditive_Dynamic, Token, ParseNodeExpressionMultiplicative_Dynamic]
	;
}

export class ParseNodeExpressionAdditive extends ParseNodeExpressionAdditive$ {
	declare readonly children:
		| readonly [ParseNodeExpressionMultiplicative]
		| readonly [ParseNodeExpressionAdditive, Token, ParseNodeExpressionMultiplicative]
		| readonly [ParseNodeExpressionAdditive, Token, ParseNodeExpressionMultiplicative]
	;
}

export class ParseNodeExpressionAdditive_Dynamic extends ParseNodeExpressionAdditive$ {
	declare readonly children:
		| readonly [ParseNodeExpressionMultiplicative_Dynamic]
		| readonly [ParseNodeExpressionAdditive_Dynamic, Token, ParseNodeExpressionMultiplicative_Dynamic]
		| readonly [ParseNodeExpressionAdditive_Dynamic, Token, ParseNodeExpressionMultiplicative_Dynamic]
	;
}

export abstract class ParseNodeExpressionComparative$ extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeExpressionAdditive]
		| readonly [ParseNodeExpressionComparative, Token, ParseNodeExpressionAdditive]
		| readonly [ParseNodeExpressionComparative, Token, ParseNodeExpressionAdditive]
		| readonly [ParseNodeExpressionComparative, Token, ParseNodeExpressionAdditive]
		| readonly [ParseNodeExpressionComparative, Token, ParseNodeExpressionAdditive]
		| readonly [ParseNodeExpressionComparative, Token, ParseNodeExpressionAdditive]
		| readonly [ParseNodeExpressionComparative, Token, ParseNodeExpressionAdditive]
		| readonly [ParseNodeExpressionComparative, Token, ParseNodeExpressionAdditive]
		| readonly [ParseNodeExpressionComparative, Token, ParseNodeExpressionAdditive]
		| readonly [ParseNodeExpressionAdditive_Dynamic]
		| readonly [ParseNodeExpressionComparative_Dynamic, Token, ParseNodeExpressionAdditive_Dynamic]
		| readonly [ParseNodeExpressionComparative_Dynamic, Token, ParseNodeExpressionAdditive_Dynamic]
		| readonly [ParseNodeExpressionComparative_Dynamic, Token, ParseNodeExpressionAdditive_Dynamic]
		| readonly [ParseNodeExpressionComparative_Dynamic, Token, ParseNodeExpressionAdditive_Dynamic]
		| readonly [ParseNodeExpressionComparative_Dynamic, Token, ParseNodeExpressionAdditive_Dynamic]
		| readonly [ParseNodeExpressionComparative_Dynamic, Token, ParseNodeExpressionAdditive_Dynamic]
		| readonly [ParseNodeExpressionComparative_Dynamic, Token, ParseNodeExpressionAdditive_Dynamic]
		| readonly [ParseNodeExpressionComparative_Dynamic, Token, ParseNodeExpressionAdditive_Dynamic]
	;
}

export class ParseNodeExpressionComparative extends ParseNodeExpressionComparative$ {
	declare readonly children:
		| readonly [ParseNodeExpressionAdditive]
		| readonly [ParseNodeExpressionComparative, Token, ParseNodeExpressionAdditive]
		| readonly [ParseNodeExpressionComparative, Token, ParseNodeExpressionAdditive]
		| readonly [ParseNodeExpressionComparative, Token, ParseNodeExpressionAdditive]
		| readonly [ParseNodeExpressionComparative, Token, ParseNodeExpressionAdditive]
		| readonly [ParseNodeExpressionComparative, Token, ParseNodeExpressionAdditive]
		| readonly [ParseNodeExpressionComparative, Token, ParseNodeExpressionAdditive]
		| readonly [ParseNodeExpressionComparative, Token, ParseNodeExpressionAdditive]
		| readonly [ParseNodeExpressionComparative, Token, ParseNodeExpressionAdditive]
	;
}

export class ParseNodeExpressionComparative_Dynamic extends ParseNodeExpressionComparative$ {
	declare readonly children:
		| readonly [ParseNodeExpressionAdditive_Dynamic]
		| readonly [ParseNodeExpressionComparative_Dynamic, Token, ParseNodeExpressionAdditive_Dynamic]
		| readonly [ParseNodeExpressionComparative_Dynamic, Token, ParseNodeExpressionAdditive_Dynamic]
		| readonly [ParseNodeExpressionComparative_Dynamic, Token, ParseNodeExpressionAdditive_Dynamic]
		| readonly [ParseNodeExpressionComparative_Dynamic, Token, ParseNodeExpressionAdditive_Dynamic]
		| readonly [ParseNodeExpressionComparative_Dynamic, Token, ParseNodeExpressionAdditive_Dynamic]
		| readonly [ParseNodeExpressionComparative_Dynamic, Token, ParseNodeExpressionAdditive_Dynamic]
		| readonly [ParseNodeExpressionComparative_Dynamic, Token, ParseNodeExpressionAdditive_Dynamic]
		| readonly [ParseNodeExpressionComparative_Dynamic, Token, ParseNodeExpressionAdditive_Dynamic]
	;
}

export abstract class ParseNodeExpressionEquality$ extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeExpressionComparative]
		| readonly [ParseNodeExpressionEquality, Token, ParseNodeExpressionComparative]
		| readonly [ParseNodeExpressionEquality, Token, ParseNodeExpressionComparative]
		| readonly [ParseNodeExpressionEquality, Token, ParseNodeExpressionComparative]
		| readonly [ParseNodeExpressionEquality, Token, ParseNodeExpressionComparative]
		| readonly [ParseNodeExpressionComparative_Dynamic]
		| readonly [ParseNodeExpressionEquality_Dynamic, Token, ParseNodeExpressionComparative_Dynamic]
		| readonly [ParseNodeExpressionEquality_Dynamic, Token, ParseNodeExpressionComparative_Dynamic]
		| readonly [ParseNodeExpressionEquality_Dynamic, Token, ParseNodeExpressionComparative_Dynamic]
		| readonly [ParseNodeExpressionEquality_Dynamic, Token, ParseNodeExpressionComparative_Dynamic]
	;
}

export class ParseNodeExpressionEquality extends ParseNodeExpressionEquality$ {
	declare readonly children:
		| readonly [ParseNodeExpressionComparative]
		| readonly [ParseNodeExpressionEquality, Token, ParseNodeExpressionComparative]
		| readonly [ParseNodeExpressionEquality, Token, ParseNodeExpressionComparative]
		| readonly [ParseNodeExpressionEquality, Token, ParseNodeExpressionComparative]
		| readonly [ParseNodeExpressionEquality, Token, ParseNodeExpressionComparative]
	;
}

export class ParseNodeExpressionEquality_Dynamic extends ParseNodeExpressionEquality$ {
	declare readonly children:
		| readonly [ParseNodeExpressionComparative_Dynamic]
		| readonly [ParseNodeExpressionEquality_Dynamic, Token, ParseNodeExpressionComparative_Dynamic]
		| readonly [ParseNodeExpressionEquality_Dynamic, Token, ParseNodeExpressionComparative_Dynamic]
		| readonly [ParseNodeExpressionEquality_Dynamic, Token, ParseNodeExpressionComparative_Dynamic]
		| readonly [ParseNodeExpressionEquality_Dynamic, Token, ParseNodeExpressionComparative_Dynamic]
	;
}

export abstract class ParseNodeExpressionConjunctive$ extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeExpressionEquality]
		| readonly [ParseNodeExpressionConjunctive, Token, ParseNodeExpressionEquality]
		| readonly [ParseNodeExpressionConjunctive, Token, ParseNodeExpressionEquality]
		| readonly [ParseNodeExpressionEquality_Dynamic]
		| readonly [ParseNodeExpressionConjunctive_Dynamic, Token, ParseNodeExpressionEquality_Dynamic]
		| readonly [ParseNodeExpressionConjunctive_Dynamic, Token, ParseNodeExpressionEquality_Dynamic]
	;
}

export class ParseNodeExpressionConjunctive extends ParseNodeExpressionConjunctive$ {
	declare readonly children:
		| readonly [ParseNodeExpressionEquality]
		| readonly [ParseNodeExpressionConjunctive, Token, ParseNodeExpressionEquality]
		| readonly [ParseNodeExpressionConjunctive, Token, ParseNodeExpressionEquality]
	;
}

export class ParseNodeExpressionConjunctive_Dynamic extends ParseNodeExpressionConjunctive$ {
	declare readonly children:
		| readonly [ParseNodeExpressionEquality_Dynamic]
		| readonly [ParseNodeExpressionConjunctive_Dynamic, Token, ParseNodeExpressionEquality_Dynamic]
		| readonly [ParseNodeExpressionConjunctive_Dynamic, Token, ParseNodeExpressionEquality_Dynamic]
	;
}

export abstract class ParseNodeExpressionDisjunctive$ extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeExpressionConjunctive]
		| readonly [ParseNodeExpressionDisjunctive, Token, ParseNodeExpressionConjunctive]
		| readonly [ParseNodeExpressionDisjunctive, Token, ParseNodeExpressionConjunctive]
		| readonly [ParseNodeExpressionConjunctive_Dynamic]
		| readonly [ParseNodeExpressionDisjunctive_Dynamic, Token, ParseNodeExpressionConjunctive_Dynamic]
		| readonly [ParseNodeExpressionDisjunctive_Dynamic, Token, ParseNodeExpressionConjunctive_Dynamic]
	;
}

export class ParseNodeExpressionDisjunctive extends ParseNodeExpressionDisjunctive$ {
	declare readonly children:
		| readonly [ParseNodeExpressionConjunctive]
		| readonly [ParseNodeExpressionDisjunctive, Token, ParseNodeExpressionConjunctive]
		| readonly [ParseNodeExpressionDisjunctive, Token, ParseNodeExpressionConjunctive]
	;
}

export class ParseNodeExpressionDisjunctive_Dynamic extends ParseNodeExpressionDisjunctive$ {
	declare readonly children:
		| readonly [ParseNodeExpressionConjunctive_Dynamic]
		| readonly [ParseNodeExpressionDisjunctive_Dynamic, Token, ParseNodeExpressionConjunctive_Dynamic]
		| readonly [ParseNodeExpressionDisjunctive_Dynamic, Token, ParseNodeExpressionConjunctive_Dynamic]
	;
}

export abstract class ParseNodeExpressionConditional$ extends ParseNode {
	declare readonly children:
		| readonly [Token, ParseNodeExpression, Token, ParseNodeExpression, Token, ParseNodeExpression]
		| readonly [Token, ParseNodeExpression_Dynamic, Token, ParseNodeExpression_Dynamic, Token, ParseNodeExpression_Dynamic]
	;
}

export class ParseNodeExpressionConditional extends ParseNodeExpressionConditional$ {
	declare readonly children:
		| readonly [Token, ParseNodeExpression, Token, ParseNodeExpression, Token, ParseNodeExpression]
	;
}

export class ParseNodeExpressionConditional_Dynamic extends ParseNodeExpressionConditional$ {
	declare readonly children:
		| readonly [Token, ParseNodeExpression_Dynamic, Token, ParseNodeExpression_Dynamic, Token, ParseNodeExpression_Dynamic]
	;
}

export abstract class ParseNodeExpression$ extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeExpressionDisjunctive]
		| readonly [ParseNodeExpressionConditional]
		| readonly [ParseNodeExpressionDisjunctive_Dynamic]
		| readonly [ParseNodeExpressionConditional_Dynamic]
	;
}

export class ParseNodeExpression extends ParseNodeExpression$ {
	declare readonly children:
		| readonly [ParseNodeExpressionDisjunctive]
		| readonly [ParseNodeExpressionConditional]
	;
}

export class ParseNodeExpression_Dynamic extends ParseNodeExpression$ {
	declare readonly children:
		| readonly [ParseNodeExpressionDisjunctive_Dynamic]
		| readonly [ParseNodeExpressionConditional_Dynamic]
	;
}

export class ParseNodeDeclarationType extends ParseNode {
	declare readonly children:
		| readonly [Token, Token, Token, ParseNodeType, Token]
	;
}

export class ParseNodeDeclarationVariable extends ParseNode {
	declare readonly children:
		| readonly [Token, Token, Token, ParseNodeType, Token, ParseNodeExpression_Dynamic, Token]
		| readonly [Token, Token, Token, Token, ParseNodeType, Token, ParseNodeExpression_Dynamic, Token]
	;
}

export class ParseNodeDeclaration extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeDeclarationType]
		| readonly [ParseNodeDeclarationVariable]
	;
}

export class ParseNodeStatementAssignment extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeAssignee, Token, ParseNodeExpression_Dynamic, Token]
	;
}

export class ParseNodeStatement extends ParseNode {
	declare readonly children:
		| readonly [Token]
		| readonly [ParseNodeExpression_Dynamic, Token]
		| readonly [ParseNodeDeclaration]
		| readonly [ParseNodeStatementAssignment]
	;
}

export class ParseNodeGoal__0__List extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeStatement]
		| readonly [ParseNodeGoal__0__List, ParseNodeStatement]
	;
}

export class ParseNodeGoal extends ParseNode {
	declare readonly children:
		| readonly [Token, Token]
		| readonly [Token, ParseNodeGoal__0__List, Token]
	;
}


export const GRAMMAR: Grammar = new Grammar([
	ProductionWord.instance,
	ProductionPrimitiveLiteral.instance,
	ProductionTypeKeyword.instance,
	ProductionEntryType.instance,
	ProductionEntryType_Optional.instance,
	ProductionEntryType_Named.instance,
	ProductionEntryType_Named_Optional.instance,
	ProductionItemsType__0__List.instance,
	ProductionItemsType__1__List.instance,
	ProductionItemsType.instance,
	ProductionPropertiesType__0__List.instance,
	ProductionPropertiesType.instance,
	ProductionTypeTupleLiteral.instance,
	ProductionTypeRecordLiteral.instance,
	ProductionTypeHashLiteral.instance,
	ProductionTypeMapLiteral.instance,
	ProductionGenericArguments__0__List.instance,
	ProductionGenericArguments.instance,
	ProductionTypeUnit.instance,
	ProductionPropertyAccessType.instance,
	ProductionGenericCall.instance,
	ProductionTypeCompound.instance,
	ProductionTypeUnarySymbol.instance,
	ProductionTypeUnaryKeyword.instance,
	ProductionTypeIntersection.instance,
	ProductionTypeUnion.instance,
	ProductionType.instance,
	ProductionStringTemplate__0__List.instance,
	ProductionStringTemplate_Dynamic__0__List.instance,
	ProductionStringTemplate.instance,
	ProductionStringTemplate_Dynamic.instance,
	ProductionProperty.instance,
	ProductionCase.instance,
	ProductionTupleLiteral__0__List.instance,
	ProductionTupleLiteral.instance,
	ProductionRecordLiteral__0__List.instance,
	ProductionRecordLiteral.instance,
	ProductionSetLiteral.instance,
	ProductionMapLiteral__0__List.instance,
	ProductionMapLiteral.instance,
	ProductionFunctionArguments.instance,
	ProductionExpressionUnit.instance,
	ProductionExpressionUnit_Dynamic.instance,
	ProductionPropertyAccess.instance,
	ProductionPropertyAssign.instance,
	ProductionFunctionCall.instance,
	ProductionExpressionCompound.instance,
	ProductionExpressionCompound_Dynamic.instance,
	ProductionAssignee.instance,
	ProductionExpressionUnarySymbol.instance,
	ProductionExpressionUnarySymbol_Dynamic.instance,
	ProductionExpressionExponential.instance,
	ProductionExpressionExponential_Dynamic.instance,
	ProductionExpressionMultiplicative.instance,
	ProductionExpressionMultiplicative_Dynamic.instance,
	ProductionExpressionAdditive.instance,
	ProductionExpressionAdditive_Dynamic.instance,
	ProductionExpressionComparative.instance,
	ProductionExpressionComparative_Dynamic.instance,
	ProductionExpressionEquality.instance,
	ProductionExpressionEquality_Dynamic.instance,
	ProductionExpressionConjunctive.instance,
	ProductionExpressionConjunctive_Dynamic.instance,
	ProductionExpressionDisjunctive.instance,
	ProductionExpressionDisjunctive_Dynamic.instance,
	ProductionExpressionConditional.instance,
	ProductionExpressionConditional_Dynamic.instance,
	ProductionExpression.instance,
	ProductionExpression_Dynamic.instance,
	ProductionDeclarationType.instance,
	ProductionDeclarationVariable.instance,
	ProductionDeclaration.instance,
	ProductionStatementAssignment.instance,
	ProductionStatement.instance,
	ProductionGoal__0__List.instance,
	ProductionGoal.instance,
], ProductionGoal.instance);



export class ParserSolid extends Parser<ParseNodeGoal> {
	constructor (config: SolidConfig = CONFIG_DEFAULT) {
		super(
	(config === CONFIG_DEFAULT) ? LEXER : new LexerSolid(config),
	GRAMMAR,
	new Map<Production, typeof ParseNode>([
		[ProductionWord.instance, ParseNodeWord],
		[ProductionPrimitiveLiteral.instance, ParseNodePrimitiveLiteral],
		[ProductionTypeKeyword.instance, ParseNodeTypeKeyword],
		[ProductionEntryType.instance, ParseNodeEntryType],
		[ProductionEntryType_Optional.instance, ParseNodeEntryType_Optional],
		[ProductionEntryType_Named.instance, ParseNodeEntryType_Named],
		[ProductionEntryType_Named_Optional.instance, ParseNodeEntryType_Named_Optional],
		[ProductionItemsType__0__List.instance, ParseNodeItemsType__0__List],
		[ProductionItemsType__1__List.instance, ParseNodeItemsType__1__List],
		[ProductionItemsType.instance, ParseNodeItemsType],
		[ProductionPropertiesType__0__List.instance, ParseNodePropertiesType__0__List],
		[ProductionPropertiesType.instance, ParseNodePropertiesType],
		[ProductionTypeTupleLiteral.instance, ParseNodeTypeTupleLiteral],
		[ProductionTypeRecordLiteral.instance, ParseNodeTypeRecordLiteral],
		[ProductionTypeHashLiteral.instance, ParseNodeTypeHashLiteral],
		[ProductionTypeMapLiteral.instance, ParseNodeTypeMapLiteral],
		[ProductionGenericArguments__0__List.instance, ParseNodeGenericArguments__0__List],
		[ProductionGenericArguments.instance, ParseNodeGenericArguments],
		[ProductionTypeUnit.instance, ParseNodeTypeUnit],
		[ProductionPropertyAccessType.instance, ParseNodePropertyAccessType],
		[ProductionGenericCall.instance, ParseNodeGenericCall],
		[ProductionTypeCompound.instance, ParseNodeTypeCompound],
		[ProductionTypeUnarySymbol.instance, ParseNodeTypeUnarySymbol],
		[ProductionTypeUnaryKeyword.instance, ParseNodeTypeUnaryKeyword],
		[ProductionTypeIntersection.instance, ParseNodeTypeIntersection],
		[ProductionTypeUnion.instance, ParseNodeTypeUnion],
		[ProductionType.instance, ParseNodeType],
		[ProductionStringTemplate__0__List.instance, ParseNodeStringTemplate__0__List],
		[ProductionStringTemplate_Dynamic__0__List.instance, ParseNodeStringTemplate_Dynamic__0__List],
		[ProductionStringTemplate.instance, ParseNodeStringTemplate],
		[ProductionStringTemplate_Dynamic.instance, ParseNodeStringTemplate_Dynamic],
		[ProductionProperty.instance, ParseNodeProperty],
		[ProductionCase.instance, ParseNodeCase],
		[ProductionTupleLiteral__0__List.instance, ParseNodeTupleLiteral__0__List],
		[ProductionTupleLiteral.instance, ParseNodeTupleLiteral],
		[ProductionRecordLiteral__0__List.instance, ParseNodeRecordLiteral__0__List],
		[ProductionRecordLiteral.instance, ParseNodeRecordLiteral],
		[ProductionSetLiteral.instance, ParseNodeSetLiteral],
		[ProductionMapLiteral__0__List.instance, ParseNodeMapLiteral__0__List],
		[ProductionMapLiteral.instance, ParseNodeMapLiteral],
		[ProductionFunctionArguments.instance, ParseNodeFunctionArguments],
		[ProductionExpressionUnit.instance, ParseNodeExpressionUnit],
		[ProductionExpressionUnit_Dynamic.instance, ParseNodeExpressionUnit_Dynamic],
		[ProductionPropertyAccess.instance, ParseNodePropertyAccess],
		[ProductionPropertyAssign.instance, ParseNodePropertyAssign],
		[ProductionFunctionCall.instance, ParseNodeFunctionCall],
		[ProductionExpressionCompound.instance, ParseNodeExpressionCompound],
		[ProductionExpressionCompound_Dynamic.instance, ParseNodeExpressionCompound_Dynamic],
		[ProductionAssignee.instance, ParseNodeAssignee],
		[ProductionExpressionUnarySymbol.instance, ParseNodeExpressionUnarySymbol],
		[ProductionExpressionUnarySymbol_Dynamic.instance, ParseNodeExpressionUnarySymbol_Dynamic],
		[ProductionExpressionExponential.instance, ParseNodeExpressionExponential],
		[ProductionExpressionExponential_Dynamic.instance, ParseNodeExpressionExponential_Dynamic],
		[ProductionExpressionMultiplicative.instance, ParseNodeExpressionMultiplicative],
		[ProductionExpressionMultiplicative_Dynamic.instance, ParseNodeExpressionMultiplicative_Dynamic],
		[ProductionExpressionAdditive.instance, ParseNodeExpressionAdditive],
		[ProductionExpressionAdditive_Dynamic.instance, ParseNodeExpressionAdditive_Dynamic],
		[ProductionExpressionComparative.instance, ParseNodeExpressionComparative],
		[ProductionExpressionComparative_Dynamic.instance, ParseNodeExpressionComparative_Dynamic],
		[ProductionExpressionEquality.instance, ParseNodeExpressionEquality],
		[ProductionExpressionEquality_Dynamic.instance, ParseNodeExpressionEquality_Dynamic],
		[ProductionExpressionConjunctive.instance, ParseNodeExpressionConjunctive],
		[ProductionExpressionConjunctive_Dynamic.instance, ParseNodeExpressionConjunctive_Dynamic],
		[ProductionExpressionDisjunctive.instance, ParseNodeExpressionDisjunctive],
		[ProductionExpressionDisjunctive_Dynamic.instance, ParseNodeExpressionDisjunctive_Dynamic],
		[ProductionExpressionConditional.instance, ParseNodeExpressionConditional],
		[ProductionExpressionConditional_Dynamic.instance, ParseNodeExpressionConditional_Dynamic],
		[ProductionExpression.instance, ParseNodeExpression],
		[ProductionExpression_Dynamic.instance, ParseNodeExpression_Dynamic],
		[ProductionDeclarationType.instance, ParseNodeDeclarationType],
		[ProductionDeclarationVariable.instance, ParseNodeDeclarationVariable],
		[ProductionDeclaration.instance, ParseNodeDeclaration],
		[ProductionStatementAssignment.instance, ParseNodeStatementAssignment],
		[ProductionStatement.instance, ParseNodeStatement],
		[ProductionGoal__0__List.instance, ParseNodeGoal__0__List],
		[ProductionGoal.instance, ParseNodeGoal],
	]),
);
	}
}
export const PARSER: ParserSolid = new ParserSolid();


