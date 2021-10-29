
/*----------------------------------------------------------------/
| WARNING: Do not manually update this file!
| It is auto-generated via <@chharvey/parser>.
| If you need to make updates, make them there.
/----------------------------------------------------------------*/
import {
	NonemptyArray,
	SolidConfig,
	CONFIG_DEFAULT,
} from './package.js';
import {Production} from './Production.js';
import {
	Grammar,
	GrammarSymbol,
} from './Grammar.js';
import type {Token} from './Token.js';
import {ParseNode} from './ParseNode.js';
import {Parser} from './Parser.js';
import {LexerSolid, LEXER} from './LexerSolid.js';
import * as TERMINAL from './terminal/index.js';

export class ProductionWord extends Production {
	static readonly instance: ProductionWord = new ProductionWord();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[TERMINAL.TerminalKeyword.instance],
			[TERMINAL.TerminalIdentifier.instance],
		];
	}
}

export class ProductionPrimitiveLiteral extends Production {
	static readonly instance: ProductionPrimitiveLiteral = new ProductionPrimitiveLiteral();
	/** @implements Production */
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

export class ProductionTypeKeyword extends Production {
	static readonly instance: ProductionTypeKeyword = new ProductionTypeKeyword();
	/** @implements Production */
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

export class ProductionEntryType extends Production {
	static readonly instance: ProductionEntryType = new ProductionEntryType();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionType.instance],
		];
	}
}

export class ProductionEntryType_Optional extends Production {
	static readonly instance: ProductionEntryType_Optional = new ProductionEntryType_Optional();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['?:', ProductionType.instance],
		];
	}
}

export class ProductionEntryType_Named extends Production {
	static readonly instance: ProductionEntryType_Named = new ProductionEntryType_Named();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionWord.instance, ':', ProductionType.instance],
		];
	}
}

export class ProductionEntryType_Named_Optional extends Production {
	static readonly instance: ProductionEntryType_Named_Optional = new ProductionEntryType_Named_Optional();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionWord.instance, '?:', ProductionType.instance],
		];
	}
}

export class ProductionItemsType__0__List extends Production {
	static readonly instance: ProductionItemsType__0__List = new ProductionItemsType__0__List();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionEntryType.instance],
			[ProductionItemsType__0__List.instance, ',', ProductionEntryType.instance],
		];
	}
}

export class ProductionItemsType__1__List extends Production {
	static readonly instance: ProductionItemsType__1__List = new ProductionItemsType__1__List();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionEntryType_Optional.instance],
			[ProductionItemsType__1__List.instance, ',', ProductionEntryType_Optional.instance],
		];
	}
}

export class ProductionItemsType extends Production {
	static readonly instance: ProductionItemsType = new ProductionItemsType();
	/** @implements Production */
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

export class ProductionPropertiesType__0__List extends Production {
	static readonly instance: ProductionPropertiesType__0__List = new ProductionPropertiesType__0__List();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionEntryType_Named.instance],
			[ProductionPropertiesType__0__List.instance, ',', ProductionEntryType_Named.instance],
			[ProductionEntryType_Named_Optional.instance],
			[ProductionPropertiesType__0__List.instance, ',', ProductionEntryType_Named_Optional.instance],
		];
	}
}

export class ProductionPropertiesType extends Production {
	static readonly instance: ProductionPropertiesType = new ProductionPropertiesType();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionPropertiesType__0__List.instance],
			[ProductionPropertiesType__0__List.instance, ','],
		];
	}
}

export class ProductionTypeTupleLiteral extends Production {
	static readonly instance: ProductionTypeTupleLiteral = new ProductionTypeTupleLiteral();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['[', ']'],
			['[', ProductionItemsType.instance, ']'],
			['[', ',', ProductionItemsType.instance, ']'],
		];
	}
}

export class ProductionTypeRecordLiteral extends Production {
	static readonly instance: ProductionTypeRecordLiteral = new ProductionTypeRecordLiteral();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['[', ProductionPropertiesType.instance, ']'],
			['[', ',', ProductionPropertiesType.instance, ']'],
		];
	}
}

