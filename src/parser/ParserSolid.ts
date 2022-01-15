

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

class ProductionStringTemplate_Variable__0__List extends Production {
	static readonly instance: ProductionStringTemplate_Variable__0__List = new ProductionStringTemplate_Variable__0__List();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[TERMINAL.TerminalTemplateMiddle.instance],
			[ProductionStringTemplate_Variable__0__List.instance, TERMINAL.TerminalTemplateMiddle.instance],
			[TERMINAL.TerminalTemplateMiddle.instance, ProductionExpression_Variable.instance],
			[ProductionStringTemplate_Variable__0__List.instance, TERMINAL.TerminalTemplateMiddle.instance, ProductionExpression_Variable.instance],
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

class ProductionStringTemplate_Variable extends Production {
	static readonly instance: ProductionStringTemplate_Variable = new ProductionStringTemplate_Variable();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[TERMINAL.TerminalTemplateFull.instance],
			[TERMINAL.TerminalTemplateHead.instance, TERMINAL.TerminalTemplateTail.instance],
			[TERMINAL.TerminalTemplateHead.instance, ProductionStringTemplate_Variable__0__List.instance, TERMINAL.TerminalTemplateTail.instance],
			[TERMINAL.TerminalTemplateHead.instance, ProductionExpression_Variable.instance, TERMINAL.TerminalTemplateTail.instance],
			[TERMINAL.TerminalTemplateHead.instance, ProductionExpression_Variable.instance, ProductionStringTemplate_Variable__0__List.instance, TERMINAL.TerminalTemplateTail.instance],
		];
	}
}

class ProductionProperty extends Production {
	static readonly instance: ProductionProperty = new ProductionProperty();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionWord.instance, '=', ProductionExpression.instance],
		];
	}
}

class ProductionProperty_Variable extends Production {
	static readonly instance: ProductionProperty_Variable = new ProductionProperty_Variable();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionWord.instance, '=', ProductionExpression_Variable.instance],
		];
	}
}

class ProductionCase extends Production {
	static readonly instance: ProductionCase = new ProductionCase();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpression_Variable.instance, '->', ProductionExpression_Variable.instance],
		];
	}
}

class ProductionTupleLiteral__0__List extends Production {
	static readonly instance: ProductionTupleLiteral__0__List = new ProductionTupleLiteral__0__List();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpression.instance],
			[ProductionTupleLiteral__0__List.instance, ',', ProductionExpression.instance],
		];
	}
}

class ProductionTupleLiteral_Variable__0__List extends Production {
	static readonly instance: ProductionTupleLiteral_Variable__0__List = new ProductionTupleLiteral_Variable__0__List();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpression_Variable.instance],
			[ProductionTupleLiteral_Variable__0__List.instance, ',', ProductionExpression_Variable.instance],
		];
	}
}

class ProductionTupleLiteral extends Production {
	static readonly instance: ProductionTupleLiteral = new ProductionTupleLiteral();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['@', '[', ']'],
			['@', '[', ProductionTupleLiteral__0__List.instance, ']'],
			['@', '[', ProductionTupleLiteral__0__List.instance, ',', ']'],
			['@', '[', ',', ProductionTupleLiteral__0__List.instance, ']'],
			['@', '[', ',', ProductionTupleLiteral__0__List.instance, ',', ']'],
		];
	}
}

class ProductionTupleLiteral_Variable extends Production {
	static readonly instance: ProductionTupleLiteral_Variable = new ProductionTupleLiteral_Variable();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['[', ']'],
			['[', ProductionTupleLiteral_Variable__0__List.instance, ']'],
			['[', ProductionTupleLiteral_Variable__0__List.instance, ',', ']'],
			['[', ',', ProductionTupleLiteral_Variable__0__List.instance, ']'],
			['[', ',', ProductionTupleLiteral_Variable__0__List.instance, ',', ']'],
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

class ProductionRecordLiteral_Variable__0__List extends Production {
	static readonly instance: ProductionRecordLiteral_Variable__0__List = new ProductionRecordLiteral_Variable__0__List();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionProperty_Variable.instance],
			[ProductionRecordLiteral_Variable__0__List.instance, ',', ProductionProperty_Variable.instance],
		];
	}
}

class ProductionRecordLiteral extends Production {
	static readonly instance: ProductionRecordLiteral = new ProductionRecordLiteral();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['@', '[', ProductionRecordLiteral__0__List.instance, ']'],
			['@', '[', ProductionRecordLiteral__0__List.instance, ',', ']'],
			['@', '[', ',', ProductionRecordLiteral__0__List.instance, ']'],
			['@', '[', ',', ProductionRecordLiteral__0__List.instance, ',', ']'],
		];
	}
}

class ProductionRecordLiteral_Variable extends Production {
	static readonly instance: ProductionRecordLiteral_Variable = new ProductionRecordLiteral_Variable();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['[', ProductionRecordLiteral_Variable__0__List.instance, ']'],
			['[', ProductionRecordLiteral_Variable__0__List.instance, ',', ']'],
			['[', ',', ProductionRecordLiteral_Variable__0__List.instance, ']'],
			['[', ',', ProductionRecordLiteral_Variable__0__List.instance, ',', ']'],
		];
	}
}

class ProductionSetLiteral extends Production {
	static readonly instance: ProductionSetLiteral = new ProductionSetLiteral();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['{', '}'],
			['{', ProductionTupleLiteral_Variable__0__List.instance, '}'],
			['{', ProductionTupleLiteral_Variable__0__List.instance, ',', '}'],
			['{', ',', ProductionTupleLiteral_Variable__0__List.instance, '}'],
			['{', ',', ProductionTupleLiteral_Variable__0__List.instance, ',', '}'],
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
			['(', ProductionTupleLiteral_Variable__0__List.instance, ')'],
			['(', ProductionTupleLiteral_Variable__0__List.instance, ',', ')'],
			['(', ',', ProductionTupleLiteral_Variable__0__List.instance, ')'],
			['(', ',', ProductionTupleLiteral_Variable__0__List.instance, ',', ')'],
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
			['(', ProductionExpression.instance, ')'],
		];
	}
}

