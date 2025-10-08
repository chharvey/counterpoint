import {Builder} from '../../src/index.ts';



describe('Builder', () => {
	describe('#setupModule', () => {
		it('validates successfully.', () => {
			new Builder().setupModule()(); // assert does not throw
		});
	});
});