export class ProductionTypeHashLiteral extends Production {
	static readonly instance: ProductionTypeHashLiteral = new ProductionTypeHashLiteral();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['[', ':', ProductionType.instance, ']'],
		];
	}
}

export class ProductionTypeMapLiteral extends Production {
	static readonly instance: ProductionTypeMapLiteral = new ProductionTypeMapLiteral();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['{', ProductionType.instance, '->', ProductionType.instance, '}'],
		];
	}
}

export class ProductionGenericArguments__0__List extends Production {
	static readonly instance: ProductionGenericArguments__0__List = new ProductionGenericArguments__0__List();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionType.instance],
			[ProductionGenericArguments__0__List.instance, ',', ProductionType.instance],
		];
	}
}

export class ProductionGenericArguments extends Production {
	static readonly instance: ProductionGenericArguments = new ProductionGenericArguments();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['<', ProductionGenericArguments__0__List.instance, '>'],
			['<', ProductionGenericArguments__0__List.instance, ',', '>'],
			['<', ',', ProductionGenericArguments__0__List.instance, '>'],
			['<', ',', ProductionGenericArguments__0__List.instance, ',', '>'],
		];
	}
}

export class ProductionTypeUnit extends Production {
	static readonly instance: ProductionTypeUnit = new ProductionTypeUnit();
	/** @implements Production */
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

export class ProductionPropertyAccessType extends Production {
	static readonly instance: ProductionPropertyAccessType = new ProductionPropertyAccessType();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['.', TERMINAL.TerminalInteger.instance],
			['.', ProductionWord.instance],
		];
	}
}

export class ProductionGenericCall extends Production {
	static readonly instance: ProductionGenericCall = new ProductionGenericCall();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['.', ProductionGenericArguments.instance],
		];
	}
}

export class ProductionTypeCompound extends Production {
	static readonly instance: ProductionTypeCompound = new ProductionTypeCompound();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionTypeUnit.instance],
			[ProductionTypeCompound.instance, ProductionPropertyAccessType.instance],
			[ProductionTypeCompound.instance, ProductionGenericCall.instance],
		];
	}
}

export class ProductionTypeUnarySymbol extends Production {
	static readonly instance: ProductionTypeUnarySymbol = new ProductionTypeUnarySymbol();
	/** @implements Production */
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

export class ProductionTypeUnaryKeyword extends Production {
	static readonly instance: ProductionTypeUnaryKeyword = new ProductionTypeUnaryKeyword();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionTypeUnarySymbol.instance],
			['mutable', ProductionTypeUnaryKeyword.instance],
		];
	}
}

export class ProductionTypeIntersection extends Production {
	static readonly instance: ProductionTypeIntersection = new ProductionTypeIntersection();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionTypeUnaryKeyword.instance],
			[ProductionTypeIntersection.instance, '&', ProductionTypeUnaryKeyword.instance],
		];
	}
}

export class ProductionTypeUnion extends Production {
	static readonly instance: ProductionTypeUnion = new ProductionTypeUnion();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionTypeIntersection.instance],
			[ProductionTypeUnion.instance, '|', ProductionTypeIntersection.instance],
		];
	}
}

export class ProductionType extends Production {
	static readonly instance: ProductionType = new ProductionType();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionTypeUnion.instance],
		];
	}
}

export class ProductionStringTemplate__0__List extends Production {
	static readonly instance: ProductionStringTemplate__0__List = new ProductionStringTemplate__0__List();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[TERMINAL.TerminalTemplateMiddle.instance],
			[ProductionStringTemplate__0__List.instance, TERMINAL.TerminalTemplateMiddle.instance],
			[TERMINAL.TerminalTemplateMiddle.instance, ProductionExpression.instance],
			[ProductionStringTemplate__0__List.instance, TERMINAL.TerminalTemplateMiddle.instance, ProductionExpression.instance],
		];
	}
}

export class ProductionStringTemplate extends Production {
	static readonly instance: ProductionStringTemplate = new ProductionStringTemplate();
	/** @implements Production */
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

export class ProductionProperty extends Production {
	static readonly instance: ProductionProperty = new ProductionProperty();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionWord.instance, '=', ProductionExpression.instance],
		];
	}
}

