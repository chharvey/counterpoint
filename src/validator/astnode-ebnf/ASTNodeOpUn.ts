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
import {
	Mutable,
	FAMILY_SYMBOL,
	ConcreteNonterminal,
} from './utils-private.js';
import type {ASTNodeExpr} from './ASTNodeExpr.js';
import {ASTNodeOp} from './ASTNodeOp.js';



export class ASTNodeOpUn extends ASTNodeOp {
	private static readonly memoized: ReadonlyMap<Unop, Map<EBNFChoice, string>> = new Map<Unop, Map<EBNFChoice, string>>([
		[Op.PLUS, new Map<EBNFChoice, string>()],
		[Op.HASH, new Map<EBNFChoice, string>()],
	]);
	private static createFamily(
		nt:         ConcreteNonterminal,
		has_params: boolean,
		data:       EBNFObject[],
		operand:    EBNFChoice,
		name:       string,
		mapper:     (seq: EBNFSequence) => NonemptyArray<EBNFSequence>,
	): EBNFObject {
		const json: Mutable<EBNFObject> = {
			name,
			defn: operand.flatMap(mapper) as NonemptyArray<EBNFSequence>,
		};
		if (has_params) {
			const family_name: string = [
				nt.name,
				FAMILY_SYMBOL,
				name.slice(nt.toString().length), // '__0__List'
			].join('');
			const found: EBNFObject | null = data.find((ebnf) => ebnf.name === family_name) || null;
			json.family = family_name;
			if (found) {
				(found.defn as NonemptyArray<EBNFSequence>).push(...json.defn);
			} else {
				data.push({
					name: family_name,
					family: true,
					defn: [...json.defn],
				});
			}
		}
		return json;
	}

	constructor (
		parse_node: ParseNode,
		readonly operator: Unop,
		readonly operand:  ASTNodeExpr,
	) {
		super(parse_node, operator, [operand]);
	}

	override transform(nt: ConcreteNonterminal, has_params: boolean, data: EBNFObject[]): EBNFChoice {
		return new Map<Unop, (operand: EBNFChoice) => EBNFChoice>([
			[Op.PLUS, (operand) => {
				const memoized: Map<EBNFChoice, string> = ASTNodeOpUn.memoized.get(Op.PLUS)!;
				if (!Map_hasEq(memoized, operand, deepStrictEqual)) {
					const name: string = nt.newSubexprName;
					Map_setEq(memoized, operand, name, deepStrictEqual);
					data.push(ASTNodeOpUn.createFamily(nt, has_params, data, operand, name, (seq) => [
						seq,
						[{prod: name}, ...seq],
					]));
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
					data.push(ASTNodeOpUn.createFamily(nt, has_params, data, operand, name, (seq) => [
						seq,
						[{prod: name}, ',', ...seq],
					]));
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
		]).get(this.operator)!(this.operand.transform(nt, has_params, data));
	}
}
