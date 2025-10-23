import {Builder} from '../../src/index.ts';



describe('Builder', () => {
	describe('#build', () => {
		it('validates successfully.', () => {
			new Builder().setupModule(); // assert does not throw
		});
	});
});
