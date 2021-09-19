import type {
	ASTNode,
} from '@chharvey/parser';
import type {SolidType} from './package.js';
import {MutabilityError} from './MutabilityError.js';



export class MutabilityError01 extends MutabilityError {
	static override readonly CODE = 1;
	constructor (node: ASTNode, typ: SolidType) {
		super(`Mutation of an object of immutable type \`${ typ }\`.`, MutabilityError01.CODE, node.line_index, node.col_index);
	}
}
