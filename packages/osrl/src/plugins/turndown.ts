import { Engine, logger } from '../index'
import { IOptions } from '../types'

const TurndownService = require('turndown')
/**
 * @link: https://www.npmjs.com/package/turndown
 * @param input 
 * @returns 
 */

const convert = (input: string) => {
	var turndownService = new TurndownService()
	return turndownService.turndown(input)
}

export const markdown = async (
	expr: string, options: IOptions, engine: Engine
) => {
	try {
		return convert(expr)
	} catch (e) {
		logger.error(e)
	}
	return expr
}

export const markdownSync =  (
	expr: string, options: IOptions, engine: Engine
) => {
	try {
		return convert(expr)
	} catch (e) {
		logger.error(e)
	}
	return expr
}