class ProductionExpressionUnit_Variable extends Production {
	static readonly instance: ProductionExpressionUnit_Variable = new ProductionExpressionUnit_Variable();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[TERMINAL.TerminalIdentifier.instance],
			[ProductionPrimitiveLiteral.instance],
			[ProductionStringTemplate_Variable.instance],
			[ProductionTupleLiteral.instance],
			[ProductionRecordLiteral.instance],
			[ProductionTupleLiteral_Variable.instance],
			[ProductionRecordLiteral_Variable.instance],
			[ProductionSetLiteral.instance],
			[ProductionMapLiteral.instance],
			['(', ProductionExpression_Variable.instance, ')'],
		];
	}
}

class ProductionPropertyAccess extends Production {
	static readonly instance: ProductionPropertyAccess = new ProductionPropertyAccess();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['.', TERMINAL.TerminalInteger.instance],
			['.', ProductionWord.instance],
			['.', '[', ProductionExpression.instance, ']'],
			['?.', TERMINAL.TerminalInteger.instance],
			['?.', ProductionWord.instance],
			['?.', '[', ProductionExpression.instance, ']'],
			['!.', TERMINAL.TerminalInteger.instance],
			['!.', ProductionWord.instance],
			['!.', '[', ProductionExpression.instance, ']'],
		];
	}
}

class ProductionPropertyAccess_Variable extends Production {
	static readonly instance: ProductionPropertyAccess_Variable = new ProductionPropertyAccess_Variable();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['.', TERMINAL.TerminalInteger.instance],
			['.', ProductionWord.instance],
			['.', '[', ProductionExpression_Variable.instance, ']'],
			['?.', TERMINAL.TerminalInteger.instance],
			['?.', ProductionWord.instance],
			['?.', '[', ProductionExpression_Variable.instance, ']'],
			['!.', TERMINAL.TerminalInteger.instance],
			['!.', ProductionWord.instance],
			['!.', '[', ProductionExpression_Variable.instance, ']'],
		];
	}
}

class ProductionPropertyAssign extends Production {
	static readonly instance: ProductionPropertyAssign = new ProductionPropertyAssign();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['.', TERMINAL.TerminalInteger.instance],
			['.', ProductionWord.instance],
			['.', '[', ProductionExpression_Variable.instance, ']'],
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
			[ProductionExpressionCompound.instance, ProductionPropertyAccess.instance],
		];
	}
}

class ProductionExpressionCompound_Variable extends Production {
	static readonly instance: ProductionExpressionCompound_Variable = new ProductionExpressionCompound_Variable();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionUnit_Variable.instance],
			[ProductionExpressionCompound_Variable.instance, ProductionPropertyAccess_Variable.instance],
			[ProductionExpressionCompound_Variable.instance, ProductionFunctionCall.instance],
		];
	}
}

class ProductionAssignee extends Production {
	static readonly instance: ProductionAssignee = new ProductionAssignee();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[TERMINAL.TerminalIdentifier.instance],
			[ProductionExpressionCompound_Variable.instance, ProductionPropertyAssign.instance],
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

class ProductionExpressionUnarySymbol_Variable extends Production {
	static readonly instance: ProductionExpressionUnarySymbol_Variable = new ProductionExpressionUnarySymbol_Variable();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionCompound_Variable.instance],
			['!', ProductionExpressionUnarySymbol_Variable.instance],
			['?', ProductionExpressionUnarySymbol_Variable.instance],
			['+', ProductionExpressionUnarySymbol_Variable.instance],
			['-', ProductionExpressionUnarySymbol_Variable.instance],
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

class ProductionExpressionExponential_Variable extends Production {
	static readonly instance: ProductionExpressionExponential_Variable = new ProductionExpressionExponential_Variable();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionUnarySymbol_Variable.instance],
			[ProductionExpressionUnarySymbol_Variable.instance, '^', ProductionExpressionExponential_Variable.instance],
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

class ProductionExpressionMultiplicative_Variable extends Production {
	static readonly instance: ProductionExpressionMultiplicative_Variable = new ProductionExpressionMultiplicative_Variable();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionExponential_Variable.instance],
			[ProductionExpressionMultiplicative_Variable.instance, '*', ProductionExpressionExponential_Variable.instance],
			[ProductionExpressionMultiplicative_Variable.instance, '/', ProductionExpressionExponential_Variable.instance],
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

class ProductionExpressionAdditive_Variable extends Production {
	static readonly instance: ProductionExpressionAdditive_Variable = new ProductionExpressionAdditive_Variable();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionMultiplicative_Variable.instance],
			[ProductionExpressionAdditive_Variable.instance, '+', ProductionExpressionMultiplicative_Variable.instance],
			[ProductionExpressionAdditive_Variable.instance, '-', ProductionExpressionMultiplicative_Variable.instance],
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

class ProductionExpressionComparative_Variable extends Production {
	static readonly instance: ProductionExpressionComparative_Variable = new ProductionExpressionComparative_Variable();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionAdditive_Variable.instance],
			[ProductionExpressionComparative_Variable.instance, '<', ProductionExpressionAdditive_Variable.instance],
			[ProductionExpressionComparative_Variable.instance, '>', ProductionExpressionAdditive_Variable.instance],
			[ProductionExpressionComparative_Variable.instance, '<=', ProductionExpressionAdditive_Variable.instance],
			[ProductionExpressionComparative_Variable.instance, '>=', ProductionExpressionAdditive_Variable.instance],
			[ProductionExpressionComparative_Variable.instance, '!<', ProductionExpressionAdditive_Variable.instance],
			[ProductionExpressionComparative_Variable.instance, '!>', ProductionExpressionAdditive_Variable.instance],
			[ProductionExpressionComparative_Variable.instance, 'is', ProductionExpressionAdditive_Variable.instance],
			[ProductionExpressionComparative_Variable.instance, 'isnt', ProductionExpressionAdditive_Variable.instance],
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

class ProductionExpressionEquality_Variable extends Production {
	static readonly instance: ProductionExpressionEquality_Variable = new ProductionExpressionEquality_Variable();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionComparative_Variable.instance],
			[ProductionExpressionEquality_Variable.instance, '===', ProductionExpressionComparative_Variable.instance],
			[ProductionExpressionEquality_Variable.instance, '!==', ProductionExpressionComparative_Variable.instance],
			[ProductionExpressionEquality_Variable.instance, '==', ProductionExpressionComparative_Variable.instance],
			[ProductionExpressionEquality_Variable.instance, '!=', ProductionExpressionComparative_Variable.instance],
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

class ProductionExpressionConjunctive_Variable extends Production {
	static readonly instance: ProductionExpressionConjunctive_Variable = new ProductionExpressionConjunctive_Variable();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionEquality_Variable.instance],
			[ProductionExpressionConjunctive_Variable.instance, '&&', ProductionExpressionEquality_Variable.instance],
			[ProductionExpressionConjunctive_Variable.instance, '!&', ProductionExpressionEquality_Variable.instance],
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

class ProductionExpressionDisjunctive_Variable extends Production {
	static readonly instance: ProductionExpressionDisjunctive_Variable = new ProductionExpressionDisjunctive_Variable();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionConjunctive_Variable.instance],
			[ProductionExpressionDisjunctive_Variable.instance, '||', ProductionExpressionConjunctive_Variable.instance],
			[ProductionExpressionDisjunctive_Variable.instance, '!|', ProductionExpressionConjunctive_Variable.instance],
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

class ProductionExpressionConditional_Variable extends Production {
	static readonly instance: ProductionExpressionConditional_Variable = new ProductionExpressionConditional_Variable();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['if', ProductionExpression_Variable.instance, 'then', ProductionExpression_Variable.instance, 'else', ProductionExpression_Variable.instance],
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

class ProductionExpression_Variable extends Production {
	static readonly instance: ProductionExpression_Variable = new ProductionExpression_Variable();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionDisjunctive_Variable.instance],
			[ProductionExpressionConditional_Variable.instance],
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
			['let', TERMINAL.TerminalIdentifier.instance, ':', ProductionType.instance, '=', ProductionExpression_Variable.instance, ';'],
			['let', 'unfixed', TERMINAL.TerminalIdentifier.instance, ':', ProductionType.instance, '=', ProductionExpression_Variable.instance, ';'],
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
			[ProductionAssignee.instance, '=', ProductionExpression_Variable.instance, ';'],
		];
	}
}

