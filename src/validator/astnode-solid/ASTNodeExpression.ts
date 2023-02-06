import * as assert from 'assert';
import type binaryen from 'binaryen';
import {
	SolidConfig,
	CONFIG_DEFAULT,
	SolidType,
	SolidTypeUnit,
	SolidObject,
	Primitive,
	Builder,
	ErrorCode,
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
	#built_bin?: binaryen.ExpressionRef;

	/**
	 * @final
	 */
	override typeCheck(): void {
		super.typeCheck();
		this.type(); // assert does not throw
	}
	/**
	 * @inheritdoc
	 * @implements Buildable
	 * @final
	 */
	public build(_builder: Builder): never {
		throw new Error('OBSOLETE. use `#build_bin` instead');
	}

	public build_bin(builder: Builder): binaryen.ExpressionRef {
		if (!this.#built_bin) {
			const value: SolidObject | null = (this.validator.config.compilerOptions.constantFolding) ? this.fold() : null;
			this.#built_bin = (value) ? value.build(builder).buildBin(builder.module) : this.build_bin_do(builder);
		}
		return this.#built_bin;
	}

	protected abstract build_bin_do(builder: Builder): binaryen.ExpressionRef;

	/**
	 * The Type of this expression.
	 * @return the compile-time type of this node
	 * @final
	 */
	type(): SolidType {
		if (!this.typed) {
			this.typed = this.type_do(); // type-check first, to re-throw any TypeErrors
			if (this.validator.config.compilerOptions.constantFolding) {
				let value: SolidObject | null = null;
				try {
					value = this.fold();
				} catch (err) {
					if (err instanceof ErrorCode) {
						// ignore evaluation errors such as VoidError, NanError, etc.
						this.typed = SolidType.NEVER;
					} else {
						throw err;
					}
				}
				if (!!value && value instanceof Primitive) {
					this.typed = new SolidTypeUnit<Primitive>(value);
				};
			};
		};
		return this.typed;
	}
	protected abstract type_do(): SolidType;
	/**
	 * Assess the value of this node at compile-time, if possible.
	 * If {@link SolidConfig|constant folding} is off, this should not be called.
	 * @return the computed value of this node, or an abrupt completion if the value cannot be computed by the compiler
	 * @final
	 */
	fold(): SolidObject | null {
		return this.assessed ||= this.fold_do();
	}
	protected abstract fold_do(): SolidObject | null;
}
