export function extract_tokens(template: string): string[] {
	return template.trim().replace(/\n\t+/g, '  ').split('  ');
}

export function extract_lines(strings: TemplateStringsArray, ...interps: unknown[]): string[] {
	return String.raw({raw: strings}, ...interps).split('\n').map((line) => line.trim()).filter((line) => !!line);
}

export function repeat<T>(value: T, times: number): T[] {
	return Array<T>(times).fill(value);
}
