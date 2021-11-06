
/*----------------------------------------------------------------/
| WARNING: Do not manually update this file!
| It is auto-generated via <@chharvey/parser>.
| If you need to make updates, make them there.
/----------------------------------------------------------------*/

import type {
	NonemptyArray,
} from './package.js';
import type {Token} from './Token.js';
import {ParseNode} from './ParseNode.js';
import {Production} from './Production.js';
import {
	Grammar,
	GrammarSymbol,
} from './Grammar.js';
import {Parser} from './Parser.js';
import {LEXER} from './LexerEbnf.js';
import * as TERMINAL from './terminal-ebnf/index.js';

export class ProductionParameterSet__0__List extends Production {
	static readonly instance: ProductionParameterSet__0__List = new ProductionParameterSet__0__List();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[TERMINAL.TerminalIdentifier.instance],
			[ProductionParameterSet__0__List.instance, ',', TERMINAL.TerminalIdentifier.instance],
		];
	}
}

export class ProductionParameterSet extends Production {
	static readonly instance: ProductionParameterSet = new ProductionParameterSet();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['<', ProductionParameterSet__0__List.instance, '>'],
		];
	}
}

export class ProductionArgumentSet__0__List extends Production {
	static readonly instance: ProductionArgumentSet__0__List = new ProductionArgumentSet__0__List();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['+', TERMINAL.TerminalIdentifier.instance],
			[ProductionArgumentSet__0__List.instance, ',', '+', TERMINAL.TerminalIdentifier.instance],
			['-', TERMINAL.TerminalIdentifier.instance],
			[ProductionArgumentSet__0__List.instance, ',', '-', TERMINAL.TerminalIdentifier.instance],
			['?', TERMINAL.TerminalIdentifier.instance],
			[ProductionArgumentSet__0__List.instance, ',', '?', TERMINAL.TerminalIdentifier.instance],
		];
	}
}

export class ProductionArgumentSet extends Production {
	static readonly instance: ProductionArgumentSet = new ProductionArgumentSet();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['<', ProductionArgumentSet__0__List.instance, '>'],
		];
	}
}

export class ProductionConditionSet__0__List extends Production {
	static readonly instance: ProductionConditionSet__0__List = new ProductionConditionSet__0__List();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[TERMINAL.TerminalIdentifier.instance, '+'],
			[ProductionConditionSet__0__List.instance, ',', TERMINAL.TerminalIdentifier.instance, '+'],
			[TERMINAL.TerminalIdentifier.instance, '-'],
			[ProductionConditionSet__0__List.instance, ',', TERMINAL.TerminalIdentifier.instance, '-'],
		];
	}
}

export class ProductionConditionSet extends Production {
	static readonly instance: ProductionConditionSet = new ProductionConditionSet();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			['<', ProductionConditionSet__0__List.instance, '>'],
		];
	}
}

export class ProductionReference extends Production {
	static readonly instance: ProductionReference = new ProductionReference();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[TERMINAL.TerminalIdentifier.instance],
			[ProductionReference.instance, ProductionArgumentSet.instance],
		];
	}
}

export class ProductionUnit extends Production {
	static readonly instance: ProductionUnit = new ProductionUnit();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[TERMINAL.TerminalCharCode.instance],
			[TERMINAL.TerminalString.instance],
			[TERMINAL.TerminalCharClass.instance],
			[ProductionReference.instance],
			['(', ProductionDefinition.instance, ')'],
		];
	}
}

export class ProductionUnary extends Production {
	static readonly instance: ProductionUnary = new ProductionUnary();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionUnit.instance],
			[ProductionUnit.instance, '?'],
			[ProductionUnit.instance, '+'],
			[ProductionUnit.instance, '+', '?'],
			[ProductionUnit.instance, '*'],
			[ProductionUnit.instance, '*', '?'],
			[ProductionUnit.instance, '#'],
			[ProductionUnit.instance, '#', '?'],
		];
	}
}

export class ProductionItem extends Production {
	static readonly instance: ProductionItem = new ProductionItem();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionUnary.instance],
			[ProductionConditionSet.instance, ProductionItem.instance],
		];
	}
}

