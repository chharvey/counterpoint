import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import binaryen from 'binaryen';
import {BinVect} from '../../src/index.ts';
import {assertEqualBins as assert_equal_bins} from '../assert-helpers.ts';



describe('BinVect', () => {
	const MOD = new binaryen.Module();


	describe('.asBool', () => {
		it('returns `(if)` containing two v128 branches storing boolean values.', () => {
			xjs.Array.forEachAggregated([
				MOD.i32.const(0),
				MOD.i32.const(1),
			], (expr) => assert_equal_bins(
				BinVect.asBool(MOD, expr),
				MOD.if(
					expr,
					new BinVect(MOD, true).vect,
					new BinVect(MOD, false).vect,
				),
			));
		});
	});


	describe('.constructor', () => {
		it('throws when any bigint address component is out of range.', () => {
			assert.throws(() => new BinVect(MOD, [-1n]), RangeError);
			assert.throws(() => new BinVect(MOD, [2n ** 32n]), RangeError);
		});

		it('throws when any ExpressionRef address component is not an `i32`.', () => {
			assert.throws(() => new BinVect(MOD, [42]), TypeError);
			assert.throws(() => new BinVect(MOD, [MOD.f64.const(42)]), TypeError);
		});
	});


	describe('#vect', () => {
		function test_vect<Arg extends ConstructorParameters<typeof BinVect>[1]>(
			argument:    Arg,
			expected_fn: (arg: Arg, exp: binaryen.ExpressionRef) => typeof exp,
		): void {
			return assert_equal_bins(
				new BinVect(MOD, argument).vect,
				expected_fn.call(null, argument, MOD.v128.const(new Uint8Array(16))),
			);
		}

		it('with `null`/`false`/`true`/\'tuple\' argument.', () => {
			test_vect<null>   (null,    (_, exp) => MOD.i16x8.replace_lane(exp, 3, MOD.i32.const(0x0001)));
			test_vect<boolean>(false,   (_, exp) => MOD.i16x8.replace_lane(exp, 3, MOD.i32.const(0x0002)));
			test_vect<boolean>(true,    (_, exp) => MOD.i16x8.replace_lane(exp, 3, MOD.i32.const(0x0003)));
			test_vect<'tuple'>('tuple', (_, exp) => MOD.i16x8.replace_lane(exp, 3, MOD.i32.const(0x0062)));
		});

		it('with `binaryen.ExpressionRef` argument representing an `int`.', () => {
			test_vect<binaryen.ExpressionRef>(MOD.i32.const(42), (arg, exp) => {
				exp = MOD.i16x8.replace_lane(exp, 3, MOD.i32.const(0x0014));
				exp = MOD.i32x4.replace_lane(exp, 3, arg);
				return exp;
			});
		});

		it('with `binaryen.ExpressionRef` argument representing a `float`.', () => {
			test_vect<binaryen.ExpressionRef>(MOD.f64.const(4.2), (arg, exp) => {
				exp = MOD.i16x8.replace_lane(exp, 3, MOD.i32.const(0x0028));
				exp = MOD.f64x2.replace_lane(exp, 1, arg);
				return exp;
			});
		});

		it('with `binaryen.ExpressionRef` argument representing any `v128`.', () => {
			let argument: binaryen.ExpressionRef = MOD.v128.const(new Uint8Array(16));
			argument = MOD.i16x8.replace_lane(argument, 3, MOD.i32.const(0x0014));
			argument = MOD.i32x4.replace_lane(argument, 2, MOD.i32.const(42));
			return test_vect<binaryen.ExpressionRef>(argument, (arg) => arg);
		});

		it('with address bigint argument.', () => {
			test_vect<[bigint]>([42n], (arg, exp) => {
				exp = MOD.i16x8.replace_lane(exp, 3, MOD.i32.const(0x0034));
				exp = MOD.i32x4.replace_lane(exp, 3, MOD.i32.const(Number(arg[0])));
				return exp;
			});
		});

		it('with address ExpressionRef argument.', () => {
			test_vect<[binaryen.ExpressionRef]>([MOD.i32.const(42)], (arg, exp) => {
				exp = MOD.i16x8.replace_lane(exp, 3, MOD.i32.const(0x0034));
				exp = MOD.i32x4.replace_lane(exp, 3, arg[0]);
				return exp;
			});
		});
	});


	specify('#isSpecial', () => {
		new Map([
			[null,  0x0001],
			[false, 0x0002],
			[true,  0x0003],
		]).forEach((value, key) => {
			const vect                              = new BinVect(MOD, key);
			const vectLane3: binaryen.ExpressionRef = MOD.i16x8.extract_lane_s(vect.vect, 3);
			assert_equal_bins(
				vect.isSpecial(),
				MOD.i32.and(
					MOD.i32.le_s(MOD.i32.const(Number(0x0001n)), vectLane3),
					MOD.i32.le_s(vectLane3,                      MOD.i32.const(Number(0x000fn))),
				),
			);
			return assert_equal_bins(
				vect.isSpecial(key),
				MOD.i32.eq(vectLane3, MOD.i32.const(value)),
			);
		});
	});
});