class ProductionStatement extends Production {
	static readonly instance: ProductionStatement = new ProductionStatement();
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[';'],
			[ProductionExpression_Variable.instance, ';'],
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

export abstract class ParseNodeStringTemplate$__0__List extends ParseNode {
	declare readonly children:
		| readonly [Token]
		| readonly [ParseNodeStringTemplate__0__List, Token]
		| readonly [Token, ParseNodeExpression]
		| readonly [ParseNodeStringTemplate__0__List, Token, ParseNodeExpression]
		| readonly [Token]
		| readonly [ParseNodeStringTemplate_Variable__0__List, Token]
		| readonly [Token, ParseNodeExpression_Variable]
		| readonly [ParseNodeStringTemplate_Variable__0__List, Token, ParseNodeExpression_Variable]
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

export class ParseNodeStringTemplate_Variable__0__List extends ParseNodeStringTemplate$__0__List {
	declare readonly children:
		| readonly [Token]
		| readonly [ParseNodeStringTemplate_Variable__0__List, Token]
		| readonly [Token, ParseNodeExpression_Variable]
		| readonly [ParseNodeStringTemplate_Variable__0__List, Token, ParseNodeExpression_Variable]
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
		| readonly [Token, ParseNodeStringTemplate_Variable__0__List, Token]
		| readonly [Token, ParseNodeExpression_Variable, Token]
		| readonly [Token, ParseNodeExpression_Variable, ParseNodeStringTemplate_Variable__0__List, Token]
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

export class ParseNodeStringTemplate_Variable extends ParseNodeStringTemplate$ {
	declare readonly children:
		| readonly [Token]
		| readonly [Token, Token]
		| readonly [Token, ParseNodeStringTemplate_Variable__0__List, Token]
		| readonly [Token, ParseNodeExpression_Variable, Token]
		| readonly [Token, ParseNodeExpression_Variable, ParseNodeStringTemplate_Variable__0__List, Token]
	;
}

export abstract class ParseNodeProperty$ extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeWord, Token, ParseNodeExpression]
		| readonly [ParseNodeWord, Token, ParseNodeExpression_Variable]
	;
}

export class ParseNodeProperty extends ParseNodeProperty$ {
	declare readonly children:
		| readonly [ParseNodeWord, Token, ParseNodeExpression]
	;
}

export class ParseNodeProperty_Variable extends ParseNodeProperty$ {
	declare readonly children:
		| readonly [ParseNodeWord, Token, ParseNodeExpression_Variable]
	;
}

export class ParseNodeCase extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeExpression_Variable, Token, ParseNodeExpression_Variable]
	;
}

export abstract class ParseNodeTupleLiteral$__0__List extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeExpression]
		| readonly [ParseNodeTupleLiteral__0__List, Token, ParseNodeExpression]
		| readonly [ParseNodeExpression_Variable]
		| readonly [ParseNodeTupleLiteral_Variable__0__List, Token, ParseNodeExpression_Variable]
	;
}

export class ParseNodeTupleLiteral__0__List extends ParseNodeTupleLiteral$__0__List {
	declare readonly children:
		| readonly [ParseNodeExpression]
		| readonly [ParseNodeTupleLiteral__0__List, Token, ParseNodeExpression]
	;
}

export class ParseNodeTupleLiteral_Variable__0__List extends ParseNodeTupleLiteral$__0__List {
	declare readonly children:
		| readonly [ParseNodeExpression_Variable]
		| readonly [ParseNodeTupleLiteral_Variable__0__List, Token, ParseNodeExpression_Variable]
	;
}

export abstract class ParseNodeTupleLiteral$ extends ParseNode {
	declare readonly children:
		| readonly [Token, Token, Token]
		| readonly [Token, Token, ParseNodeTupleLiteral__0__List, Token]
		| readonly [Token, Token, ParseNodeTupleLiteral__0__List, Token, Token]
		| readonly [Token, Token, Token, ParseNodeTupleLiteral__0__List, Token]
		| readonly [Token, Token, Token, ParseNodeTupleLiteral__0__List, Token, Token]
		| readonly [Token, Token]
		| readonly [Token, ParseNodeTupleLiteral_Variable__0__List, Token]
		| readonly [Token, ParseNodeTupleLiteral_Variable__0__List, Token, Token]
		| readonly [Token, Token, ParseNodeTupleLiteral_Variable__0__List, Token]
		| readonly [Token, Token, ParseNodeTupleLiteral_Variable__0__List, Token, Token]
	;
}

