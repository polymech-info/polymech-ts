import { Engine, logger } from '../index'
import { IOptions } from '../types'
import { Converter } from 'showdown'
const prettyConv = require('pretty')

const convert = (input: string) => {
	let converter = new Converter({ 
        tables: true,
        parseImgDimensions: true,
        simplifiedAutoLink: true,
        tasklists:true
    });
    converter.setOption('literalMidWordUnderscores', 'true');
    return converter.makeHtml(input);
}

export const html = async (
	expr: string,
	options: IOptions,
	engine: Engine
) => {
	try {
		return convert(expr)
	} catch (e) {
		logger.error(e)
	}
	return expr
}

export const pretty = async (
	expr: string,
	options: IOptions,
	engine: Engine
) => {
	try {
		return prettyConv(expr, { ocd: true })
	} catch (e) {
		logger.error(e)
	}
	return expr
}
