import {Builder} from '../../src/index.js';



describe('Builder', () => {
	describe('#build', () => {
		it('validates successfully.', () => {
			new Builder('').build(); // assert does not throw
		});
	});
});