export class ParseNodeTupleLiteral extends ParseNodeTupleLiteral$ {
	declare readonly children:
		| readonly [Token, Token, Token]
		| readonly [Token, Token, ParseNodeTupleLiteral__0__List, Token]
		| readonly [Token, Token, ParseNodeTupleLiteral__0__List, Token, Token]
		| readonly [Token, Token, Token, ParseNodeTupleLiteral__0__List, Token]
		| readonly [Token, Token, Token, ParseNodeTupleLiteral__0__List, Token, Token]
	;
}

export class ParseNodeTupleLiteral_Variable extends ParseNodeTupleLiteral$ {
	declare readonly children:
		| readonly [Token, Token]
		| readonly [Token, ParseNodeTupleLiteral_Variable__0__List, Token]
		| readonly [Token, ParseNodeTupleLiteral_Variable__0__List, Token, Token]
		| readonly [Token, Token, ParseNodeTupleLiteral_Variable__0__List, Token]
		| readonly [Token, Token, ParseNodeTupleLiteral_Variable__0__List, Token, Token]
	;
}

export abstract class ParseNodeRecordLiteral$__0__List extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeProperty]
		| readonly [ParseNodeRecordLiteral__0__List, Token, ParseNodeProperty]
		| readonly [ParseNodeProperty_Variable]
		| readonly [ParseNodeRecordLiteral_Variable__0__List, Token, ParseNodeProperty_Variable]
	;
}

export class ParseNodeRecordLiteral__0__List extends ParseNodeRecordLiteral$__0__List {
	declare readonly children:
		| readonly [ParseNodeProperty]
		| readonly [ParseNodeRecordLiteral__0__List, Token, ParseNodeProperty]
	;
}

export class ParseNodeRecordLiteral_Variable__0__List extends ParseNodeRecordLiteral$__0__List {
	declare readonly children:
		| readonly [ParseNodeProperty_Variable]
		| readonly [ParseNodeRecordLiteral_Variable__0__List, Token, ParseNodeProperty_Variable]
	;
}

export abstract class ParseNodeRecordLiteral$ extends ParseNode {
	declare readonly children:
		| readonly [Token, Token, ParseNodeRecordLiteral__0__List, Token]
		| readonly [Token, Token, ParseNodeRecordLiteral__0__List, Token, Token]
		| readonly [Token, Token, Token, ParseNodeRecordLiteral__0__List, Token]
		| readonly [Token, Token, Token, ParseNodeRecordLiteral__0__List, Token, Token]
		| readonly [Token, ParseNodeRecordLiteral_Variable__0__List, Token]
		| readonly [Token, ParseNodeRecordLiteral_Variable__0__List, Token, Token]
		| readonly [Token, Token, ParseNodeRecordLiteral_Variable__0__List, Token]
		| readonly [Token, Token, ParseNodeRecordLiteral_Variable__0__List, Token, Token]
	;
}

export class ParseNodeRecordLiteral extends ParseNodeRecordLiteral$ {
	declare readonly children:
		| readonly [Token, Token, ParseNodeRecordLiteral__0__List, Token]
		| readonly [Token, Token, ParseNodeRecordLiteral__0__List, Token, Token]
		| readonly [Token, Token, Token, ParseNodeRecordLiteral__0__List, Token]
		| readonly [Token, Token, Token, ParseNodeRecordLiteral__0__List, Token, Token]
	;
}

export class ParseNodeRecordLiteral_Variable extends ParseNodeRecordLiteral$ {
	declare readonly children:
		| readonly [Token, ParseNodeRecordLiteral_Variable__0__List, Token]
		| readonly [Token, ParseNodeRecordLiteral_Variable__0__List, Token, Token]
		| readonly [Token, Token, ParseNodeRecordLiteral_Variable__0__List, Token]
		| readonly [Token, Token, ParseNodeRecordLiteral_Variable__0__List, Token, Token]
	;
}

export class ParseNodeSetLiteral extends ParseNode {
	declare readonly children:
		| readonly [Token, Token]
		| readonly [Token, ParseNodeTupleLiteral_Variable__0__List, Token]
		| readonly [Token, ParseNodeTupleLiteral_Variable__0__List, Token, Token]
		| readonly [Token, Token, ParseNodeTupleLiteral_Variable__0__List, Token]
		| readonly [Token, Token, ParseNodeTupleLiteral_Variable__0__List, Token, Token]
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
		| readonly [Token, ParseNodeTupleLiteral_Variable__0__List, Token]
		| readonly [Token, ParseNodeTupleLiteral_Variable__0__List, Token, Token]
		| readonly [Token, Token, ParseNodeTupleLiteral_Variable__0__List, Token]
		| readonly [Token, Token, ParseNodeTupleLiteral_Variable__0__List, Token, Token]
	;
}

export abstract class ParseNodeExpressionUnit$ extends ParseNode {
	declare readonly children:
		| readonly [ParseNodePrimitiveLiteral]
		| readonly [ParseNodeStringTemplate]
		| readonly [ParseNodeTupleLiteral]
		| readonly [ParseNodeRecordLiteral]
		| readonly [Token, ParseNodeExpression, Token]
		| readonly [Token]
		| readonly [ParseNodePrimitiveLiteral]
		| readonly [ParseNodeStringTemplate_Variable]
		| readonly [ParseNodeTupleLiteral]
		| readonly [ParseNodeRecordLiteral]
		| readonly [ParseNodeTupleLiteral_Variable]
		| readonly [ParseNodeRecordLiteral_Variable]
		| readonly [ParseNodeSetLiteral]
		| readonly [ParseNodeMapLiteral]
		| readonly [Token, ParseNodeExpression_Variable, Token]
	;
}

export class ParseNodeExpressionUnit extends ParseNodeExpressionUnit$ {
	declare readonly children:
		| readonly [ParseNodePrimitiveLiteral]
		| readonly [ParseNodeStringTemplate]
		| readonly [ParseNodeTupleLiteral]
		| readonly [ParseNodeRecordLiteral]
		| readonly [Token, ParseNodeExpression, Token]
	;
}