export class ProductionCase extends Production {
	static readonly instance: ProductionCase = new ProductionCase();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpression.instance, '->', ProductionExpression.instance],
		];
	}
}

export class ProductionTupleLiteral__0__List extends Production {
	static readonly instance: ProductionTupleLiteral__0__List = new ProductionTupleLiteral__0__List();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpression.instance],
			[ProductionTupleLiteral__0__List.instance, ',', ProductionExpression.instance],
		];
	}
}

export class ProductionTupleLiteral extends Production {
	static readonly instance: ProductionTupleLiteral = new ProductionTupleLiteral();
	/** @implements Production */
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

export class ProductionRecordLiteral__0__List extends Production {
	static readonly instance: ProductionRecordLiteral__0__List = new ProductionRecordLiteral__0__List();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionProperty.instance],
			[ProductionRecordLiteral__0__List.instance, ',', ProductionProperty.instance],
		];
	}
}

export class ProductionRecordLiteral extends Production {
	static readonly instance: ProductionRecordLiteral = new ProductionRecordLiteral();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['[', ProductionRecordLiteral__0__List.instance, ']'],
			['[', ProductionRecordLiteral__0__List.instance, ',', ']'],
			['[', ',', ProductionRecordLiteral__0__List.instance, ']'],
			['[', ',', ProductionRecordLiteral__0__List.instance, ',', ']'],
		];
	}
}

export class ProductionSetLiteral extends Production {
	static readonly instance: ProductionSetLiteral = new ProductionSetLiteral();
	/** @implements Production */
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

export class ProductionMapLiteral__0__List extends Production {
	static readonly instance: ProductionMapLiteral__0__List = new ProductionMapLiteral__0__List();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionCase.instance],
			[ProductionMapLiteral__0__List.instance, ',', ProductionCase.instance],
		];
	}
}

export class ProductionMapLiteral extends Production {
	static readonly instance: ProductionMapLiteral = new ProductionMapLiteral();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['{', ProductionMapLiteral__0__List.instance, '}'],
			['{', ProductionMapLiteral__0__List.instance, ',', '}'],
			['{', ',', ProductionMapLiteral__0__List.instance, '}'],
			['{', ',', ProductionMapLiteral__0__List.instance, ',', '}'],
		];
	}
}

export class ProductionFunctionArguments extends Production {
	static readonly instance: ProductionFunctionArguments = new ProductionFunctionArguments();
	/** @implements Production */
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

export class ProductionExpressionUnit extends Production {
	static readonly instance: ProductionExpressionUnit = new ProductionExpressionUnit();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[TERMINAL.TerminalIdentifier.instance],
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

export class ProductionPropertyAccess extends Production {
	static readonly instance: ProductionPropertyAccess = new ProductionPropertyAccess();
	/** @implements Production */
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

export class ProductionPropertyAssign extends Production {
	static readonly instance: ProductionPropertyAssign = new ProductionPropertyAssign();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['.', TERMINAL.TerminalInteger.instance],
			['.', ProductionWord.instance],
			['.', '[', ProductionExpression.instance, ']'],
		];
	}
}

export class ProductionFunctionCall extends Production {
	static readonly instance: ProductionFunctionCall = new ProductionFunctionCall();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['.', ProductionFunctionArguments.instance],
			['.', ProductionGenericArguments.instance, ProductionFunctionArguments.instance],
		];
	}
}

export class ProductionExpressionCompound extends Production {
	static readonly instance: ProductionExpressionCompound = new ProductionExpressionCompound();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionUnit.instance],
			[ProductionExpressionCompound.instance, ProductionPropertyAccess.instance],
			[ProductionExpressionCompound.instance, ProductionFunctionCall.instance],
		];
	}
}

export class ProductionAssignee extends Production {
	static readonly instance: ProductionAssignee = new ProductionAssignee();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[TERMINAL.TerminalIdentifier.instance],
			[ProductionExpressionCompound.instance, ProductionPropertyAssign.instance],
		];
	}
}

