import {Builder} from '../../src/index.js';



describe('Builder', () => {
	describe('#build', () => {
		it('validates successfully.', () => {
			new Builder().setupModule()(); // assert does not throw
		});
	});
});