export class ParseNodeExpressionUnit_Variable extends ParseNodeExpressionUnit$ {
	declare readonly children:
		| readonly [Token]
		| readonly [ParseNodePrimitiveLiteral]
		| readonly [ParseNodeStringTemplate_Variable]
		| readonly [ParseNodeTupleLiteral]
		| readonly [ParseNodeRecordLiteral]
		| readonly [ParseNodeTupleLiteral_Variable]
		| readonly [ParseNodeRecordLiteral_Variable]
		| readonly [ParseNodeSetLiteral]
		| readonly [ParseNodeMapLiteral]
		| readonly [Token, ParseNodeExpression_Variable, Token]
	;
}

export abstract class ParseNodePropertyAccess$ extends ParseNode {
	declare readonly children:
		| readonly [Token, Token]
		| readonly [Token, ParseNodeWord]
		| readonly [Token, Token, ParseNodeExpression, Token]
		| readonly [Token, Token]
		| readonly [Token, ParseNodeWord]
		| readonly [Token, Token, ParseNodeExpression, Token]
		| readonly [Token, Token]
		| readonly [Token, ParseNodeWord]
		| readonly [Token, Token, ParseNodeExpression, Token]
		| readonly [Token, Token]
		| readonly [Token, ParseNodeWord]
		| readonly [Token, Token, ParseNodeExpression_Variable, Token]
		| readonly [Token, Token]
		| readonly [Token, ParseNodeWord]
		| readonly [Token, Token, ParseNodeExpression_Variable, Token]
		| readonly [Token, Token]
		| readonly [Token, ParseNodeWord]
		| readonly [Token, Token, ParseNodeExpression_Variable, Token]
	;
}

export class ParseNodePropertyAccess extends ParseNodePropertyAccess$ {
	declare readonly children:
		| readonly [Token, Token]
		| readonly [Token, ParseNodeWord]
		| readonly [Token, Token, ParseNodeExpression, Token]
		| readonly [Token, Token]
		| readonly [Token, ParseNodeWord]
		| readonly [Token, Token, ParseNodeExpression, Token]
		| readonly [Token, Token]
		| readonly [Token, ParseNodeWord]
		| readonly [Token, Token, ParseNodeExpression, Token]
	;
}

export class ParseNodePropertyAccess_Variable extends ParseNodePropertyAccess$ {
	declare readonly children:
		| readonly [Token, Token]
		| readonly [Token, ParseNodeWord]
		| readonly [Token, Token, ParseNodeExpression_Variable, Token]
		| readonly [Token, Token]
		| readonly [Token, ParseNodeWord]
		| readonly [Token, Token, ParseNodeExpression_Variable, Token]
		| readonly [Token, Token]
		| readonly [Token, ParseNodeWord]
		| readonly [Token, Token, ParseNodeExpression_Variable, Token]
	;
}

export class ParseNodePropertyAssign extends ParseNode {
	declare readonly children:
		| readonly [Token, Token]
		| readonly [Token, ParseNodeWord]
		| readonly [Token, Token, ParseNodeExpression_Variable, Token]
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
		| readonly [ParseNodeExpressionCompound, ParseNodePropertyAccess]
		| readonly [ParseNodeExpressionUnit_Variable]
		| readonly [ParseNodeExpressionCompound_Variable, ParseNodePropertyAccess_Variable]
		| readonly [ParseNodeExpressionCompound_Variable, ParseNodeFunctionCall]
	;
}

export class ParseNodeExpressionCompound extends ParseNodeExpressionCompound$ {
	declare readonly children:
		| readonly [ParseNodeExpressionUnit]
		| readonly [ParseNodeExpressionCompound, ParseNodePropertyAccess]
	;
}

export class ParseNodeExpressionCompound_Variable extends ParseNodeExpressionCompound$ {
	declare readonly children:
		| readonly [ParseNodeExpressionUnit_Variable]
		| readonly [ParseNodeExpressionCompound_Variable, ParseNodePropertyAccess_Variable]
		| readonly [ParseNodeExpressionCompound_Variable, ParseNodeFunctionCall]
	;
}

export class ParseNodeAssignee extends ParseNode {
	declare readonly children:
		| readonly [Token]
		| readonly [ParseNodeExpressionCompound_Variable, ParseNodePropertyAssign]
	;
}

export abstract class ParseNodeExpressionUnarySymbol$ extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeExpressionCompound]
		| readonly [Token, ParseNodeExpressionUnarySymbol]
		| readonly [Token, ParseNodeExpressionUnarySymbol]
		| readonly [Token, ParseNodeExpressionUnarySymbol]
		| readonly [Token, ParseNodeExpressionUnarySymbol]
		| readonly [ParseNodeExpressionCompound_Variable]
		| readonly [Token, ParseNodeExpressionUnarySymbol_Variable]
		| readonly [Token, ParseNodeExpressionUnarySymbol_Variable]
		| readonly [Token, ParseNodeExpressionUnarySymbol_Variable]
		| readonly [Token, ParseNodeExpressionUnarySymbol_Variable]
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

export class ParseNodeExpressionUnarySymbol_Variable extends ParseNodeExpressionUnarySymbol$ {
	declare readonly children:
		| readonly [ParseNodeExpressionCompound_Variable]
		| readonly [Token, ParseNodeExpressionUnarySymbol_Variable]
		| readonly [Token, ParseNodeExpressionUnarySymbol_Variable]
		| readonly [Token, ParseNodeExpressionUnarySymbol_Variable]
		| readonly [Token, ParseNodeExpressionUnarySymbol_Variable]
	;
}

export abstract class ParseNodeExpressionExponential$ extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeExpressionUnarySymbol]
		| readonly [ParseNodeExpressionUnarySymbol, Token, ParseNodeExpressionExponential]
		| readonly [ParseNodeExpressionUnarySymbol_Variable]
		| readonly [ParseNodeExpressionUnarySymbol_Variable, Token, ParseNodeExpressionExponential_Variable]
	;
}

export class ParseNodeExpressionExponential extends ParseNodeExpressionExponential$ {
	declare readonly children:
		| readonly [ParseNodeExpressionUnarySymbol]
		| readonly [ParseNodeExpressionUnarySymbol, Token, ParseNodeExpressionExponential]
	;
}