export class ProductionOrder extends Production {
	static readonly instance: ProductionOrder = new ProductionOrder();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionItem.instance],
			[ProductionOrder.instance, ProductionItem.instance],
			[ProductionOrder.instance, '.', ProductionItem.instance],
		];
	}
}

export class ProductionConcat extends Production {
	static readonly instance: ProductionConcat = new ProductionConcat();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionOrder.instance],
			[ProductionConcat.instance, '&', ProductionOrder.instance],
		];
	}
}

export class ProductionAltern extends Production {
	static readonly instance: ProductionAltern = new ProductionAltern();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionConcat.instance],
			[ProductionAltern.instance, '|', ProductionConcat.instance],
		];
	}
}

export class ProductionDefinition extends Production {
	static readonly instance: ProductionDefinition = new ProductionDefinition();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionAltern.instance],
			['.', ProductionAltern.instance],
			['&', ProductionAltern.instance],
			['|', ProductionAltern.instance],
		];
	}
}

export class ProductionNonterminalName extends Production {
	static readonly instance: ProductionNonterminalName = new ProductionNonterminalName();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[TERMINAL.TerminalIdentifier.instance],
			[ProductionNonterminalName.instance, ProductionParameterSet.instance],
		];
	}
}

export class ProductionProduction extends Production {
	static readonly instance: ProductionProduction = new ProductionProduction();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionNonterminalName.instance, ':::=', ProductionDefinition.instance, ';'],
			[ProductionNonterminalName.instance, '::=', ProductionDefinition.instance, ';'],
		];
	}
}

export class ProductionGoal__0__List extends Production {
	static readonly instance: ProductionGoal__0__List = new ProductionGoal__0__List();
	/** @implements Production */
	override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
		return [
			[ProductionProduction.instance],
			[ProductionGoal__0__List.instance, ProductionProduction.instance],
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


export class ParseNodeParameterSet__0__List extends ParseNode {
	declare readonly children:
		| readonly [Token]
		| readonly [ParseNodeParameterSet__0__List, Token, Token]
	;
}

export class ParseNodeParameterSet extends ParseNode {
	declare readonly children:
		| readonly [Token, ParseNodeParameterSet__0__List, Token]
	;
}

export class ParseNodeArgumentSet__0__List extends ParseNode {
	declare readonly children:
		| readonly [Token, Token]
		| readonly [ParseNodeArgumentSet__0__List, Token, Token, Token]
		| readonly [Token, Token]
		| readonly [ParseNodeArgumentSet__0__List, Token, Token, Token]
		| readonly [Token, Token]
		| readonly [ParseNodeArgumentSet__0__List, Token, Token, Token]
	;
}

export class ParseNodeArgumentSet extends ParseNode {
	declare readonly children:
		| readonly [Token, ParseNodeArgumentSet__0__List, Token]
	;
}

export class ParseNodeConditionSet__0__List extends ParseNode {
	declare readonly children:
		| readonly [Token, Token]
		| readonly [ParseNodeConditionSet__0__List, Token, Token, Token]
		| readonly [Token, Token]
		| readonly [ParseNodeConditionSet__0__List, Token, Token, Token]
	;
}

export class ParseNodeConditionSet extends ParseNode {
	declare readonly children:
		| readonly [Token, ParseNodeConditionSet__0__List, Token]
	;
}

export class ParseNodeReference extends ParseNode {
	declare readonly children:
		| readonly [Token]
		| readonly [ParseNodeReference, ParseNodeArgumentSet]
	;
}

export class ParseNodeUnit extends ParseNode {
	declare readonly children:
		| readonly [Token]
		| readonly [Token]
		| readonly [Token]
		| readonly [ParseNodeReference]
		| readonly [Token, ParseNodeDefinition, Token]
	;
}

export class ParseNodeUnary extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeUnit]
		| readonly [ParseNodeUnit, Token]
		| readonly [ParseNodeUnit, Token]
		| readonly [ParseNodeUnit, Token, Token]
		| readonly [ParseNodeUnit, Token]
		| readonly [ParseNodeUnit, Token, Token]
		| readonly [ParseNodeUnit, Token]
		| readonly [ParseNodeUnit, Token, Token]
	;
}

