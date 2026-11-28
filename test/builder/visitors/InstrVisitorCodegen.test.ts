import * as test from 'node:test';
import type * as binaryen from 'binaryen.ts';
import * as xjs from 'extrajs';
import {
	type AST,
	OP,
} from '../../../src/index.ts';
import {
	assertEqualBins,
	genConst,
	setupScript,
} from '../../utils.ts';



test.suite('InstrVisitorCodegen#visit', () => {
	test.test('Drop returns (drop).', () => {
		const {builder, cg, wasm, visitors: {codegen: {instr: VISITOR}}} = setupScript(`{
			null;
			false;
			@hello;
			42;
			4.2;
		}`, {codegen: false});
		return assertEqualBins(
			builder.instructions.map((instr) => VISITOR.visit(instr)),
			[
				wasm.drop(genConst(cg)),
				wasm.drop(genConst(cg, false)),
				wasm.drop(genConst(cg, 'hello', 'sym')),
				wasm.drop(genConst(cg, 42n)),
				wasm.drop(genConst(cg, 4.2)),
			],
		);
	});


	test.test('Decl & Set both return (local.set).', () => {
		const {builder, cg, wasm, visitors: {codegen: {instr: VISITOR}}} = setupScript(`{
			val mut a: null  = null;
			val mut b: bool  = false;
			val mut c: sym   = @hello;
			val mut d: int   = 42;
			val mut e: float = 4.2;
			val mut f?: str;

			set a = null;
			set b = true;
			set c = @world;
			set d = 43;
			set e = 4.3;
			set f = "hello";
			delete f;
		}`, {codegen: false});
		const value_default: binaryen.ExpressionRef /* (ref $Value) */ = wasm.struct.new_default(cg.vm.heaptype.Value);
		return assertEqualBins(
			builder.instructions.map((instr) => VISITOR.visit(instr)),
			[
				wasm.local.set(0, value_default),
				wasm.local.set(0, genConst(cg)),
				wasm.local.set(1, value_default),
				wasm.local.set(1, genConst(cg, false)),
				wasm.local.set(2, value_default),
				wasm.local.set(2, genConst(cg, 'hello', 'sym')),
				wasm.local.set(3, value_default),
				wasm.local.set(3, genConst(cg, 42n)),
				wasm.local.set(4, value_default),
				wasm.local.set(4, genConst(cg, 4.2)),
				wasm.local.set(5, value_default),
				wasm.local.set(5, cg.codegenMaybe()),

				wasm.local.set(0, genConst(cg)),
				wasm.local.set(1, genConst(cg, true)),
				wasm.local.set(2, genConst(cg, 'world', 'sym')),
				wasm.local.set(3, genConst(cg, 43n)),
				wasm.local.set(4, genConst(cg, 4.3)),
				wasm.local.set(5, cg.codegenMaybe(genConst(cg, 'hello'))),
				wasm.local.set(5, cg.codegenMaybe()),
			],
		);
	});


	test.suite('CollectionDynamicSet', () => {
		test.test('LIST.SET', () => {
			const {builder, cg, wasm, visitors: {codegen: {instr: VISITOR}}} = setupScript(`{
				val mut x:    int       = 42;
				val mut list: mut [int] = [42, 43];

				set [x, 43, 44].[1 + 1] = 45;
				set list.[0] = 46;
				set list.[2] = 47;
			}`);
			const {reftype, Vect, Value, List} = cg.vm;
			return assertEqualBins(builder.instructions.slice(8).map((instr) => VISITOR.visit(instr)), [
				List.set(
					Value.asList(wasm.local.get(2, reftype.Value)),
					wasm.i32.wrap_i64(Vect.asInt(Value.asPrimitive(wasm.local.get(3, reftype.Value)))),
					genConst(cg, 45n),
				),
				List.set(
					Value.asList(wasm.local.get(1, reftype.Value)),
					wasm.i32.wrap_i64(Vect.asInt(Value.asPrimitive(genConst(cg, 0n)))),
					genConst(cg, 46n),
				),
				List.set(
					Value.asList(wasm.local.get(1, reftype.Value)),
					wasm.i32.wrap_i64(Vect.asInt(Value.asPrimitive(genConst(cg, 2n)))),
					genConst(cg, 47n),
				),
			]);
		});
		test.test('DICT.SET', () => {
			const {builder, cg, wasm, visitors: {codegen: {instr: VISITOR}}} = setupScript(`{
				val mut x:    int        = 42;
				val mut dict: mut [:int] = [a= 42, c= 43];

				set [a= x, b= 43, c= 44].[@b] = 45;
				set dict.[@a] = 46;
				set dict.[@c] = 47;
			}`);
			const {reftype, Vect, Value, Dict} = cg.vm;
			return assertEqualBins(builder.instructions.slice(6).map((instr) => VISITOR.visit(instr)), [
				Dict.set(
					Value.asDict(wasm.local.get(2, reftype.Value)),
					Vect.asNat(Value.asPrimitive(genConst(cg, 'b', 'sym'))),
					genConst(cg, 45n),
				),
				Dict.set(
					Value.asDict(wasm.local.get(1, reftype.Value)),
					Vect.asNat(Value.asPrimitive(genConst(cg, 'a', 'sym'))),
					genConst(cg, 46n),
				),
				Dict.set(
					Value.asDict(wasm.local.get(1, reftype.Value)),
					Vect.asNat(Value.asPrimitive(genConst(cg, 'c', 'sym'))),
					genConst(cg, 47n),
				),
			]);
		});
		test.test('SET.SET', () => {
			const {builder, cg, wasm, visitors: {codegen: {instr: VISITOR}}} = setupScript(`{
				val 'set': mut {float} = {4.2, 2.4};
				set 'set'.[4.2] = false;
				set 'set'.[3.3] = true;
			}`, {codegen: false});
			const {reftype, Vect, Value, Map: VmMap} = cg.vm;
			const base:           binaryen.ExpressionRef = wasm.local.get(0, reftype.Value);
			const base_get_0:     binaryen.ExpressionRef = wasm.local.get(1, reftype.Map);
			const accessor_get_0: binaryen.ExpressionRef = wasm.local.get(2, reftype.Value);
			const base_get_1:     binaryen.ExpressionRef = wasm.local.get(3, reftype.Map);
			const accessor_get_1: binaryen.ExpressionRef = wasm.local.get(4, reftype.Value);
			VISITOR.visit(builder.instructions[0]);
			return assertEqualBins(builder.instructions.slice(2).map((instr) => VISITOR.visit(instr)), [
				wasm.block(null, [
					wasm.local.set(1, Value.asMap(base)),
					wasm.local.set(2, genConst(cg, 4.2)),
					wasm.if(
						Vect.isConst(Value.asPrimitive(genConst(cg, false)), true),
						VmMap.set(base_get_0, accessor_get_0, genConst(cg)),
						wasm.drop(VmMap.delete(base_get_0, accessor_get_0)),
					),
				]),
				wasm.block(null, [
					wasm.local.set(3, Value.asMap(base)),
					wasm.local.set(4, genConst(cg, 3.3)),
					wasm.if(
						Vect.isConst(Value.asPrimitive(genConst(cg, true)), true),
						VmMap.set(base_get_1, accessor_get_1, genConst(cg)),
						wasm.drop(VmMap.delete(base_get_1, accessor_get_1)),
					),
				]),
			]);
		});
		test.test('MAP.SET', () => {
			const {builder, cg, wasm, visitors: {codegen: {instr: VISITOR}}} = setupScript(`{
				val map: mut {float -> int} = {4.2 -> 42, 2.4 -> 24};
				set map.[4.2] = 21;
				set map.[3.3] = 21;
			}`);
			const {reftype, Value, Map: VmMap} = cg.vm;
			const base: binaryen.ExpressionRef = wasm.local.get(0, reftype.Value);
			return assertEqualBins(builder.instructions.slice(2).map((instr) => VISITOR.visit(instr)), [
				VmMap.set(Value.asMap(base), genConst(cg, 4.2), genConst(cg, 21n)),
				VmMap.set(Value.asMap(base), genConst(cg, 3.3), genConst(cg, 21n)),
			]);
		});
	});


	test.suite('CollectionDynamicCopy', () => {
		test.suite('LIST.COPY', () => {
			test.test('tuple argument.', () => {
				const {builder, cg, wasm, visitors: {codegen: {instr: VISITOR}}} = setupScript(`{
					List.<int>((2, 3, 5));
				}`, {codegen: false});
				const {reftype, Value, List} = cg.vm;
				xjs.Array.forEachAggregated(builder.instructions.slice(0, 4), (instr) => VISITOR.visit(instr));
				return assertEqualBins(
					VISITOR.visit(builder.instructions[4]),
					List.copyFromTuple(
						Value.asList (wasm.local.get(0, reftype.Value)),
						Value.asTuple(wasm.local.get(1, reftype.Value)),
					),
				);
			});
			test.test('List argument.', () => {
				const {builder, cg, wasm, visitors: {codegen: {instr: VISITOR}}} = setupScript(`{
					List.<int>([2, 3, 5]);
				}`, {codegen: false});
				const {reftype, Value, List} = cg.vm;
				xjs.Array.forEachAggregated(builder.instructions.slice(0, 4), (instr) => VISITOR.visit(instr));
				return assertEqualBins(
					VISITOR.visit(builder.instructions[4]),
					List.copyFromList(
						Value.asList(wasm.local.get(0, reftype.Value)),
						Value.asList(wasm.local.get(1, reftype.Value)),
					),
				);
			});
			test.test('Set argument.', () => {
				const {builder, cg, wasm, visitors: {codegen: {instr: VISITOR}}} = setupScript(`{
					List.<int>({2, 3, 5});
				}`, {codegen: false});
				const {reftype, Value, List} = cg.vm;
				xjs.Array.forEachAggregated(builder.instructions.slice(0, 4), (instr) => VISITOR.visit(instr));
				return assertEqualBins(
					VISITOR.visit(builder.instructions[4]),
					List.fillFromSet(
						Value.asList(wasm.local.get(0, reftype.Value)),
						Value.asMap (wasm.local.get(1, reftype.Value)),
					),
				);
			});
		});
		test.suite('DICT.COPY', () => {
			test.test('tuple argument.', () => {
				const {builder, cg, wasm, visitors: {codegen: {instr: VISITOR}}} = setupScript(`{
					Dict.<int>(( (@a, 2), (@b, 3), (@c, 5) ));
				}`, {codegen: false});
				const {reftype, Value, Dict} = cg.vm;
				xjs.Array.forEachAggregated(builder.instructions.slice(0, 10), (instr) => VISITOR.visit(instr));
				return assertEqualBins(
					VISITOR.visit(builder.instructions[10]),
					Dict.fillFromTuple(
						Value.asDict (wasm.local.get(0, reftype.Value)),
						Value.asTuple(wasm.local.get(4, reftype.Value)),
					),
				);
			});
			test.test('record argument.', () => {
				const {builder, cg, wasm, visitors: {codegen: {instr: VISITOR}}} = setupScript(`{
					Dict.<int>((a= 2, b= 3, c= 5));
				}`, {codegen: false});
				const {reftype, Value, Dict} = cg.vm;
				xjs.Array.forEachAggregated(builder.instructions.slice(0, 4), (instr) => VISITOR.visit(instr));
				return assertEqualBins(
					VISITOR.visit(builder.instructions[4]),
					Dict.copyFromRecord(
						Value.asDict  (wasm.local.get(0, reftype.Value)),
						Value.asRecord(wasm.local.get(1, reftype.Value)),
					),
				);
			});
			test.test('List argument.', () => {
				const {builder, cg, wasm, visitors: {codegen: {instr: VISITOR}}} = setupScript(`{
					Dict.<int>([ (@a, 2), (@b, 3), (@c, 5) ]);
				}`, {codegen: false});
				const {reftype, Value, Dict} = cg.vm;
				xjs.Array.forEachAggregated(builder.instructions.slice(0, 10), (instr) => VISITOR.visit(instr));
				return assertEqualBins(
					VISITOR.visit(builder.instructions[10]),
					Dict.fillFromList(
						Value.asDict(wasm.local.get(0, reftype.Value)),
						Value.asList(wasm.local.get(4, reftype.Value)),
					),
				);
			});
			test.test('Dict argument.', () => {
				const {builder, cg, wasm, visitors: {codegen: {instr: VISITOR}}} = setupScript(`{
					Dict.<int>([a= 2, b= 3, c= 5]);
				}`, {codegen: false});
				const {reftype, Value, Dict} = cg.vm;
				xjs.Array.forEachAggregated(builder.instructions.slice(0, 4), (instr) => VISITOR.visit(instr));
				return assertEqualBins(
					VISITOR.visit(builder.instructions[4]),
					Dict.copyFromDict(
						Value.asDict(wasm.local.get(0, reftype.Value)),
						Value.asDict(wasm.local.get(1, reftype.Value)),
					),
				);
			});
			test.test('Set argument.', () => {
				const {builder, cg, wasm, visitors: {codegen: {instr: VISITOR}}} = setupScript(`{
					Dict.<int>({ (@a, 2), (@b, 3), (@c, 5) });
				}`, {codegen: false});
				const {reftype, Value, Dict} = cg.vm;
				xjs.Array.forEachAggregated(builder.instructions.slice(0, 10), (instr) => VISITOR.visit(instr));
				return assertEqualBins(
					VISITOR.visit(builder.instructions[10]),
					Dict.fillFromSet(
						Value.asDict(wasm.local.get(0, reftype.Value)),
						Value.asMap (wasm.local.get(4, reftype.Value)),
					),
				);
			});
			test.test('Map argument.', () => {
				const {builder, cg, wasm, visitors: {codegen: {instr: VISITOR}}} = setupScript(`{
					Dict.<int>({@a -> 2, @b -> 3, @c -> 5});
				}`, {codegen: false});
				const {reftype, Value, Dict} = cg.vm;
				xjs.Array.forEachAggregated(builder.instructions.slice(0, 4), (instr) => VISITOR.visit(instr));
				return assertEqualBins(
					VISITOR.visit(builder.instructions[4]),
					Dict.fillFromMap(
						Value.asDict(wasm.local.get(0, reftype.Value)),
						Value.asMap (wasm.local.get(1, reftype.Value)),
					),
				);
			});
		});
		test.suite('SET.COPY', () => {
			test.test('tuple argument.', () => {
				const {builder, cg, wasm, visitors: {codegen: {instr: VISITOR}}} = setupScript(`{
					Set.<int>((2, 3, 5));
				}`, {codegen: false});
				const {reftype, Value, Map: VmMap} = cg.vm;
				xjs.Array.forEachAggregated(builder.instructions.slice(0, 4), (instr) => VISITOR.visit(instr));
				return assertEqualBins(
					VISITOR.visit(builder.instructions[4]),
					VmMap.fillSetFromTuple(
						Value.asMap  (wasm.local.get(0, reftype.Value)),
						Value.asTuple(wasm.local.get(1, reftype.Value)),
					),
				);
			});
			test.test('List argument.', () => {
				const {builder, cg, wasm, visitors: {codegen: {instr: VISITOR}}} = setupScript(`{
					Set.<int>([2, 3, 5]);
				}`, {codegen: false});
				const {reftype, Value, Map: VmMap} = cg.vm;
				xjs.Array.forEachAggregated(builder.instructions.slice(0, 4), (instr) => VISITOR.visit(instr));
				return assertEqualBins(
					VISITOR.visit(builder.instructions[4]),
					VmMap.fillSetFromList(
						Value.asMap (wasm.local.get(0, reftype.Value)),
						Value.asList(wasm.local.get(1, reftype.Value)),
					),
				);
			});
			test.test('Set argument.', () => {
				const {builder, cg, wasm, visitors: {codegen: {instr: VISITOR}}} = setupScript(`{
					Set.<int>({2, 3, 5});
				}`, {codegen: false});
				const {reftype, Value, Map: VmMap} = cg.vm;
				xjs.Array.forEachAggregated(builder.instructions.slice(0, 4), (instr) => VISITOR.visit(instr));
				return assertEqualBins(
					VISITOR.visit(builder.instructions[4]),
					VmMap.copyFromMap(
						Value.asMap(wasm.local.get(0, reftype.Value)),
						Value.asMap(wasm.local.get(1, reftype.Value)),
					),
				);
			});
		});
		test.suite('MAP.COPY', () => {
			test.test('tuple argument.', () => {
				const {builder, cg, wasm, visitors: {codegen: {instr: VISITOR}}} = setupScript(`{
					Map.<float, int>(( (1.414, 2), (1.732, 3), (2.236, 5) ));
				}`, {codegen: false});
				const {reftype, Value, Map: VmMap} = cg.vm;
				xjs.Array.forEachAggregated(builder.instructions.slice(0, 10), (instr) => VISITOR.visit(instr));
				return assertEqualBins(
					VISITOR.visit(builder.instructions[10]),
					VmMap.fillFromTuple(
						Value.asMap  (wasm.local.get(0, reftype.Value)),
						Value.asTuple(wasm.local.get(4, reftype.Value)),
					),
				);
			});
			test.test('List argument.', () => {
				const {builder, cg, wasm, visitors: {codegen: {instr: VISITOR}}} = setupScript(`{
					Map.<float, int>([ (1.414, 2), (1.732, 3), (2.236, 5) ]);
				}`, {codegen: false});
				const {reftype, Value, Map: VmMap} = cg.vm;
				xjs.Array.forEachAggregated(builder.instructions.slice(0, 10), (instr) => VISITOR.visit(instr));
				return assertEqualBins(
					VISITOR.visit(builder.instructions[10]),
					VmMap.fillFromList(
						Value.asMap (wasm.local.get(0, reftype.Value)),
						Value.asList(wasm.local.get(4, reftype.Value)),
					),
				);
			});
			test.test('Set argument.', () => {
				const {builder, cg, wasm, visitors: {codegen: {instr: VISITOR}}} = setupScript(`{
					Map.<float, int>({ (1.414, 2), (1.732, 3), (2.236, 5) });
				}`, {codegen: false});
				const {reftype, Value, Map: VmMap} = cg.vm;
				xjs.Array.forEachAggregated(builder.instructions.slice(0, 10), (instr) => VISITOR.visit(instr));
				return assertEqualBins(
					VISITOR.visit(builder.instructions[10]),
					VmMap.fillFromSet(
						Value.asMap(wasm.local.get(0, reftype.Value)),
						Value.asMap(wasm.local.get(4, reftype.Value)),
					),
				);
			});
			test.test('Map argument.', () => {
				const {builder, cg, wasm, visitors: {codegen: {instr: VISITOR}}} = setupScript(`{
					Map.<float, int>({1.414 -> 2, 1.732 -> 3, 2.236 -> 5});
				}`, {codegen: false});
				const {reftype, Value, Map: VmMap} = cg.vm;
				xjs.Array.forEachAggregated(builder.instructions.slice(0, 4), (instr) => VISITOR.visit(instr));
				return assertEqualBins(
					VISITOR.visit(builder.instructions[4]),
					VmMap.copyFromMap(
						Value.asMap(wasm.local.get(0, reftype.Value)),
						Value.asMap(wasm.local.get(1, reftype.Value)),
					),
				);
			});
		});
	});


	test.test('Return returns (return).', () => {
		const {stmts, builder, cg, wasm, visitors, visitors: {codegen: {instr: VISITOR}}} = setupScript(`{
			\\(): anything => null;
			\\(): anything => false;
			\\(): anything => @hello;
			\\(): anything => 42;
			\\(): anything => 4.2;
			\\(): void { return; };
			panic Exception.("hello");
		}`, {build: false});
		const {heaptype, reftype, Value} = cg.vm;
		stmts.slice(0, 6).forEach((stmt) => visitors.build.node.visit(((stmt as AST.STMT.StatementExpression).expr as AST.EXPR.Function).block.children[0]));
		visitors.build.node.visit(stmts[6]);
		builder.instructions.map((instr) => VISITOR.visit(instr));
		const ref_null_Value:     binaryen.ExpressionRef /* (ref null $Value) */      = wasm.ref.null(heaptype.Value);
		const ref_null_Exception: binaryen.ExpressionRef /* (ref null $Expression) */ = wasm.ref.null(heaptype.Exception);
		return assertEqualBins(
			builder.instructions.filter((instr) => instr instanceof OP.Return).map((instr) => VISITOR.visit(instr)),
			[
				wasm.return(wasm.tuple.make([genConst(cg),                 ref_null_Exception])),
				wasm.return(wasm.tuple.make([genConst(cg, false),          ref_null_Exception])),
				wasm.return(wasm.tuple.make([genConst(cg, 'hello', 'sym'), ref_null_Exception])),
				wasm.return(wasm.tuple.make([genConst(cg, 42n),            ref_null_Exception])),
				wasm.return(wasm.tuple.make([genConst(cg, 4.2),            ref_null_Exception])),
				wasm.return(wasm.tuple.make([Value.VOID,                   ref_null_Exception])),
				wasm.return(wasm.tuple.make([ref_null_Value,               wasm.ref.cast(
					visitors.codegen.value.visit((builder.instructions.at(-1) as OP.Return).value!), // the exact expression is needed from the ‘actual’ side; cannot be mocked with a new `local.get`
					reftype.Exception,
				)])),
			],
		);
	});
});
