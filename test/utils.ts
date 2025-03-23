export function extract_tokens(template: string): string[] {
	return template.trim().replace(/\n\t+/g, '  ').split('  ');
}