export class ParseNodeItem extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeUnary]
		| readonly [ParseNodeConditionSet, ParseNodeItem]
	;
}

export class ParseNodeOrder extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeItem]
		| readonly [ParseNodeOrder, ParseNodeItem]
		| readonly [ParseNodeOrder, Token, ParseNodeItem]
	;
}

export class ParseNodeConcat extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeOrder]
		| readonly [ParseNodeConcat, Token, ParseNodeOrder]
	;
}

export class ParseNodeAltern extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeConcat]
		| readonly [ParseNodeAltern, Token, ParseNodeConcat]
	;
}

export class ParseNodeDefinition extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeAltern]
		| readonly [Token, ParseNodeAltern]
		| readonly [Token, ParseNodeAltern]
		| readonly [Token, ParseNodeAltern]
	;
}

export class ParseNodeNonterminalName extends ParseNode {
	declare readonly children:
		| readonly [Token]
		| readonly [ParseNodeNonterminalName, ParseNodeParameterSet]
	;
}

export class ParseNodeProduction extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeNonterminalName, Token, ParseNodeDefinition, Token]
		| readonly [ParseNodeNonterminalName, Token, ParseNodeDefinition, Token]
	;
}

export class ParseNodeGoal__0__List extends ParseNode {
	declare readonly children:
		| readonly [ParseNodeProduction]
		| readonly [ParseNodeGoal__0__List, ParseNodeProduction]
	;
}

export class ParseNodeGoal extends ParseNode {
	declare readonly children:
		| readonly [Token, Token]
		| readonly [Token, ParseNodeGoal__0__List, Token]
	;
}


export const GRAMMAR: Grammar = new Grammar([
	ProductionParameterSet__0__List.instance,
	ProductionParameterSet.instance,
	ProductionArgumentSet__0__List.instance,
	ProductionArgumentSet.instance,
	ProductionConditionSet__0__List.instance,
	ProductionConditionSet.instance,
	ProductionReference.instance,
	ProductionUnit.instance,
	ProductionUnary.instance,
	ProductionItem.instance,
	ProductionOrder.instance,
	ProductionConcat.instance,
	ProductionAltern.instance,
	ProductionDefinition.instance,
	ProductionNonterminalName.instance,
	ProductionProduction.instance,
	ProductionGoal__0__List.instance,
	ProductionGoal.instance,
], ProductionGoal.instance);


export const PARSER: Parser<ParseNodeGoal> = new Parser<ParseNodeGoal>(
	LEXER,
	GRAMMAR,
	new Map<Production, typeof ParseNode>([
		[ProductionParameterSet__0__List.instance, ParseNodeParameterSet__0__List],
		[ProductionParameterSet.instance, ParseNodeParameterSet],
		[ProductionArgumentSet__0__List.instance, ParseNodeArgumentSet__0__List],
		[ProductionArgumentSet.instance, ParseNodeArgumentSet],
		[ProductionConditionSet__0__List.instance, ParseNodeConditionSet__0__List],
		[ProductionConditionSet.instance, ParseNodeConditionSet],
		[ProductionReference.instance, ParseNodeReference],
		[ProductionUnit.instance, ParseNodeUnit],
		[ProductionUnary.instance, ParseNodeUnary],
		[ProductionItem.instance, ParseNodeItem],
		[ProductionOrder.instance, ParseNodeOrder],
		[ProductionConcat.instance, ParseNodeConcat],
		[ProductionAltern.instance, ParseNodeAltern],
		[ProductionDefinition.instance, ParseNodeDefinition],
		[ProductionNonterminalName.instance, ParseNodeNonterminalName],
		[ProductionProduction.instance, ParseNodeProduction],
		[ProductionGoal__0__List.instance, ParseNodeGoal__0__List],
		[ProductionGoal.instance, ParseNodeGoal],
	]),
);


