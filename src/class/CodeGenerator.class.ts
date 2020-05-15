import Util from './Util.class'
import type {
	Operator,
} from './SemanticNode.class'



function assertStackLength(stack: string, length: number): string {
	return `if (${stack}.length < ${length}) { throw new Error('Operand stack does not have enough operands.') };`
}

/**
 * The Code Generator.
 */
export default class CodeGenerator {
	/** Commonly used names. */
	private static readonly NAMES = {
		stack_classname: `OperandStack`,
		int_classname: `Int16`,
		stack_name: `STACK`,
	}


	/** The list of stack instructions to perform. */
	private readonly instructions: string[] = []

	/**
	 * Construct a new CodeGenerator object.
	 */
	constructor() {
	}

	/**
	 * Throw an error at runtime.
	 * @return this
	 */
	unreachable(): this {
		this.instructions.push(`throw new Error()`)
		return this
	}

	/**
	 * Do nothing at runtime.
	 * @return this
	 */
	nop(): this {
		return this
	}

	/**
	 * Push a constant onto the stack.
	 * @param i32 the constant to push
	 * @return this
	 */
	const(i32: number): this {
		this.instructions.push(`${CodeGenerator.NAMES.stack_name}.push(${i32})`)
		return this
	}

	/**
	 * Perform an operation on the stack.
	 * @param op the operation to perform
	 * @return this
	 */
	perform(op: Operator): this {
		const Operator_export: typeof Operator = require('./SemanticNode.class').Operator
		this.instructions.push(`${Operator_export[op]}(${CodeGenerator.NAMES.stack_name})`)
		return this
	}

	/**
	 * Return the instructions to print to file.
	 */
	print(): string {
		const Operator_export: typeof Operator = require('./SemanticNode.class').Operator
		return Util.dedent(`
			type ${CodeGenerator.NAMES.int_classname} = number
			type ${CodeGenerator.NAMES.stack_classname} = ${CodeGenerator.NAMES.int_classname}[]
			const ${Operator_export[Operator_export.ADD]} = (stack: ${CodeGenerator.NAMES.stack_classname}): void => { ${assertStackLength('stack', 2)} const arg2: ${CodeGenerator.NAMES.int_classname} = stack.pop() !; const arg1: ${CodeGenerator.NAMES.int_classname} = stack.pop() !; stack.push(arg1 +  arg2) }
			const ${Operator_export[Operator_export.MUL]} = (stack: ${CodeGenerator.NAMES.stack_classname}): void => { ${assertStackLength('stack', 2)} const arg2: ${CodeGenerator.NAMES.int_classname} = stack.pop() !; const arg1: ${CodeGenerator.NAMES.int_classname} = stack.pop() !; stack.push(arg1 *  arg2) }
			const ${Operator_export[Operator_export.DIV]} = (stack: ${CodeGenerator.NAMES.stack_classname}): void => { ${assertStackLength('stack', 2)} const arg2: ${CodeGenerator.NAMES.int_classname} = stack.pop() !; const arg1: ${CodeGenerator.NAMES.int_classname} = stack.pop() !; stack.push(arg1 /  arg2) }
			const ${Operator_export[Operator_export.EXP]} = (stack: ${CodeGenerator.NAMES.stack_classname}): void => { ${assertStackLength('stack', 2)} const arg2: ${CodeGenerator.NAMES.int_classname} = stack.pop() !; const arg1: ${CodeGenerator.NAMES.int_classname} = stack.pop() !; stack.push(arg1 ** arg2) }
			const ${Operator_export[Operator_export.NEG]} = (stack: ${CodeGenerator.NAMES.stack_classname}): void => { ${assertStackLength('stack', 1)} stack.push(-stack.pop() !) }
			const ${CodeGenerator.NAMES.stack_name}: ${CodeGenerator.NAMES.stack_classname} = []
			${this.instructions.join('\n')}
			export default ${CodeGenerator.NAMES.stack_name}.pop()
		`)
	}
}
