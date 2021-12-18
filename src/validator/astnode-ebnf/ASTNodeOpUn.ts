import deepStrictEqual from 'fast-deep-equal';
import {
	NonemptyArray,
	Map_hasEq,
	Map_getEq,
	Map_setEq,
	EBNFObject,
	EBNFChoice,
	EBNFSequence,
	ParseNode,
	Op,
	Unop,
} from './package.js';
import type {ConcreteNonterminal} from './utils-private.js';
import type {ASTNodeExpr} from './ASTNodeExpr.js';
import {ASTNodeOp} from './ASTNodeOp.js';



export class ASTNodeOpUn extends ASTNodeOp {
	private static readonly memoized: ReadonlyMap<Unop, Map<EBNFChoice, string>> = new Map<Unop, Map<EBNFChoice, string>>([
		[Op.PLUS, new Map<EBNFChoice, string>()],
		[Op.HASH, new Map<EBNFChoice, string>()],
	]);
	constructor (
		parse_node: ParseNode,
		readonly operator: Unop,
		readonly operand:  ASTNodeExpr,
	) {
		super(parse_node, operator, [operand]);
	}

	override transform(nt: ConcreteNonterminal, data: EBNFObject[]): EBNFChoice {
		return new Map<Unop, (operand: EBNFChoice) => EBNFChoice>([
			[Op.PLUS, (operand) => {
				const memoized: Map<EBNFChoice, string> = ASTNodeOpUn.memoized.get(Op.PLUS)!;
				if (!Map_hasEq(memoized, operand, deepStrictEqual)) {
					const name: string = nt.newSubexprName;
					Map_setEq(memoized, operand, name, deepStrictEqual);
					data.push({
						name,
						defn: operand.flatMap((seq) => [
							seq,
							[{prod: name}, ...seq],
						]) as NonemptyArray<EBNFSequence>,
					});
				};
				return [
					[{prod: Map_getEq(memoized, operand, deepStrictEqual)!}],
				];
			}],
			[Op.HASH, (operand) => {
				const memoized: Map<EBNFChoice, string> = ASTNodeOpUn.memoized.get(Op.HASH)!;
				if (!Map_hasEq(memoized, operand, deepStrictEqual)) {
					const name: string = nt.newSubexprName;
					Map_setEq(memoized, operand, name, deepStrictEqual);
					data.push({
						name,
						defn: operand.flatMap((seq) => [
							seq,
							[{prod: name}, ',', ...seq],
						]) as NonemptyArray<EBNFSequence>,
					});
				};
				return [
					[{prod: Map_getEq(memoized, operand, deepStrictEqual)!}],
				];
			}],
			[Op.OPT, (operand) => {
				return [
					[''],
					...operand,
				];
			}],
		]).get(this.operator)!(this.operand.transform(nt, data));
	}
}
