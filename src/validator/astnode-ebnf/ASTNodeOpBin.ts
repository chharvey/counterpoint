import {
	NonemptyArray,
	EBNFObject,
	EBNFChoice,
	EBNFSequence,
	ParseNode,
	Op,
	Binop,
} from './package.js';
import type {ConcreteNonterminal} from './utils-private.js';
import type {ASTNodeExpr} from './ASTNodeExpr.js';
import {ASTNodeOp} from './ASTNodeOp.js';



export class ASTNodeOpBin extends ASTNodeOp {
	constructor (
		parse_node: ParseNode,
		readonly operator: Binop,
		readonly operand0: ASTNodeExpr,
		readonly operand1: ASTNodeExpr,
	) {
		super(parse_node, operator, [operand0, operand1]);
	}

	override transform(nt: ConcreteNonterminal, data: EBNFObject[]): EBNFChoice {
		const trans0: EBNFChoice = this.operand0.transform(nt, data);
		const trans1: EBNFChoice = this.operand1.transform(nt, data);
		return new Map<Binop, () => EBNFChoice>([
			[Op.ORDER, () => trans0.flatMap((seq0) =>
				trans1.flatMap((seq1) => [
					[...seq0, ...seq1],
				] as const)
			) as NonemptyArray<EBNFSequence>],
			[Op.CONCAT, () => trans0.flatMap((seq0) =>
				trans1.flatMap((seq1) => [
					[...seq0, ...seq1],
					[...seq1, ...seq0],
				] as const)
			) as NonemptyArray<EBNFSequence>],
			[Op.ALTERN, () => [
				...trans0,
				...trans1,
			]],
		]).get(this.operator)!();
	}
}