export class ParseNodeExpressionExponential_Variable extends ParseNodeExpressionExponential$ {
	declare readonly children:
		| readonly [ParseNodeExpressionUnarySymbol_Variable]
		| readonly [ParseNodeExpressionUnarySymbol_Variable, Token, ParseNodeExpressionExponential_Variable]
	;
}

export abstract class ParseNodeExpressionMultiplicative$ extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeExpressionExponential]
		| readonly [ParseNodeExpressionMultiplicative, Token, ParseNodeExpressionExponential]
		| readonly [ParseNodeExpressionMultiplicative, Token, ParseNodeExpressionExponential]
		| readonly [ParseNodeExpressionExponential_Variable]
		| readonly [ParseNodeExpressionMultiplicative_Variable, Token, ParseNodeExpressionExponential_Variable]
		| readonly [ParseNodeExpressionMultiplicative_Variable, Token, ParseNodeExpressionExponential_Variable]
	;
}

export class ParseNodeExpressionMultiplicative extends ParseNodeExpressionMultiplicative$ {
	declare readonly children:
		| readonly [ParseNodeExpressionExponential]
		| readonly [ParseNodeExpressionMultiplicative, Token, ParseNodeExpressionExponential]
		| readonly [ParseNodeExpressionMultiplicative, Token, ParseNodeExpressionExponential]
	;
}

export class ParseNodeExpressionMultiplicative_Variable extends ParseNodeExpressionMultiplicative$ {
	declare readonly children:
		| readonly [ParseNodeExpressionExponential_Variable]
		| readonly [ParseNodeExpressionMultiplicative_Variable, Token, ParseNodeExpressionExponential_Variable]
		| readonly [ParseNodeExpressionMultiplicative_Variable, Token, ParseNodeExpressionExponential_Variable]
	;
}

export abstract class ParseNodeExpressionAdditive$ extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeExpressionMultiplicative]
		| readonly [ParseNodeExpressionAdditive, Token, ParseNodeExpressionMultiplicative]
		| readonly [ParseNodeExpressionAdditive, Token, ParseNodeExpressionMultiplicative]
		| readonly [ParseNodeExpressionMultiplicative_Variable]
		| readonly [ParseNodeExpressionAdditive_Variable, Token, ParseNodeExpressionMultiplicative_Variable]
		| readonly [ParseNodeExpressionAdditive_Variable, Token, ParseNodeExpressionMultiplicative_Variable]
	;
}

export class ParseNodeExpressionAdditive extends ParseNodeExpressionAdditive$ {
	declare readonly children:
		| readonly [ParseNodeExpressionMultiplicative]
		| readonly [ParseNodeExpressionAdditive, Token, ParseNodeExpressionMultiplicative]
		| readonly [ParseNodeExpressionAdditive, Token, ParseNodeExpressionMultiplicative]
	;
}

export class ParseNodeExpressionAdditive_Variable extends ParseNodeExpressionAdditive$ {
	declare readonly children:
		| readonly [ParseNodeExpressionMultiplicative_Variable]
		| readonly [ParseNodeExpressionAdditive_Variable, Token, ParseNodeExpressionMultiplicative_Variable]
		| readonly [ParseNodeExpressionAdditive_Variable, Token, ParseNodeExpressionMultiplicative_Variable]
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
		| readonly [ParseNodeExpressionAdditive_Variable]
		| readonly [ParseNodeExpressionComparative_Variable, Token, ParseNodeExpressionAdditive_Variable]
		| readonly [ParseNodeExpressionComparative_Variable, Token, ParseNodeExpressionAdditive_Variable]
		| readonly [ParseNodeExpressionComparative_Variable, Token, ParseNodeExpressionAdditive_Variable]
		| readonly [ParseNodeExpressionComparative_Variable, Token, ParseNodeExpressionAdditive_Variable]
		| readonly [ParseNodeExpressionComparative_Variable, Token, ParseNodeExpressionAdditive_Variable]
		| readonly [ParseNodeExpressionComparative_Variable, Token, ParseNodeExpressionAdditive_Variable]
		| readonly [ParseNodeExpressionComparative_Variable, Token, ParseNodeExpressionAdditive_Variable]
		| readonly [ParseNodeExpressionComparative_Variable, Token, ParseNodeExpressionAdditive_Variable]
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

export class ParseNodeExpressionComparative_Variable extends ParseNodeExpressionComparative$ {
	declare readonly children:
		| readonly [ParseNodeExpressionAdditive_Variable]
		| readonly [ParseNodeExpressionComparative_Variable, Token, ParseNodeExpressionAdditive_Variable]
		| readonly [ParseNodeExpressionComparative_Variable, Token, ParseNodeExpressionAdditive_Variable]
		| readonly [ParseNodeExpressionComparative_Variable, Token, ParseNodeExpressionAdditive_Variable]
		| readonly [ParseNodeExpressionComparative_Variable, Token, ParseNodeExpressionAdditive_Variable]
		| readonly [ParseNodeExpressionComparative_Variable, Token, ParseNodeExpressionAdditive_Variable]
		| readonly [ParseNodeExpressionComparative_Variable, Token, ParseNodeExpressionAdditive_Variable]
		| readonly [ParseNodeExpressionComparative_Variable, Token, ParseNodeExpressionAdditive_Variable]
		| readonly [ParseNodeExpressionComparative_Variable, Token, ParseNodeExpressionAdditive_Variable]
	;
}

export abstract class ParseNodeExpressionEquality$ extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeExpressionComparative]
		| readonly [ParseNodeExpressionEquality, Token, ParseNodeExpressionComparative]
		| readonly [ParseNodeExpressionEquality, Token, ParseNodeExpressionComparative]
		| readonly [ParseNodeExpressionEquality, Token, ParseNodeExpressionComparative]
		| readonly [ParseNodeExpressionEquality, Token, ParseNodeExpressionComparative]
		| readonly [ParseNodeExpressionComparative_Variable]
		| readonly [ParseNodeExpressionEquality_Variable, Token, ParseNodeExpressionComparative_Variable]
		| readonly [ParseNodeExpressionEquality_Variable, Token, ParseNodeExpressionComparative_Variable]
		| readonly [ParseNodeExpressionEquality_Variable, Token, ParseNodeExpressionComparative_Variable]
		| readonly [ParseNodeExpressionEquality_Variable, Token, ParseNodeExpressionComparative_Variable]
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