export class ProductionExpressionUnarySymbol extends Production {
	static readonly instance: ProductionExpressionUnarySymbol = new ProductionExpressionUnarySymbol();
	/** @implements Production */
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

export class ProductionExpressionExponential extends Production {
	static readonly instance: ProductionExpressionExponential = new ProductionExpressionExponential();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionUnarySymbol.instance],
			[ProductionExpressionUnarySymbol.instance, '^', ProductionExpressionExponential.instance],
		];
	}
}

export class ProductionExpressionMultiplicative extends Production {
	static readonly instance: ProductionExpressionMultiplicative = new ProductionExpressionMultiplicative();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionExponential.instance],
			[ProductionExpressionMultiplicative.instance, '*', ProductionExpressionExponential.instance],
			[ProductionExpressionMultiplicative.instance, '/', ProductionExpressionExponential.instance],
		];
	}
}

export class ProductionExpressionAdditive extends Production {
	static readonly instance: ProductionExpressionAdditive = new ProductionExpressionAdditive();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionMultiplicative.instance],
			[ProductionExpressionAdditive.instance, '+', ProductionExpressionMultiplicative.instance],
			[ProductionExpressionAdditive.instance, '-', ProductionExpressionMultiplicative.instance],
		];
	}
}

export class ProductionExpressionComparative extends Production {
	static readonly instance: ProductionExpressionComparative = new ProductionExpressionComparative();
	/** @implements Production */
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

export class ProductionExpressionEquality extends Production {
	static readonly instance: ProductionExpressionEquality = new ProductionExpressionEquality();
	/** @implements Production */
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

export class ProductionExpressionConjunctive extends Production {
	static readonly instance: ProductionExpressionConjunctive = new ProductionExpressionConjunctive();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionEquality.instance],
			[ProductionExpressionConjunctive.instance, '&&', ProductionExpressionEquality.instance],
			[ProductionExpressionConjunctive.instance, '!&', ProductionExpressionEquality.instance],
		];
	}
}

export class ProductionExpressionDisjunctive extends Production {
	static readonly instance: ProductionExpressionDisjunctive = new ProductionExpressionDisjunctive();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionConjunctive.instance],
			[ProductionExpressionDisjunctive.instance, '||', ProductionExpressionConjunctive.instance],
			[ProductionExpressionDisjunctive.instance, '!|', ProductionExpressionConjunctive.instance],
		];
	}
}

export class ProductionExpressionConditional extends Production {
	static readonly instance: ProductionExpressionConditional = new ProductionExpressionConditional();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['if', ProductionExpression.instance, 'then', ProductionExpression.instance, 'else', ProductionExpression.instance],
		];
	}
}

export class ProductionExpression extends Production {
	static readonly instance: ProductionExpression = new ProductionExpression();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionExpressionDisjunctive.instance],
			[ProductionExpressionConditional.instance],
		];
	}
}

export class ProductionDeclarationType extends Production {
	static readonly instance: ProductionDeclarationType = new ProductionDeclarationType();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['type', TERMINAL.TerminalIdentifier.instance, '=', ProductionType.instance, ';'],
		];
	}
}

export class ProductionDeclarationVariable extends Production {
	static readonly instance: ProductionDeclarationVariable = new ProductionDeclarationVariable();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['let', TERMINAL.TerminalIdentifier.instance, ':', ProductionType.instance, '=', ProductionExpression.instance, ';'],
			['let', 'unfixed', TERMINAL.TerminalIdentifier.instance, ':', ProductionType.instance, '=', ProductionExpression.instance, ';'],
		];
	}
}

export class ProductionDeclaration extends Production {
	static readonly instance: ProductionDeclaration = new ProductionDeclaration();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionDeclarationType.instance],
			[ProductionDeclarationVariable.instance],
		];
	}
}

export class ProductionStatementAssignment extends Production {
	static readonly instance: ProductionStatementAssignment = new ProductionStatementAssignment();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionAssignee.instance, '=', ProductionExpression.instance, ';'],
		];
	}
}

export class ProductionStatement extends Production {
	static readonly instance: ProductionStatement = new ProductionStatement();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[';'],
			[ProductionExpression.instance, ';'],
			[ProductionDeclaration.instance],
			[ProductionStatementAssignment.instance],
		];
	}
}

