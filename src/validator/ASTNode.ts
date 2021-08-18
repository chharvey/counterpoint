import type {
	ParseNode,
} from '@chharvey/parser';
import {
	SolidConfig,
	CONFIG_DEFAULT,
} from '../core/index.js';
import {
	ParserSolid as Parser,
} from '../parser/index.js';
import {
	Builder,
	INST,
} from '../builder/index.js';
import type {Buildable} from './Buildable.js';
import {ASTNodeSolid} from './ASTNodeSolid.js';
import type {ASTNodeStatement} from './ASTNodeStatement.js';
import {Decorator} from './Decorator.js';



export * from './ASTNodeKey.js';
export * from './ASTNodeIndexType.js';
export * from './ASTNodeItemType.js';
export * from './ASTNodePropertyType.js';
export * from './ASTNodeIndex.js';
export * from './ASTNodeProperty.js';
export * from './ASTNodeCase.js';
export * from './ASTNodeType.js';
export * from './ASTNodeTypeConstant.js';
export * from './ASTNodeTypeAlias.js';
export * from './ASTNodeTypeTuple.js';
export * from './ASTNodeTypeRecord.js';
export * from './ASTNodeTypeAccess.js';
export * from './ASTNodeTypeOperation.js';
export * from './ASTNodeTypeOperationUnary.js';
export * from './ASTNodeTypeOperationBinary.js';
export * from './ASTNodeExpression.js';
export * from './ASTNodeConstant.js';
export * from './ASTNodeVariable.js';
export * from './ASTNodeTemplate.js';
export * from './ASTNodeTuple.js';
export * from './ASTNodeRecord.js';
export * from './ASTNodeSet.js';
export * from './ASTNodeMapping.js';
export * from './ASTNodeAccess.js';
export * from './ASTNodeOperation.js';
export * from './ASTNodeOperationUnary.js';
export * from './ASTNodeOperationBinary.js';
export * from './ASTNodeOperationBinaryArithmetic.js';
export * from './ASTNodeOperationBinaryComparative.js';
export * from './ASTNodeOperationBinaryEquality.js';
export * from './ASTNodeOperationBinaryLogical.js';
export * from './ASTNodeOperationTernary.js';
export * from './ASTNodeStatement.js';
export * from './ASTNodeDeclaration.js';
export * from './ASTNodeDeclarationType.js';
export * from './ASTNodeDeclarationVariable.js';
export * from './ASTNodeAssignment.js';



export class ASTNodeGoal extends ASTNodeSolid implements Buildable {
	/**
	 * Construct a new ASTNodeGoal from a source text and optionally a configuration.
	 * The source text must parse successfully.
	 * @param src    the source text
	 * @param config the configuration
	 * @returns      a new ASTNodeGoal representing the given source
	 */
	static fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeGoal {
		return Decorator.decorate(new Parser(src, config).parse());
	}
	constructor(
		start_node: ParseNode,
		override readonly children: readonly ASTNodeStatement[],
	) {
		super(start_node, {}, children)
	}
	build(builder: Builder): INST.InstructionNone | INST.InstructionModule {
		return (!this.children.length)
			? new INST.InstructionNone()
			: new INST.InstructionModule([
				...Builder.IMPORTS,
				...(this.children as readonly ASTNodeStatement[]).map((child) => child.build(builder)),
			])
	}
}
