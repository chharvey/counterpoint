import type * as TOKEN from '@chharvey/parser/dist/ebnf/Token.js';
import type {
	NonemptyArray,
	EBNFObject,
	EBNFChoice,
	ParseNode,
} from './package.js';
import {
	PARAM_SEPARATOR,
	ConcreteNonterminal,
} from './utils-private.js';
import type {ASTNodeArg} from './ASTNodeArg.js';
import {ASTNodeExpr} from './ASTNodeExpr.js';



export class ASTNodeRef extends ASTNodeExpr {
	constructor (parse_node: ParseNode, ref: TOKEN.TokenIdentifier);
	constructor (parse_node: ParseNode, ref: ASTNodeRef, args: readonly ASTNodeArg[]);
	constructor (
		parse_node: ParseNode,
		private readonly ref:  TOKEN.TokenIdentifier | ASTNodeRef,
		private readonly args: readonly ASTNodeArg[] = [],
	) {
		super(
			parse_node,
			{name: (ref instanceof ASTNodeRef) ? ref.name : ref.source},
			(ref instanceof ASTNodeRef) ? [ref, ...args] : [],
		);
	}
	private readonly name: string = (this.ref instanceof ASTNodeRef) ? this.ref.name : this.ref.source;

	override transform(nt: ConcreteNonterminal, _data: EBNFObject[]): EBNFChoice {
		return (this.name === this.name.toUpperCase())
			/* ALLCAPS: terminal identifier */
			? [
				[{term: this.name}],
			]
			/* TitleCase: production identifier */
			: this.expand(nt).flatMap((cr) => [
				[{prod: cr.toString()}],
			]) as NonemptyArray<[{prod: string}]>
		;
	}

	/**
	 * Expands this reference in its abstract form into a set of references with concrete arguments.
	 * - E.g., expands `R<+Z>` into `[R_Z]`.
	 * - E.g., expands `R<+X, +Y>` into `[R_X, R_Y, R_X_Y]`.
	 * - E.g., expands `R<+X, -Y>` into `[R, R_X]`.
	 * - E.g., expands `R<-Y, +X>` into `[R, R_X]`.
	 * - E.g., expands `R<-Z, +Z>` into `[R, R_Z]`.
	 * @param   nt a specific nonterminal symbol that contains this expression
	 * @returns    an array of objects representing references
	 */
	private expand(nt: ConcreteNonterminal): NonemptyArray<ConcreteReference> {
		const args: readonly ASTNodeArg[] = this.args.filter((arg) => arg.append === true || arg.append === 'inherit' && nt.hasSuffix(arg));
		return (args.length)
			? (this.ref as ASTNodeRef).expand(nt).flatMap((cr) =>
				[...new Array(2 ** args.length)].map((_, count) =>
					new ConcreteReference(cr.name, [
						...cr.suffixes,
						...[...count.toString(2).padStart(args.length, '0')]
							.map((d, i) => [args[i], !!+d] as const)
							.filter(([_arg, b]) => !!b)
							.map(([arg, _b]) => arg)
						,
					], nt)
				).slice((this.args.length === args.length) ? 1 : 0) // slice off the \b00 case for `R<+X, +Y>` because it should never give `R`.
			) as NonemptyArray<ConcreteReference>
			: (this.args.length)
				? (this.ref as ASTNodeRef).expand(nt)
				: [new ConcreteReference(this.name)]
		;
	}
}



class ConcreteReference {
	constructor (
		readonly name: string,
		readonly suffixes: ASTNodeArg[] = [],
		readonly nonterminal?: ConcreteNonterminal,
	) {
	}

	/** @override */
	toString(): string {
		return this.name.concat(...this.suffixes.flatMap((s) =>
			(s.append === true || s.append === 'inherit' && this.nonterminal?.hasSuffix(s))
				? [PARAM_SEPARATOR, s.source]
				: ''
		));
	}
}
