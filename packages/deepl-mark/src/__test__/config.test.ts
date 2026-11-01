import { describe } from 'vitest';
import type { Config, UserConfig } from '../config';
import {
	isFrontmatterFieldIncluded,
	isHtmlElementIncluded,
	isHtmlElementAttributeIncluded,
	isJsonOrYamlPropertyIncluded,
	isJsxComponentIncluded,
	isJsxComponentAttributeIncluded,
	isMarkdownNodeIncluded,
	resolveConfig
} from '../config';

const baseConfig: UserConfig = {
	sourceLanguage: 'en',
	outputLanguages: ['zh'],
	directories: [['', '']]
};

describe('default configurations', (test) => {
	const config: Config = resolveConfig(baseConfig);

	test('frontmatter fields', ({ expect }) => {
		expect(isFrontmatterFieldIncluded({ field: 'title', config })).toBe(false);
		expect(isFrontmatterFieldIncluded({ field: 'description', config })).toBe(false);
	});

	test('markdown nodes', ({ expect }) => {
		expect(isMarkdownNodeIncluded({ type: 'code', config })).toBe(false);
		expect(isMarkdownNodeIncluded({ type: 'blockquote', config })).toBe(true);
		expect(isMarkdownNodeIncluded({ type: 'heading', config })).toBe(true);
	});

	test('html elements', ({ expect }) => {
		expect(isHtmlElementIncluded({ tag: 'a', config })).toBe(true);
		expect(isHtmlElementIncluded({ tag: 'div', config })).toBe(true);
	});

	test('html element attributes', ({ expect }) => {
		expect(isHtmlElementAttributeIncluded({ tag: 'div', attribute: 'title', config })).toBe(true);
		expect(isHtmlElementAttributeIncluded({ tag: 'div', attribute: 'id', config })).toBe(false);
	});

	test('jsx components', ({ expect }) => {
		expect(isJsxComponentIncluded({ name: 'Card', config })).toBe(true);
		expect(isJsxComponentIncluded({ name: 'Warning', config })).toBe(true);
	});

	test('jsx component attributes', ({ expect }) => {
		expect(isJsxComponentAttributeIncluded({ name: 'Card', attribute: 'icon', config })).toBe(
			false
		);
		expect(isJsxComponentAttributeIncluded({ name: 'Warning', attribute: 'title', config })).toBe(
			false
		);
	});

	test('json or yaml properties', ({ expect }) => {
		expect(isJsonOrYamlPropertyIncluded({ property: 'author', config })).toBe(false);
		expect(isJsonOrYamlPropertyIncluded({ property: 'title', config })).toBe(false);
	});
});
