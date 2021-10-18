import {ErrorCode} from '@chharvey/parser';
import * as assert from 'assert';
import {
	SolidConfig,
	CONFIG_DEFAULT,
	SolidType,
	SolidTypeUnit,
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
	 * Decorator for {@link ASTNodeExpression#type} method and any overrides.
	 * Type-checks and re-throws any type errors first,
	 * then computes assessed value (if applicable), and if successful,
	 * returns a constant type equal to that assessed value.
	 * @param   _prototype    the prototype that has the method to be decorated
	 * @param   _property_key the name of the method to be decorated
	 * @param   descriptor    the Property Descriptor of the prototype’s method
	 * @returns               `descriptor`, with a new value that is the decorated method
	 */
	protected static typeDeco(
		_prototype: ASTNodeExpression,
		_property_key: string,
		descriptor: TypedPropertyDescriptor<(this: ASTNodeExpression, validator: Validator) => SolidType>,
	): typeof descriptor {
		const method = descriptor.value!;
		descriptor.value = function (validator) {
			const type: SolidType = method.call(this, validator); // type-check first, to re-throw any TypeErrors
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
					return new SolidTypeUnit(value);
				};
			};
			return type;
		};
		return descriptor;
	}
	/**
	 * Decorator for {@link ASTNodeExpression#build} method and any overrides.
	 * First tries to compute the assessed value, and if successful, builds the assessed value.
	 * Otherwise builds this node.
	 * @param   _prototype    the prototype that has the method to be decorated
	 * @param   _property_key the name of the method to be decorated
	 * @param   descriptor    the Property Descriptor of the prototype’s method
	 * @returns               `descriptor`, with a new value that is the decorated method
	 */
	protected static buildDeco<T extends INST.InstructionExpression>(
		_prototype: ASTNodeExpression,
		_property_key: string,
		descriptor: TypedPropertyDescriptor<(this: ASTNodeExpression, builder: Builder, to_float?: boolean) => INST.InstructionConst | T>,
	): typeof descriptor {
		const method = descriptor.value!;
		descriptor.value = function (builder, to_float = false) {
			const value: SolidObject | null = (builder.config.compilerOptions.constantFolding) ? this.fold(builder.validator) : null;
			return (!!value) ? INST.InstructionConst.fromCPValue(value, to_float) : method.call(this, builder, to_float);
		};
		return descriptor;
	}
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
	 */
	abstract build(builder: Builder, to_float?: boolean): INST.InstructionExpression;
	/**
	 * The Type of this expression.
	 * @param validator stores validation and configuration information
	 * @return the compile-time type of this node
	 */
	abstract type(validator: Validator): SolidType;
	/**
	 * Assess the value of this node at compile-time, if possible.
	 * If {@link SolidConfig|constant folding} is off, this should not be called.
	 * @param validator stores validation and configuration information
	 * @return the computed value of this node, or an abrupt completion if the value cannot be computed by the compiler
	 */
	abstract fold(validator: Validator): SolidObject | null;
}
