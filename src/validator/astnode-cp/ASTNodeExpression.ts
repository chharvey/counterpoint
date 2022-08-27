import * as assert from 'assert';
import {
	CPConfig,
	CONFIG_DEFAULT,
	TYPE,
	OBJ,
	INST,
	Builder,
	ErrorCode,
} from './package.js';
import {
	ASTNodeStatement,
	ASTNodeStatementExpression,
} from './index.js';
import type {Buildable} from './Buildable.js';
import {ASTNodeCP} from './ASTNodeCP.js';



/**
 * A sematic node representing an expression.
 * Known subclasses:
 * - ASTNodeConstant
 * - ASTNodeVariable
 * - ASTNodeTemplate
 * - ASTNodeCollectionLiteral
 * - ASTNodeAccess
 * - ASTNodeCall
 * - ASTNodeClaim
 * - ASTNodeOperation
 */
export abstract class ASTNodeExpression extends ASTNodeCP implements Buildable {
	/**
	 * Construct a new ASTNodeExpression from a source text and optionally a configuration.
	 * The source text must parse successfully.
	 * @param src    the source text
	 * @param config the configuration
	 * @returns      a new ASTNodeExpression representing the given source
	 */
	static fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeExpression {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert.ok(statement instanceof ASTNodeStatementExpression);
		assert.ok(statement.expr, 'semantic statement should have 1 child');
		return statement.expr;
	}

	private typed?: TYPE.Type;
	private assessed?: OBJ.Object | null;
	private built?: INST.InstructionExpression;
	/**
	 * Determine whether this expression should build to a float-type instruction.
	 * @return Should the built instruction be type-coerced into a floating-point number?
	 */
	abstract shouldFloat(): boolean;
	/**
	 * @final
	 */
	override typeCheck(): void {
		super.typeCheck();
		this.type(); // assert does not throw
	}

	/**
	 * @inheritdoc
	 * @param to_float Should the returned instruction be type-coerced into a floating-point number?
	 * @implements Buildable
	 * @final
	 */
	build(builder: Builder, to_float?: boolean): INST.InstructionExpression {
		if (!this.built) {
			const value: OBJ.Object | null = (this.validator.config.compilerOptions.constantFolding) ? this.fold() : null;
			this.built = (!!value) ? INST.InstructionConst.fromCPValue(value, to_float) : this.build_do(builder, to_float);
		}
		return this.built;
	}

	protected abstract build_do(builder: Builder, to_float?: boolean): INST.InstructionExpression;
	/**
	 * The Type of this expression.
	 * @return the compile-time type of this node
	 * @final
	 */
	type(): TYPE.Type {
		if (!this.typed) {
			this.typed = this.type_do(); // type-check first, to re-throw any TypeErrors
			if (this.validator.config.compilerOptions.constantFolding) {
				let value: OBJ.Object | null = null;
				try {
					value = this.fold();
				} catch (err) {
					if (err instanceof ErrorCode) {
						// ignore evaluation errors such as VoidError, NanError, etc.
						this.typed = TYPE.Type.NEVER;
					} else {
						throw err;
					}
				}
				if (!!value && value instanceof OBJ.Primitive) {
					this.typed = new TYPE.TypeUnit(value);
				};
			};
		};
		return this.typed;
	}

	protected abstract type_do(): TYPE.Type;
	/**
	 * Assess the value of this node at compile-time, if possible.
	 * If {@link CPConfig|constant folding} is off, this should not be called.
	 * @return the computed value of this node, or an abrupt completion if the value cannot be computed by the compiler
	 * @final
	 */
	fold(): OBJ.Object | null {
		return this.assessed ||= this.fold_do();
	}

	protected abstract fold_do(): OBJ.Object | null;
}