export class ParseNodeExpressionEquality_Variable extends ParseNodeExpressionEquality$ {
	declare readonly children:
		| readonly [ParseNodeExpressionComparative_Variable]
		| readonly [ParseNodeExpressionEquality_Variable, Token, ParseNodeExpressionComparative_Variable]
		| readonly [ParseNodeExpressionEquality_Variable, Token, ParseNodeExpressionComparative_Variable]
		| readonly [ParseNodeExpressionEquality_Variable, Token, ParseNodeExpressionComparative_Variable]
		| readonly [ParseNodeExpressionEquality_Variable, Token, ParseNodeExpressionComparative_Variable]
	;
}

export abstract class ParseNodeExpressionConjunctive$ extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeExpressionEquality]
		| readonly [ParseNodeExpressionConjunctive, Token, ParseNodeExpressionEquality]
		| readonly [ParseNodeExpressionConjunctive, Token, ParseNodeExpressionEquality]
		| readonly [ParseNodeExpressionEquality_Variable]
		| readonly [ParseNodeExpressionConjunctive_Variable, Token, ParseNodeExpressionEquality_Variable]
		| readonly [ParseNodeExpressionConjunctive_Variable, Token, ParseNodeExpressionEquality_Variable]
	;
}

export class ParseNodeExpressionConjunctive extends ParseNodeExpressionConjunctive$ {
	declare readonly children:
		| readonly [ParseNodeExpressionEquality]
		| readonly [ParseNodeExpressionConjunctive, Token, ParseNodeExpressionEquality]
		| readonly [ParseNodeExpressionConjunctive, Token, ParseNodeExpressionEquality]
	;
}

export class ParseNodeExpressionConjunctive_Variable extends ParseNodeExpressionConjunctive$ {
	declare readonly children:
		| readonly [ParseNodeExpressionEquality_Variable]
		| readonly [ParseNodeExpressionConjunctive_Variable, Token, ParseNodeExpressionEquality_Variable]
		| readonly [ParseNodeExpressionConjunctive_Variable, Token, ParseNodeExpressionEquality_Variable]
	;
}

export abstract class ParseNodeExpressionDisjunctive$ extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeExpressionConjunctive]
		| readonly [ParseNodeExpressionDisjunctive, Token, ParseNodeExpressionConjunctive]
		| readonly [ParseNodeExpressionDisjunctive, Token, ParseNodeExpressionConjunctive]
		| readonly [ParseNodeExpressionConjunctive_Variable]
		| readonly [ParseNodeExpressionDisjunctive_Variable, Token, ParseNodeExpressionConjunctive_Variable]
		| readonly [ParseNodeExpressionDisjunctive_Variable, Token, ParseNodeExpressionConjunctive_Variable]
	;
}

export class ParseNodeExpressionDisjunctive extends ParseNodeExpressionDisjunctive$ {
	declare readonly children:
		| readonly [ParseNodeExpressionConjunctive]
		| readonly [ParseNodeExpressionDisjunctive, Token, ParseNodeExpressionConjunctive]
		| readonly [ParseNodeExpressionDisjunctive, Token, ParseNodeExpressionConjunctive]
	;
}

export class ParseNodeExpressionDisjunctive_Variable extends ParseNodeExpressionDisjunctive$ {
	declare readonly children:
		| readonly [ParseNodeExpressionConjunctive_Variable]
		| readonly [ParseNodeExpressionDisjunctive_Variable, Token, ParseNodeExpressionConjunctive_Variable]
		| readonly [ParseNodeExpressionDisjunctive_Variable, Token, ParseNodeExpressionConjunctive_Variable]
	;
}

export abstract class ParseNodeExpressionConditional$ extends ParseNode {
	declare readonly children:
		| readonly [Token, ParseNodeExpression, Token, ParseNodeExpression, Token, ParseNodeExpression]
		| readonly [Token, ParseNodeExpression_Variable, Token, ParseNodeExpression_Variable, Token, ParseNodeExpression_Variable]
	;
}

export class ParseNodeExpressionConditional extends ParseNodeExpressionConditional$ {
	declare readonly children:
		| readonly [Token, ParseNodeExpression, Token, ParseNodeExpression, Token, ParseNodeExpression]
	;
}

export class ParseNodeExpressionConditional_Variable extends ParseNodeExpressionConditional$ {
	declare readonly children:
		| readonly [Token, ParseNodeExpression_Variable, Token, ParseNodeExpression_Variable, Token, ParseNodeExpression_Variable]
	;
}

export abstract class ParseNodeExpression$ extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeExpressionDisjunctive]
		| readonly [ParseNodeExpressionConditional]
		| readonly [ParseNodeExpressionDisjunctive_Variable]
		| readonly [ParseNodeExpressionConditional_Variable]
	;
}

export class ParseNodeExpression extends ParseNodeExpression$ {
	declare readonly children:
		| readonly [ParseNodeExpressionDisjunctive]
		| readonly [ParseNodeExpressionConditional]
	;
}

export class ParseNodeExpression_Variable extends ParseNodeExpression$ {
	declare readonly children:
		| readonly [ParseNodeExpressionDisjunctive_Variable]
		| readonly [ParseNodeExpressionConditional_Variable]
	;
}

export class ParseNodeDeclarationType extends ParseNode {
	declare readonly children:
		| readonly [Token, Token, Token, ParseNodeType, Token]
	;
}

export class ParseNodeDeclarationVariable extends ParseNode {
	declare readonly children:
		| readonly [Token, Token, Token, ParseNodeType, Token, ParseNodeExpression_Variable, Token]
		| readonly [Token, Token, Token, Token, ParseNodeType, Token, ParseNodeExpression_Variable, Token]
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
		| readonly [ParseNodeAssignee, Token, ParseNodeExpression_Variable, Token]
	;
}

