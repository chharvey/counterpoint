import type {KleenePlus} from '../types.d'
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
	constructor (name: TOKEN.TokenIdentifier) {
		super(name, {name: name.source})
	}
}
export class SemanticNodeArg extends SemanticNodeEBNF {
	constructor (name: TOKEN.TokenIdentifier, append: boolean | 'inherit') {
		super(name, {name: name.source, append})
	}
}
export class SemanticNodeCondition extends SemanticNodeEBNF {
	constructor (name: TOKEN.TokenIdentifier, include: boolean) {
		super(name, {name: name.source, include})
	}
}
export abstract class SemanticNodeExpr extends SemanticNodeEBNF {
}
export class SemanticNodeConst extends SemanticNodeExpr {
	constructor (value: TOKEN.TokenCharCode | TOKEN.TokenString | TOKEN.TokenCharClass) {
		super(value, {value: value.source})
	}
}
export class SemanticNodeRef extends SemanticNodeExpr {
	constructor (name: TOKEN.TokenIdentifier, args: readonly SemanticNodeArg[] = []) {
		super(name, {}, args)
	}
}
export class SemanticNodeItem extends SemanticNodeExpr {
	constructor (start_node: ParseNode, item: SemanticNodeExpr, conditions: readonly SemanticNodeCondition[] = []) {
		super(start_node, {}, [item, ...conditions])
	}
}
abstract class SemanticNodeOp extends SemanticNodeExpr {
	constructor (start_node: ParseNode, operator: string, operands: KleenePlus<SemanticNodeExpr>) {
		super(start_node, {operator}, operands)
	}
}
export class SemanticNodeOpUn extends SemanticNodeOp {
	constructor (
		start_node: ParseNode,
		operator: 'plus' | 'star' | 'hash' | 'opt',
		operand: SemanticNodeExpr,
	) {
		super(start_node, operator, [operand])
	}
}
export class SemanticNodeOpBin extends SemanticNodeOp {
	constructor (
		start_node: ParseNode,
		operator: 'order' | 'concat' | 'altern',
		operand0: SemanticNodeExpr,
		operand1: SemanticNodeExpr,
	) {
		super(start_node, operator, [operand0, operand1])
	}
}
export class SemanticNodeNonterminal extends SemanticNodeEBNF {
	constructor (name: TOKEN.TokenIdentifier, params: readonly SemanticNodeParam[] = []) {
		super(name, {name: name.source}, params)
	 }
}
export class SemanticNodeProduction extends SemanticNodeEBNF {
	constructor (start_node: ParseNode, nonterminal: SemanticNodeNonterminal, definition: SemanticNodeExpr) {
		super(start_node, {}, [nonterminal, definition])
	}
}
export class SemanticNodeGrammar extends SemanticNodeEBNF {
	constructor (start_node: ParseNode, productions: readonly SemanticNodeProduction[] = []) {
		super(start_node, {}, productions)
	}
}