export class ProductionGoal__0__List extends Production {
	static readonly instance: ProductionGoal__0__List = new ProductionGoal__0__List();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionStatement.instance],
			[ProductionGoal__0__List.instance, ProductionStatement.instance],
		];
	}
}

export class ProductionGoal extends Production {
	static readonly instance: ProductionGoal = new ProductionGoal();
	/** @implements Production */
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

export class ParseNodeStringTemplate__0__List extends ParseNode {
	declare readonly children:
		| readonly [Token]
		| readonly [ParseNodeStringTemplate__0__List, Token]
		| readonly [Token, ParseNodeExpression]
		| readonly [ParseNodeStringTemplate__0__List, Token, ParseNodeExpression]
	;
}

export class ParseNodeStringTemplate extends ParseNode {
	declare readonly children:
		| readonly [Token]
		| readonly [Token, Token]
		| readonly [Token, ParseNodeStringTemplate__0__List, Token]
		| readonly [Token, ParseNodeExpression, Token]
		| readonly [Token, ParseNodeExpression, ParseNodeStringTemplate__0__List, Token]
	;
}

export class ParseNodeProperty extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeWord, Token, ParseNodeExpression]
	;
}

export class ParseNodeCase extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeExpression, Token, ParseNodeExpression]
	;
}

export class ParseNodeTupleLiteral__0__List extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeExpression]
		| readonly [ParseNodeTupleLiteral__0__List, Token, ParseNodeExpression]
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

export class ParseNodeExpressionUnit extends ParseNode {
	declare readonly children:
		| readonly [Token]
		| readonly [ParseNodePrimitiveLiteral]
		| readonly [ParseNodeStringTemplate]
		| readonly [ParseNodeTupleLiteral]
		| readonly [ParseNodeRecordLiteral]
		| readonly [ParseNodeSetLiteral]
		| readonly [ParseNodeMapLiteral]
		| readonly [Token, ParseNodeExpression, Token]
	;
}

export class ParseNodePropertyAccess extends ParseNode {
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

export class ParseNodePropertyAssign extends ParseNode {
	declare readonly children:
		| readonly [Token, Token]
		| readonly [Token, ParseNodeWord]
		| readonly [Token, Token, ParseNodeExpression, Token]
	;
}

export class ParseNodeFunctionCall extends ParseNode {
	declare readonly children:
		| readonly [Token, ParseNodeFunctionArguments]
		| readonly [Token, ParseNodeGenericArguments, ParseNodeFunctionArguments]
	;
}

export class ParseNodeExpressionCompound extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeExpressionUnit]
		| readonly [ParseNodeExpressionCompound, ParseNodePropertyAccess]
		| readonly [ParseNodeExpressionCompound, ParseNodeFunctionCall]
	;
}

export class ParseNodeAssignee extends ParseNode {
	declare readonly children:
		| readonly [Token]
		| readonly [ParseNodeExpressionCompound, ParseNodePropertyAssign]
	;
}

export class ParseNodeExpressionUnarySymbol extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeExpressionCompound]
		| readonly [Token, ParseNodeExpressionUnarySymbol]
		| readonly [Token, ParseNodeExpressionUnarySymbol]
		| readonly [Token, ParseNodeExpressionUnarySymbol]
		| readonly [Token, ParseNodeExpressionUnarySymbol]
	;
}

export class ParseNodeExpressionExponential extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeExpressionUnarySymbol]
		| readonly [ParseNodeExpressionUnarySymbol, Token, ParseNodeExpressionExponential]
	;
}

export class ParseNodeExpressionMultiplicative extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeExpressionExponential]
		| readonly [ParseNodeExpressionMultiplicative, Token, ParseNodeExpressionExponential]
		| readonly [ParseNodeExpressionMultiplicative, Token, ParseNodeExpressionExponential]
	;
}

export class ParseNodeExpressionAdditive extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeExpressionMultiplicative]
		| readonly [ParseNodeExpressionAdditive, Token, ParseNodeExpressionMultiplicative]
		| readonly [ParseNodeExpressionAdditive, Token, ParseNodeExpressionMultiplicative]
	;
}

