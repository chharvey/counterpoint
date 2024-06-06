import {
	NonemptyArray,
	Token,
	TOKEN_EBNF as TOKEN,
	ParseNode,
	PARSENODE_EBNF as PARSENODE,
} from './package.js';
import {
	Op,
	Unop,
	Binop,
} from './OperatorEbnf.js';
import * as ASTNODE from './astnode-ebnf/index.js';
import {
	DecoratorReturnType,
	Decorator,
} from './Decorator.js';




export class DecoratorEbnf extends Decorator {
	private static readonly OPS_UN: ReadonlyMap<string, Unop> = new Map<string, Unop>([
		[`+`, Op.PLUS],
		[`#`, Op.HASH],
		[`?`, Op.OPT],
	]);

	private static readonly OPS_BIN: ReadonlyMap<string, Binop> = new Map<string, Binop>([
		[`.`, Op.ORDER],
		[`&`, Op.CONCAT],
		[`|`, Op.ALTERN],
	]);

	private static readonly PARAMOPS: ReadonlyMap<string, boolean | 'inherit'> = new Map<string, boolean | 'inherit'>([
		[`+`, true],
		[`-`, false],
		[`?`, 'inherit'],
	]);


	/**
	 * Return a JSON object describing an EBNF production.
	 * Similar to a node of the Semantic Tree or “decorated/abstract syntax tree”.
	 * @returns a JSON object containing the parse node’s semantics
	 */
	override decorate(node:
		| PARSENODE.ParseNodeParameterSet__0__List
		| PARSENODE.ParseNodeParameterSet
	): NonemptyArray<ASTNODE.ASTNodeParam>;
	override decorate(node:
		| PARSENODE.ParseNodeArgumentSet__0__List
		| PARSENODE.ParseNodeArgumentSet
	): NonemptyArray<ASTNODE.ASTNodeArg>;
	override decorate(node:
		| PARSENODE.ParseNodeConditionSet__0__List
		| PARSENODE.ParseNodeConditionSet
	): NonemptyArray<ASTNODE.ASTNodeCondition>;
	override decorate(node: PARSENODE.ParseNodeReference): ASTNODE.ASTNodeRef;
	override decorate(node:
		| PARSENODE.ParseNodeUnit
		| PARSENODE.ParseNodeUnary
		| PARSENODE.ParseNodeItem
		| PARSENODE.ParseNodeOrder
		| PARSENODE.ParseNodeConcat
		| PARSENODE.ParseNodeAltern
		| PARSENODE.ParseNodeDefinition
	): ASTNODE.ASTNodeExpr;
	override decorate(node: PARSENODE.ParseNodeNonterminalName): ASTNODE.ASTNodeNonterminal;
	override decorate(node: PARSENODE.ParseNodeProduction):      ASTNODE.ASTNodeProduction;
	override decorate(node: PARSENODE.ParseNodeGoal__0__List):   NonemptyArray<ASTNODE.ASTNodeProduction>;
	override decorate(node: PARSENODE.ParseNodeGoal):            ASTNODE.ASTNodeGoal;
	override decorate(node: ParseNode): DecoratorReturnType;
	override decorate(node: ParseNode): DecoratorReturnType {
		if (node instanceof PARSENODE.ParseNodeParameterSet__0__List) {
			function decorateParam(identifier: TOKEN.TokenIdentifier): ASTNODE.ASTNodeParam {
				return new ASTNODE.ASTNodeParam(identifier);
			}
			return (node.children.length === 1)
				? [
					decorateParam(node.children[0] as TOKEN.TokenIdentifier),
				]
				: [
					...this.decorate(node.children[0]),
					decorateParam(node.children[2] as TOKEN.TokenIdentifier),
				]
			;

		} else if (node instanceof PARSENODE.ParseNodeParameterSet) {
			return this.decorate(node.children[1]);

		} else if (node instanceof PARSENODE.ParseNodeArgumentSet__0__List) {
			function decorateArg(identifier: TOKEN.TokenIdentifier, append: TOKEN.TokenPunctuator): ASTNODE.ASTNodeArg {
				return new ASTNODE.ASTNodeArg(identifier, DecoratorEbnf.PARAMOPS.get(append.source)!);
			}
			return (node.children.length === 2)
				? [
					decorateArg(
						node.children[1] as TOKEN.TokenIdentifier,
						node.children[0] as TOKEN.TokenPunctuator,
					),
				]
				: [
					...this.decorate(node.children[0]),
					decorateArg(
						node.children[3] as TOKEN.TokenIdentifier,
						node.children[2] as TOKEN.TokenPunctuator,
					),
				]
			;

		} else if (node instanceof PARSENODE.ParseNodeArgumentSet) {
			return this.decorate(node.children[1]);

		} else if (node instanceof PARSENODE.ParseNodeConditionSet__0__List) {
			function decorateCondition(identifier: TOKEN.TokenIdentifier, include: TOKEN.TokenPunctuator): ASTNODE.ASTNodeCondition {
				return new ASTNODE.ASTNodeCondition(identifier, DecoratorEbnf.PARAMOPS.get(include.source) as boolean);
			}
			return (node.children.length === 2)
				? [
					decorateCondition(
						node.children[0] as TOKEN.TokenIdentifier,
						node.children[1] as TOKEN.TokenPunctuator,
					),
				]
				: [
					...this.decorate(node.children[0]),
					decorateCondition(
						node.children[2] as TOKEN.TokenIdentifier,
						node.children[3] as TOKEN.TokenPunctuator,
					),
				]
			;

		} else if (node instanceof PARSENODE.ParseNodeConditionSet) {
			return this.decorate(node.children[1]);

		} else if (node instanceof PARSENODE.ParseNodeReference) {
			return (node.children.length === 1)
				? new ASTNODE.ASTNodeRef(
					node,
					node.children[0] as TOKEN.TokenIdentifier,
				)
				: new ASTNODE.ASTNodeRef(
					node,
					this.decorate(node.children[0]),
					this.decorate(node.children[1]),
				)
			;

		} else if (node instanceof PARSENODE.ParseNodeUnit) {
			return (node.children.length === 1)
				? (node.children[0] instanceof Token)
					? new ASTNODE.ASTNodeConst(node.children[0] as TOKEN.TokenCharCode | TOKEN.TokenString | TOKEN.TokenCharClass)
					: this.decorate(node.children[0])
				: this.decorate(node.children[1])
			;

		} else if (node instanceof PARSENODE.ParseNodeUnary) {
			let operand: ASTNODE.ASTNodeExpr = this.decorate(node.children[0]);
			if (node.children.length > 1) {
				const operator: string = node.children[1]!.source;
				operand = (operator === '*')
					? new ASTNODE.ASTNodeOpUn(
						node,
						Op.OPT,
						new ASTNODE.ASTNodeOpUn(
							node,
							Op.PLUS,
							operand,
						),
					)
					: new ASTNODE.ASTNodeOpUn(
						node,
						DecoratorEbnf.OPS_UN.get(operator)!,
						operand,
					);
				if (node.children.length > 2) {
					operand = new ASTNODE.ASTNodeOpUn(
						node,
						Op.OPT,
						operand,
					);
				};
			};
			return operand;

		} else if (node instanceof PARSENODE.ParseNodeItem) {
			return (node.children.length === 1)
				? this.decorate(node.children[0])
				: new ASTNODE.ASTNodeItem(
					node,
					this.decorate(node.children[1]),
					this.decorate(node.children[0]) as unknown as NonemptyArray<ASTNODE.ASTNodeCondition>,
				)
			;

		} else if (node instanceof PARSENODE.ParseNodeOrder) {
			return (node.children.length === 1)
				? this.decorate(node.children[0])
				: new ASTNODE.ASTNodeOpBin(
					node,
					Op.ORDER,
					this.decorate(node.children[0]),
					this.decorate((node.children.length === 2) ? node.children[1] : node.children[2]),
				)
			;

		} else if (
			node instanceof PARSENODE.ParseNodeConcat ||
			node instanceof PARSENODE.ParseNodeAltern
		) {
			return (node.children.length === 1)
				? this.decorate(node.children[0])
				: new ASTNODE.ASTNodeOpBin(
					node,
					DecoratorEbnf.OPS_BIN.get(node.children[1].source)!,
					this.decorate(node.children[0]),
					this.decorate(node.children[2]),
				)
			;

		} else if (node instanceof PARSENODE.ParseNodeDefinition) {
			return this.decorate((node.children[0] instanceof PARSENODE.ParseNodeAltern)
				? node.children[0]
				: node.children[1] as PARSENODE.ParseNodeAltern
			);

		} else if (node instanceof PARSENODE.ParseNodeNonterminalName) {
			return (node.children.length === 1)
				? new ASTNODE.ASTNodeNonterminal(
					node,
					node.children[0] as TOKEN.TokenIdentifier,
				)
				: new ASTNODE.ASTNodeNonterminal(
					node,
					this.decorate(node.children[0]),
					this.decorate(node.children[1]),
				)
			;

		} else if (node instanceof PARSENODE.ParseNodeProduction) {
			return new ASTNODE.ASTNodeProduction(
				node,
				this.decorate(node.children[0]),
				this.decorate(node.children[2]),
			);

		} else if (node instanceof PARSENODE.ParseNodeGoal__0__List) {
			return (node.children.length === 1)
				? [
					this.decorate(node.children[0]),
				]
				: [
					...this.decorate(node.children[0]),
					this.decorate(node.children[1]),
				]
			;

		} else if (node instanceof PARSENODE.ParseNodeGoal) {
			return new ASTNODE.ASTNodeGoal(node, (node.children.length === 2) ? [] : this.decorate(node.children[1]));

		} else {
			throw new ReferenceError(`Could not find type of parse node ${ node }.`);
		}
	}
}



export const DECORATOR: DecoratorEbnf = new DecoratorEbnf();
