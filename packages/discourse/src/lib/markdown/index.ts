import { Rule } from './Rule.js'
import { Pattern } from './Pattern.js'

import { RMarkOptions } from './types.js'

export const RE_IMAGES: RegExp = /\!\[([^\]]+)\]\((\S+)\)/g
export const RE_LINKS: RegExp = /\[([^\n]+)\]\(([^\n]+)\)/g

import markdown from 'markdown-it'

const defaultRules: Rule[] = [
  new Rule('header', [
    new Pattern(/^#{6}\s?([^\n]+)/gm, '<h6>$1</h6>'),
    new Pattern(/^#{5}\s?([^\n]+)/gm, '<h5>$1</h5>'),
    new Pattern(/^#{4}\s?([^\n]+)/gm, '<h4>$1</h4>'),
    new Pattern(/^#{3}\s?([^\n]+)/gm, '<h3>$1</h3>'),
    new Pattern(/^#{2}\s?([^\n]+)/gm, '<h2>$1</h2>'),
    new Pattern(/^#{1}\s?([^\n]+)/gm, '<h1>$1</h1>'),
  ]),
  new Rule('bold', [
    new Pattern(/\*\*\s?([^\n]+)\*\*/g, '<b>$1</b>'),
    new Pattern(/\_\_\s?([^\n]+)\_\_/g, '<b>$1</b>'),
  ]),
  new Rule('italic', [
    new Pattern(/\*\s?([^\n]+)\*/g, '<i>$1</i>'),
    new Pattern(/\_\s?([^\n]+)\_/g, '<i>$1</i>'),
  ]),
  new Rule('image', [
    new Pattern(/\!\[([^\]]+)\]\((\S+)\)/g, '<img src="$2" alt="$1" />'),
  ]),
  new Rule('link', [
    new Pattern(
      /\[([^\n]+)\]\(([^\n]+)\)/g,
      '<a href2="$2" target="_blank" rel="noopener">$1</a>'
    ),
  ]),
  new Rule('paragraph', [
    // this regex can't skip processed HTML
    new Pattern(/([^\n]+\n?)/g, '\n<p>$1</p>\n'),
    // another possible regex that can't skip processed HTML
    // new Pattern(/(?:^|\n)([^\n\<]+(?:\n[^\n\>]+)*)(?:\n|$)/gm, '\n<p>$1</p>\n'),
  ])
]

const defaultRulesDiscourse = (images, links) => {
  return [
    new Rule('image', [
      new Pattern(RE_LINKS, images)
    ])/*,
    new Rule('link', [
      new Pattern(
        RE_LINKS,
        links
      )
    ])*/
  ]
}

export class RMark {

  constructor(options: RMarkOptions) {
    this.rules = defaultRulesDiscourse(options.images, options.links)
  }

  private rules: Rule[]

  public addRuleBefore(rule: Rule, before: string): RMark {
    const index = this.rules.findIndex((r) => r.name === before);
    if (index !== -1) {
      this.rules.splice(index, 0, rule);
    }
    return this;
  }

  public addRule(rule: Rule): RMark {
    this.addRuleBefore(rule, 'paragraph');
    return this;
  }

  public render(raw: string) {
    let result = raw;
    this.rules.forEach((rule) => {
      result = rule.apply(result);
    });
    return result;
  }
}

export { Rule } from './Rule.js';
export { Pattern } from './Pattern.js';

// export const find = (content:string, reg:RegExp) => content.match(reg)




export const toHTML = (content) => {

  const md = new markdown({
    html: true,
    breaks: true
  })

  return md.render(content)
}

function image_urls(input: string): string[] {
  const regex = /https?:\/\/(?:[a-z0-9\-]+\.)+[a-z]{2,}(?:\/[^\/#\s]*)*\.(?:jpe?g|gif|png|webp)/g
  const matches = input.match(regex)
  return matches || []
}

function image_urls_local(input: string): string[] {
  const regex = /\/(?:[^\/#\s]+\/)*[^\/#\s]+\.(?:jpe?g|gif|png|webp)/g
  const matches = input.match(regex)
  return matches || []
}

function findUploadImageUrls(input: string): string[] {
  const regex = /upload:\/\/[^\s]+?\.(?:jpe?g|gif|png)/gi;
  const matches = input.match(regex);
  return matches || [];
}