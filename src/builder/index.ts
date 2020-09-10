export {default as Builder}     from './Builder.class'
export {default as Instruction} from './Instruction.class'
export {
	InstructionNone,
	InstructionExpression,
	InstructionConst,
	InstructionSet,
	InstructionGet,
	InstructionTee,
	InstructionUnop,
	InstructionBinop,
	InstructionBinopArithmetic,
	InstructionBinopComparative,
	InstructionBinopEquality,
	InstructionBinopLogical,
	InstructionCond,
	InstructionStatement,
	InstructionModule,
} from './Instruction.class'
