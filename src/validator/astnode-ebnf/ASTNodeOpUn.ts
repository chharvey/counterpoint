import * as xjs from 'extrajs';
import deepStrictEqual from 'fast-deep-equal';
import {
	NonemptyArray,
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
	private static readonly memoized: ReadonlyMap<Unop, xjs.MapEq<EBNFChoice, string>> = new Map<Unop, xjs.MapEq<EBNFChoice, string>>([
		[Op.PLUS, new xjs.MapEq<EBNFChoice, string>(deepStrictEqual)],
		[Op.HASH, new xjs.MapEq<EBNFChoice, string>(deepStrictEqual)],
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
				const memoized: xjs.MapEq<EBNFChoice, string> = ASTNodeOpUn.memoized.get(Op.PLUS)!;
				if (!memoized.has(operand)) {
					const name: string = nt.newSubexprName;
					memoized.set(operand, name);
					data.push({
						name,
						defn: operand.flatMap((seq) => [
							seq,
							[{prod: name}, ...seq],
						]) as NonemptyArray<EBNFSequence>,
					});
				};
				return [
					[{prod: memoized.get(operand)!}],
				];
			}],
			[Op.HASH, (operand) => {
				const memoized: xjs.MapEq<EBNFChoice, string> = ASTNodeOpUn.memoized.get(Op.HASH)!;
				if (!memoized.has(operand)) {
					const name: string = nt.newSubexprName;
					memoized.set(operand, name);
					data.push({
						name,
						defn: operand.flatMap((seq) => [
							seq,
							[{prod: name}, ',', ...seq],
						]) as NonemptyArray<EBNFSequence>,
					});
				};
				return [
					[{prod: memoized.get(operand)!}],
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