export class ParseNodeExpressionComparative extends ParseNode {
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

export class ParseNodeExpressionEquality extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeExpressionComparative]
		| readonly [ParseNodeExpressionEquality, Token, ParseNodeExpressionComparative]
		| readonly [ParseNodeExpressionEquality, Token, ParseNodeExpressionComparative]
		| readonly [ParseNodeExpressionEquality, Token, ParseNodeExpressionComparative]
		| readonly [ParseNodeExpressionEquality, Token, ParseNodeExpressionComparative]
	;
}

export class ParseNodeExpressionConjunctive extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeExpressionEquality]
		| readonly [ParseNodeExpressionConjunctive, Token, ParseNodeExpressionEquality]
		| readonly [ParseNodeExpressionConjunctive, Token, ParseNodeExpressionEquality]
	;
}

export class ParseNodeExpressionDisjunctive extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeExpressionConjunctive]
		| readonly [ParseNodeExpressionDisjunctive, Token, ParseNodeExpressionConjunctive]
		| readonly [ParseNodeExpressionDisjunctive, Token, ParseNodeExpressionConjunctive]
	;
}

export class ParseNodeExpressionConditional extends ParseNode {
	declare readonly children:
		| readonly [Token, ParseNodeExpression, Token, ParseNodeExpression, Token, ParseNodeExpression]
	;
}

export class ParseNodeExpression extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeExpressionDisjunctive]
		| readonly [ParseNodeExpressionConditional]
	;
}

export class ParseNodeDeclarationType extends ParseNode {
	declare readonly children:
		| readonly [Token, Token, Token, ParseNodeType, Token]
	;
}

export class ParseNodeDeclarationVariable extends ParseNode {
	declare readonly children:
		| readonly [Token, Token, Token, ParseNodeType, Token, ParseNodeExpression, Token]
		| readonly [Token, Token, Token, Token, ParseNodeType, Token, ParseNodeExpression, Token]
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
		| readonly [ParseNodeAssignee, Token, ParseNodeExpression, Token]
	;
}

export class ParseNodeStatement extends ParseNode {
	declare readonly children:
		| readonly [Token]
		| readonly [ParseNodeExpression, Token]
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
	ProductionStringTemplate.instance,
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
	ProductionPropertyAccess.instance,
	ProductionPropertyAssign.instance,
	ProductionFunctionCall.instance,
	ProductionExpressionCompound.instance,
	ProductionAssignee.instance,
	ProductionExpressionUnarySymbol.instance,
	ProductionExpressionExponential.instance,
	ProductionExpressionMultiplicative.instance,
	ProductionExpressionAdditive.instance,
	ProductionExpressionComparative.instance,
	ProductionExpressionEquality.instance,
	ProductionExpressionConjunctive.instance,
	ProductionExpressionDisjunctive.instance,
	ProductionExpressionConditional.instance,
	ProductionExpression.instance,
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
		[ProductionStringTemplate.instance, ParseNodeStringTemplate],
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
		[ProductionPropertyAccess.instance, ParseNodePropertyAccess],
		[ProductionPropertyAssign.instance, ParseNodePropertyAssign],
		[ProductionFunctionCall.instance, ParseNodeFunctionCall],
		[ProductionExpressionCompound.instance, ParseNodeExpressionCompound],
		[ProductionAssignee.instance, ParseNodeAssignee],
		[ProductionExpressionUnarySymbol.instance, ParseNodeExpressionUnarySymbol],
		[ProductionExpressionExponential.instance, ParseNodeExpressionExponential],
		[ProductionExpressionMultiplicative.instance, ParseNodeExpressionMultiplicative],
		[ProductionExpressionAdditive.instance, ParseNodeExpressionAdditive],
		[ProductionExpressionComparative.instance, ParseNodeExpressionComparative],
		[ProductionExpressionEquality.instance, ParseNodeExpressionEquality],
		[ProductionExpressionConjunctive.instance, ParseNodeExpressionConjunctive],
		[ProductionExpressionDisjunctive.instance, ParseNodeExpressionDisjunctive],
		[ProductionExpressionConditional.instance, ParseNodeExpressionConditional],
		[ProductionExpression.instance, ParseNodeExpression],
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