export class ParseNodeStatement extends ParseNode {
	declare readonly children:
		| readonly [Token]
		| readonly [ParseNodeExpression_Variable, Token]
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
	ProductionStringTemplate_Variable__0__List.instance,
	ProductionStringTemplate.instance,
	ProductionStringTemplate_Variable.instance,
	ProductionProperty.instance,
	ProductionProperty_Variable.instance,
	ProductionCase.instance,
	ProductionTupleLiteral__0__List.instance,
	ProductionTupleLiteral_Variable__0__List.instance,
	ProductionTupleLiteral.instance,
	ProductionTupleLiteral_Variable.instance,
	ProductionRecordLiteral__0__List.instance,
	ProductionRecordLiteral_Variable__0__List.instance,
	ProductionRecordLiteral.instance,
	ProductionRecordLiteral_Variable.instance,
	ProductionSetLiteral.instance,
	ProductionMapLiteral__0__List.instance,
	ProductionMapLiteral.instance,
	ProductionFunctionArguments.instance,
	ProductionExpressionUnit.instance,
	ProductionExpressionUnit_Variable.instance,
	ProductionPropertyAccess.instance,
	ProductionPropertyAccess_Variable.instance,
	ProductionPropertyAssign.instance,
	ProductionFunctionCall.instance,
	ProductionExpressionCompound.instance,
	ProductionExpressionCompound_Variable.instance,
	ProductionAssignee.instance,
	ProductionExpressionUnarySymbol.instance,
	ProductionExpressionUnarySymbol_Variable.instance,
	ProductionExpressionExponential.instance,
	ProductionExpressionExponential_Variable.instance,
	ProductionExpressionMultiplicative.instance,
	ProductionExpressionMultiplicative_Variable.instance,
	ProductionExpressionAdditive.instance,
	ProductionExpressionAdditive_Variable.instance,
	ProductionExpressionComparative.instance,
	ProductionExpressionComparative_Variable.instance,
	ProductionExpressionEquality.instance,
	ProductionExpressionEquality_Variable.instance,
	ProductionExpressionConjunctive.instance,
	ProductionExpressionConjunctive_Variable.instance,
	ProductionExpressionDisjunctive.instance,
	ProductionExpressionDisjunctive_Variable.instance,
	ProductionExpressionConditional.instance,
	ProductionExpressionConditional_Variable.instance,
	ProductionExpression.instance,
	ProductionExpression_Variable.instance,
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
		[ProductionStringTemplate_Variable__0__List.instance, ParseNodeStringTemplate_Variable__0__List],
		[ProductionStringTemplate.instance, ParseNodeStringTemplate],
		[ProductionStringTemplate_Variable.instance, ParseNodeStringTemplate_Variable],
		[ProductionProperty.instance, ParseNodeProperty],
		[ProductionProperty_Variable.instance, ParseNodeProperty_Variable],
		[ProductionCase.instance, ParseNodeCase],
		[ProductionTupleLiteral__0__List.instance, ParseNodeTupleLiteral__0__List],
		[ProductionTupleLiteral_Variable__0__List.instance, ParseNodeTupleLiteral_Variable__0__List],
		[ProductionTupleLiteral.instance, ParseNodeTupleLiteral],
		[ProductionTupleLiteral_Variable.instance, ParseNodeTupleLiteral_Variable],
		[ProductionRecordLiteral__0__List.instance, ParseNodeRecordLiteral__0__List],
		[ProductionRecordLiteral_Variable__0__List.instance, ParseNodeRecordLiteral_Variable__0__List],
		[ProductionRecordLiteral.instance, ParseNodeRecordLiteral],
		[ProductionRecordLiteral_Variable.instance, ParseNodeRecordLiteral_Variable],
		[ProductionSetLiteral.instance, ParseNodeSetLiteral],
		[ProductionMapLiteral__0__List.instance, ParseNodeMapLiteral__0__List],
		[ProductionMapLiteral.instance, ParseNodeMapLiteral],
		[ProductionFunctionArguments.instance, ParseNodeFunctionArguments],
		[ProductionExpressionUnit.instance, ParseNodeExpressionUnit],
		[ProductionExpressionUnit_Variable.instance, ParseNodeExpressionUnit_Variable],
		[ProductionPropertyAccess.instance, ParseNodePropertyAccess],
		[ProductionPropertyAccess_Variable.instance, ParseNodePropertyAccess_Variable],
		[ProductionPropertyAssign.instance, ParseNodePropertyAssign],
		[ProductionFunctionCall.instance, ParseNodeFunctionCall],
		[ProductionExpressionCompound.instance, ParseNodeExpressionCompound],
		[ProductionExpressionCompound_Variable.instance, ParseNodeExpressionCompound_Variable],
		[ProductionAssignee.instance, ParseNodeAssignee],
		[ProductionExpressionUnarySymbol.instance, ParseNodeExpressionUnarySymbol],
		[ProductionExpressionUnarySymbol_Variable.instance, ParseNodeExpressionUnarySymbol_Variable],
		[ProductionExpressionExponential.instance, ParseNodeExpressionExponential],
		[ProductionExpressionExponential_Variable.instance, ParseNodeExpressionExponential_Variable],
		[ProductionExpressionMultiplicative.instance, ParseNodeExpressionMultiplicative],
		[ProductionExpressionMultiplicative_Variable.instance, ParseNodeExpressionMultiplicative_Variable],
		[ProductionExpressionAdditive.instance, ParseNodeExpressionAdditive],
		[ProductionExpressionAdditive_Variable.instance, ParseNodeExpressionAdditive_Variable],
		[ProductionExpressionComparative.instance, ParseNodeExpressionComparative],
		[ProductionExpressionComparative_Variable.instance, ParseNodeExpressionComparative_Variable],
		[ProductionExpressionEquality.instance, ParseNodeExpressionEquality],
		[ProductionExpressionEquality_Variable.instance, ParseNodeExpressionEquality_Variable],
		[ProductionExpressionConjunctive.instance, ParseNodeExpressionConjunctive],
		[ProductionExpressionConjunctive_Variable.instance, ParseNodeExpressionConjunctive_Variable],
		[ProductionExpressionDisjunctive.instance, ParseNodeExpressionDisjunctive],
		[ProductionExpressionDisjunctive_Variable.instance, ParseNodeExpressionDisjunctive_Variable],
		[ProductionExpressionConditional.instance, ParseNodeExpressionConditional],
		[ProductionExpressionConditional_Variable.instance, ParseNodeExpressionConditional_Variable],
		[ProductionExpression.instance, ParseNodeExpression],
		[ProductionExpression_Variable.instance, ParseNodeExpression_Variable],
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


