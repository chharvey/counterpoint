import {ErrorCode} from '@chharvey/parser';
import * as assert from 'assert';
import {
	SolidConfig,
	CONFIG_DEFAULT,
	SolidType,
	SolidTypeConstant,
	SolidObject,
	Primitive,
	INST,
	Builder,
	Validator,
} from './package.js';
import {
	ASTNodeStatement,
	ASTNodeStatementExpression,
} from './index.js';
import type {Buildable} from './Buildable.js';
import {ASTNodeSolid} from './ASTNodeSolid.js';



/**
 * A sematic node representing an expression.
 * Known subclasses:
 * - ASTNodeConstant
 * - ASTNodeVariable
 * - ASTNodeTemplate
 * - ASTNodeCollectionLiteral
 * - ASTNodeAccess
 * - ASTNodeCall
 * - ASTNodeOperation
 */
export abstract class ASTNodeExpression extends ASTNodeSolid implements Buildable {
	/**
	 * Construct a new ASTNodeExpression from a source text and optionally a configuration.
	 * The source text must parse successfully.
	 * @param src    the source text
	 * @param config the configuration
	 * @returns      a new ASTNodeExpression representing the given source
	 */
	static fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeExpression {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert.ok(statement instanceof ASTNodeStatementExpression);
		assert.ok(statement.expr, 'semantic statement should have 1 child');
		return statement.expr;
	}
	private typed?: SolidType;
	private assessed?: SolidObject | null;
	private built?: INST.InstructionExpression;
	/**
	 * Determine whether this expression should build to a float-type instruction.
	 * @return Should the built instruction be type-coerced into a floating-point number?
	 */
	abstract shouldFloat(validator: Validator): boolean;
	/**
	 * @final
	 */
	override typeCheck(validator: Validator): void {
		super.typeCheck(validator);
		this.type(validator); // assert does not throw
	}
	/**
	 * @param to_float Should the returned instruction be type-coerced into a floating-point number?
	 * @final
	 */
	build(builder: Builder, to_float?: boolean): INST.InstructionExpression {
		if (!this.built) {
			const value: SolidObject | null = (builder.config.compilerOptions.constantFolding) ? this.fold(builder.validator) : null;
			this.built = (!!value) ? INST.InstructionConst.fromCPValue(value, to_float) : this.build_do(builder, to_float);
		}
		return this.built;
	}
	protected abstract build_do(builder: Builder, to_float?: boolean): INST.InstructionExpression;
	/**
	 * The Type of this expression.
	 * @param validator stores validation and configuration information
	 * @return the compile-time type of this node
	 * @final
	 */
	type(validator: Validator): SolidType {
		if (!this.typed) {
			this.typed = this.type_do(validator); // type-check first, to re-throw any TypeErrors
			if (validator.config.compilerOptions.constantFolding) {
				let value: SolidObject | null = null;
				try {
					value = this.fold(validator);
				} catch (err) {
					if (err instanceof ErrorCode) {
						// ignore evaluation errors such as VoidError, NanError, etc.
						return SolidType.NEVER;
					} else {
						throw err;
					}
				}
				if (!!value && value instanceof Primitive) {
					this.typed = new SolidTypeConstant(value);
				};
			};
		};
		return this.typed;
	}
	protected abstract type_do(validator: Validator): SolidType;
	/**
	 * Assess the value of this node at compile-time, if possible.
	 * If {@link SolidConfig|constant folding} is off, this should not be called.
	 * @param validator stores validation and configuration information
	 * @return the computed value of this node, or an abrupt completion if the value cannot be computed by the compiler
	 * @final
	 */
	fold(validator: Validator): SolidObject | null {
		return this.assessed ||= this.fold_do(validator);
	}
	protected abstract fold_do(validator: Validator): SolidObject | null;
}
