import * as assert from 'assert'
import {Dev} from '../../src/core/index.js';
import {
	SolidString,
	SolidSet,
} from '../../src/typer/index.js';



describe('SolidObject', () => {
	describe('#equal', () => {
		Dev.supports('literalCollection') && describe('SolidSet', () => {
			it('return false if sets have different counts.', () => {
				assert.ok(!new SolidSet<SolidString>(new Set([
					new SolidString('earth'),
					new SolidString('wind'),
					new SolidString('fire'),
				])).equal(new SolidSet<SolidString>(new Set([
					new SolidString('earth'),
					new SolidString('wind'),
					new SolidString('fire'),
					new SolidString('water'),
				]))));
			});
			it('returns true if sets contain equal elements.', () => {
				assert.ok(new SolidSet<SolidString>(new Set([
					new SolidString('earth'),
					new SolidString('wind'),
					new SolidString('fire'),
				])).equal(new SolidSet<SolidString>(new Set([
					new SolidString('earth'),
					new SolidString('fire'),
					new SolidString('wind'),
				]))));
			});
		});
	});
});
