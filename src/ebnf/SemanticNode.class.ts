import type {NonemptyArray} from '../types.d'
import type {
	Token,
} from '../lexer/'
import type {
	ParseNode
} from '../parser/'
import {SemanticNode} from '../validator/'
import type * as TOKEN from './Token.class'



export class SemanticNodeEBNF extends SemanticNode {
	constructor (
		start_node: ParseNode | Token,
		attributes: {[key: string]: boolean | string} = {},
		children: readonly SemanticNode[] = [],
	) {
		super(start_node, attributes, children)
	}
}



export class SemanticNodeParam extends SemanticNodeEBNF {
	constructor (start_node: TOKEN.TokenIdentifier) {
		super(start_node, {name: start_node.source})
	}
}
export class SemanticNodeArg extends SemanticNodeEBNF {
	constructor (
		start_node: TOKEN.TokenIdentifier,
		append:     boolean | 'inherit',
	) {
		super(start_node, {name: start_node.source, append})
	}
}
export class SemanticNodeCondition extends SemanticNodeEBNF {
	constructor (
		start_node: TOKEN.TokenIdentifier,
		include:    boolean,
	) {
		super(start_node, {name: start_node.source, include})
	}
}
export abstract class SemanticNodeExpr extends SemanticNodeEBNF {
}
export class SemanticNodeConst extends SemanticNodeExpr {
	constructor (start_node: TOKEN.TokenCharCode | TOKEN.TokenString | TOKEN.TokenCharClass) {
		super(start_node, {value: start_node.source})
	}
}
export class SemanticNodeRef extends SemanticNodeExpr {
	private readonly name: string;
	constructor (start_node: ParseNode, ref: TOKEN.TokenIdentifier);
	constructor (start_node: ParseNode, ref: SemanticNodeRef, args: readonly SemanticNodeArg[]);
	constructor (
		start_node: ParseNode,
		ref:        TOKEN.TokenIdentifier | SemanticNodeRef,
		args:       readonly SemanticNodeArg[] = [],
	) {
		const name_: string = (ref instanceof SemanticNodeRef) ? ref.name : ref.source
		super(
			start_node,
			{name: name_},
			(ref instanceof SemanticNodeRef) ? [ref, ...args] : [],
		)
		this.name = name_
	}
}
export class SemanticNodeItem extends SemanticNodeExpr {
	constructor (
		start_node: ParseNode,
		item:       SemanticNodeExpr,
		conditions: readonly SemanticNodeCondition[] = [],
	) {
		super(start_node, {}, [item, ...conditions])
	}
}
abstract class SemanticNodeOp extends SemanticNodeExpr {
	constructor (start_node: ParseNode, operator: string, operands: NonemptyArray<SemanticNodeExpr>) {
		super(start_node, {operator}, operands)
	}
}
export class SemanticNodeOpUn extends SemanticNodeOp {
	constructor (
		start_node: ParseNode,
		operator:   'plus' | 'star' | 'hash' | 'opt',
		operand:    SemanticNodeExpr,
	) {
		super(start_node, operator, [operand])
	}
}
export class SemanticNodeOpBin extends SemanticNodeOp {
	constructor (
		start_node: ParseNode,
		operator:   'order' | 'concat' | 'altern',
		operand0:   SemanticNodeExpr,
		operand1:   SemanticNodeExpr,
	) {
		super(start_node, operator, [operand0, operand1])
	}
}
export class SemanticNodeNonterminal extends SemanticNodeEBNF {
	private readonly name: string;
	constructor (start_node: ParseNode, nonterm: TOKEN.TokenIdentifier);
	constructor (start_node: ParseNode, nonterm: SemanticNodeNonterminal, params: readonly SemanticNodeParam[]);
	constructor (
		start_node: ParseNode,
		nonterm: TOKEN.TokenIdentifier | SemanticNodeNonterminal,
		params: readonly SemanticNodeParam[] = [],
	) {
		const name_: string = (nonterm instanceof SemanticNodeNonterminal) ? nonterm.name : nonterm.source
		super(
			start_node,
			{name: name_},
			(nonterm instanceof SemanticNodeNonterminal) ? [nonterm, ...params] : [],
		)
		this.name = name_
	}
}
export class SemanticNodeProduction extends SemanticNodeEBNF {
	constructor (
		start_node:  ParseNode,
		nonterminal: SemanticNodeNonterminal,
		definition:  SemanticNodeExpr,
	) {
		super(start_node, {}, [nonterminal, definition])
	}
}
export class SemanticNodeGrammar extends SemanticNodeEBNF {
	constructor (
		start_node:  ParseNode,
		productions: readonly SemanticNodeProduction[] = [],
	) {
		super(start_node, {}, productions)
	}
}
