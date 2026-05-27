import type binaryen from 'binaryen';



export interface BinaryenModuleUpdates extends binaryen.Module {
	readonly ref: binaryen.Module['ref'] & {
		test(value: binaryen.ExpressionRef, castType: binaryen.Type): binaryen.ExpressionRef,
		cast(value: binaryen.ExpressionRef, castType: binaryen.Type): binaryen.ExpressionRef,
	};
	readonly struct: {
		readonly new: (operands: readonly binaryen.ExpressionRef[], type: binaryen.Type) => binaryen.ExpressionRef,
		new_default(type: binaryen.Type): binaryen.ExpressionRef,
		get(index: number, ref: binaryen.ExpressionRef, type: binaryen.Type, isSigned?: boolean): binaryen.ExpressionRef,
		set(index: number, ref: binaryen.ExpressionRef, value: binaryen.ExpressionRef): binaryen.ExpressionRef,
	};
	readonly array: {
		readonly new: (type: binaryen.Type, size: binaryen.ExpressionRef, init: binaryen.ExpressionRef) => binaryen.ExpressionRef,
		new_default(type: binaryen.Type, size: binaryen.ExpressionRef): binaryen.ExpressionRef,
		new_fixed(type: binaryen.Type, values: readonly binaryen.ExpressionRef[]): binaryen.ExpressionRef,
		new_data(type: binaryen.Type, name: string, offset: number, size: binaryen.ExpressionRef): binaryen.ExpressionRef,
		new_elem(type: binaryen.Type, name: string, offset: number, size: binaryen.ExpressionRef): binaryen.ExpressionRef,
		get(ref: binaryen.ExpressionRef, index: binaryen.ExpressionRef, type: binaryen.Type, isSigned?: boolean): binaryen.ExpressionRef,
		set(ref: binaryen.ExpressionRef, index: binaryen.ExpressionRef, value: binaryen.ExpressionRef): binaryen.ExpressionRef,
		len(ref: binaryen.ExpressionRef): binaryen.ExpressionRef,
		fill(ref: binaryen.ExpressionRef, index: binaryen.ExpressionRef, value: binaryen.ExpressionRef, size: binaryen.ExpressionRef): binaryen.ExpressionRef,
		copy(destRef: binaryen.ExpressionRef, destIndex: binaryen.ExpressionRef, srcRef: binaryen.ExpressionRef, srcIndex: binaryen.ExpressionRef, length: binaryen.ExpressionRef): binaryen.ExpressionRef,
		init_data(name: string, ref: binaryen.ExpressionRef, index: binaryen.ExpressionRef, offset: binaryen.ExpressionRef, size: binaryen.ExpressionRef): binaryen.ExpressionRef,
		init_elem(name: string, ref: binaryen.ExpressionRef, index: binaryen.ExpressionRef, offset: binaryen.ExpressionRef, size: binaryen.ExpressionRef): binaryen.ExpressionRef,
	};
}
export type Field = {
	type:       binaryen.Type,
	packedType: binaryen.Type,
	mutable:    boolean,
};
export interface TypeBuilder {
	grow(count: number): void;
	getSize(): number;
	setSignatureType(index: number, paramTypes: binaryen.Type[], resultTypes: binaryen.Type[]): void;
	setStructType(index: number, fields: Field[]): void;
	setArrayType(index: number, elementType: binaryen.Type, elementPackedType: binaryen.Type, elementMutable: boolean): void;
	getTempHeapType(index: number): binaryen.Type;
	getTempRefType(heapType: binaryen.Type, nullable: boolean): binaryen.Type;
	setSubType(index: number, superType: binaryen.Type): void;
	setOpen(index: number): void;
	buildAndDispose(): binaryen.Type[];

	/* eslint-disable @typescript-eslint/no-unsafe-function-type */
	getTempTupleType: Function;
	createRecGroup:   Function;
	/* eslint-enable @typescript-eslint/no-unsafe-function-type */
}
