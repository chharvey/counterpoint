import type {
	KleenePlus,
	EBNFObject,
	EBNFChoice,
} from '../types.d'
import type {
	Token,
} from '../lexer/'
import type {
	ParseNode
} from '../parser/'
import {SemanticNode} from '../validator/'
import type * as TOKEN from './Token.class'



function NonemptyArray_flatMap<T, U>(arr: KleenePlus<T>, callback: (it: T) => KleenePlus<U>): KleenePlus<U> {
	return arr.flatMap((it) => callback(it)) as readonly U[] as KleenePlus<U>
}



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
		readonly append: boolean | 'inherit',
	) {
		super(start_node, {name: start_node.source, append})
	}
}
export class SemanticNodeCondition extends SemanticNodeEBNF {
	constructor (
		start_node: TOKEN.TokenIdentifier,
		readonly include: boolean,
	) {
		super(start_node, {name: start_node.source, include})
	}
}
export abstract class SemanticNodeExpr extends SemanticNodeEBNF {
	/**
	 * Transform this semantic expression into JSON data.
	 * @param nt a specific nonterminal symbol that contains this expression
	 * @param data the bank of JSON data
	 * @return data representing an EBNF choice
	 */
	abstract transform(nt: ConcreteNonterminal, data: EBNFObject[]): EBNFChoice;
}
export class SemanticNodeConst extends SemanticNodeExpr {
	constructor (start_node: TOKEN.TokenCharCode | TOKEN.TokenString | TOKEN.TokenCharClass) {
		super(start_node, {value: start_node.source})
	}
	transform(_nt: ConcreteNonterminal, _data: EBNFObject[]): EBNFChoice {
		return [
			[this.source],
		]
	}
}
export class SemanticNodeRef extends SemanticNodeExpr {
	private readonly name: string;
	constructor (start_node: ParseNode, ref: TOKEN.TokenIdentifier);
	constructor (start_node: ParseNode, ref: SemanticNodeRef, args: readonly SemanticNodeArg[]);
	constructor (
		start_node: ParseNode,
		private readonly ref:  TOKEN.TokenIdentifier | SemanticNodeRef,
		private readonly args: readonly SemanticNodeArg[] = [],
	) {
		super(
			start_node,
			{name: (ref instanceof SemanticNodeRef) ? ref.name : ref.source},
			(ref instanceof SemanticNodeRef) ? [ref, ...args] : args,
		)
		this.name = (ref instanceof SemanticNodeRef) ? ref.name : ref.source
	}
	transform(nt: ConcreteNonterminal, _data: EBNFObject[]): EBNFChoice {
		return (this.name === this.name.toUpperCase())
			/* ALLCAPS: terminal identifier */
			? [[{term: this.name}]]
			/* TitleCase: production identifier */
			: [[{
				prod: `${ this.name }${ (this.ref instanceof SemanticNodeRef)
					/* with arguments */
					? this.args.map((arg) =>
						(arg.append === true || arg.append === 'inherit' && nt.hasSuffix(arg))
							? `_${ arg.source }`
							: ''
					).join('')
					/* no arguments */
					: ''
				}`
			}]]
	}
}
export class SemanticNodeItem extends SemanticNodeExpr {
	constructor (
		start_node: ParseNode,
		private readonly item:       SemanticNodeExpr,
		private readonly conditions: readonly SemanticNodeCondition[] = [],
	) {
		super(start_node, {}, [item, ...conditions])
	}
	transform(nt: ConcreteNonterminal, data: EBNFObject[]): EBNFChoice {
		return (this.conditions.some((cond) => cond.include === nt.hasSuffix(cond)))
			? this.item.transform(nt, data)
			: [
				['\'\''],
			]
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
		private readonly operator: 'plus' | 'star' | 'hash' | 'opt',
		private readonly operand:  SemanticNodeExpr,
	) {
		super(start_node, operator, [operand])
	}
	transform(nt: ConcreteNonterminal, data: EBNFObject[]): EBNFChoice {
		const name: string = `${ nt }__${ nt.subCount }__List`
		return new Map<string, () => EBNFChoice>([
			['plus', () => {
				data.push({
					name,
					defn: NonemptyArray_flatMap(this.operand.transform(nt, data), (seq) => [
						seq,
						[{prod: name}, ...seq],
					]),
				})
				return [
					[{prod: name}],
				]
			}],
			['star', () => {
				data.push({
					name,
					defn: NonemptyArray_flatMap(this.operand.transform(nt, data), (seq) => [
						seq,
						[{prod: name}, ...seq],
					]),
				})
				return [
					['\'\''],
					[{prod: name}],
				]
			}],
			['hash', () => {
				data.push({
					name,
					defn: NonemptyArray_flatMap(this.operand.transform(nt, data), (seq) => [
						seq,
						[{prod: name}, '\',\'', ...seq],
					]),
				})
				return [
					[{prod: name}],
				]
			}],
			['opt', () => {
				return [
					['\'\''],
					...this.operand.transform(nt, data),
				]
			}],
		]).get(this.operator)!()
	}
}
export class SemanticNodeOpBin extends SemanticNodeOp {
	constructor (
		start_node: ParseNode,
		private readonly operator: 'order' | 'concat' | 'altern',
		private readonly operand0: SemanticNodeExpr,
		private readonly operand1: SemanticNodeExpr,
	) {
		super(start_node, operator, [operand0, operand1])
	}
	transform(nt: ConcreteNonterminal, data: EBNFObject[]): EBNFChoice {
		return new Map<string, () => EBNFChoice>([
			['order', () => NonemptyArray_flatMap(this.operand0.transform(nt, data), (seq0) =>
				NonemptyArray_flatMap(this.operand1.transform(nt, data), (seq1) => [
					[...seq0, ...seq1],
				])
			)],
			['concat', () => NonemptyArray_flatMap(this.operand0.transform(nt, data), (seq0) =>
				NonemptyArray_flatMap(this.operand1.transform(nt, data), (seq1) => [
					[...seq0, ...seq1],
					[...seq1, ...seq0],
				])
			)],
			['altern', () => [
				...this.operand0.transform(nt, data),
				...this.operand1.transform(nt, data),
			]],
		]).get(this.operator)!()
	}
}
export class SemanticNodeNonterminal extends SemanticNodeEBNF {
	constructor (
		start_node: TOKEN.TokenIdentifier,
		private readonly params: readonly SemanticNodeParam[] = [],
	) {
		super(start_node, {name: start_node.source}, params)
	}
	/**
	 * Expands this nonterminal in its abstract form into a set of nonterminals with concrete parameters.
	 * E.g., expands `N<X, Y>` into `[N, N__X, N__Y, N__X__Y]`.
	 * @returns an array of objects representing nonterminals
	 */
	expand(): ConcreteNonterminal[] {
		return [...new Array(2 ** this.params.length)].map((_, count) => new ConcreteNonterminal(
			this.source,
			[...count.toString(2).padStart(this.params.length, '0')].map((d, i) =>
				[this.params[i], !!+d] as const
			).filter(([_param, b]) => !!b).map(([param, _b]) => param),
		))
	}
}
export class SemanticNodeProduction extends SemanticNodeEBNF {
	constructor (
		start_node: ParseNode,
		private readonly nonterminal: SemanticNodeNonterminal,
		private readonly definition:  SemanticNodeExpr,
	) {
		super(start_node, {}, [nonterminal, definition])
	}
	transform(): EBNFObject[] {
		const productions_data: EBNFObject[] = []
		productions_data.push(...this.nonterminal.expand().map((n) => ({
			name: n.toString(),
			defn: this.definition.transform(n, productions_data),
		})))
		return productions_data
	}
}
export class SemanticNodeGrammar extends SemanticNodeEBNF {
	constructor (
		start_node: ParseNode,
		private readonly productions: readonly SemanticNodeProduction[] = [],
	) {
		super(start_node, {}, productions)
	}
	transform(): EBNFObject[] {
		return this.productions.flatMap((prod) => prod.transform())
	}
}



class ConcreteNonterminal {
	/** A counter for internal sub-expressions. Used for naming automated productions. */
	private sub_count: bigint = 0n
	constructor(
		readonly name: string,
		private readonly suffixes: SemanticNodeParam[],
	) {
	}
	/**
	 * Return the sub-expression count, and then increment it.
	 * @return this ConcreteNonterminal’s current sub-expression counter
	 */
	get subCount(): bigint {
		return this.sub_count++
	}
	toString(): string {
		return `${ this.name }${ this.suffixes.map((s) => `_${ s.source }`).join('') }`
	}
	hasSuffix(p: SemanticNodeParam | SemanticNodeArg | SemanticNodeCondition): boolean {
		return !!this.suffixes.find((suffix) => suffix.source === p.source)
	}
}
