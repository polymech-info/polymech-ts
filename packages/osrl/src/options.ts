import * as path from 'path'

import { REGEX_VAR } from "@plastichub/core/constants"
import { sync as read } from '@plastichub/fs/read'
import { sync as exists } from '@plastichub/fs/exists'
import { isString, isArray } from '@plastichub/core/primitives'
import { IProfile, resolve, DEFAULT_ROOTS,pathInfo } from '@plastichub/osr-commons'

import { IOptions} from './types'
import { substitute, logger } from './'
import { resolveConfig } from './lib/'
import { PROFILE_FILE_NAME } from './constants'

export const parseProfile = (profilePath: string, profile: IProfile, options: IOptions, rel?: string) => {
	profilePath = path.resolve(resolve(profilePath, false, profile.variables))
	if (!exists(profilePath as string)) {
		logger.warn(`Profile file not found: ${profilePath}`)
		return
	}
	const _profile = read(profilePath as string, 'json') as any || { includes: [], variables: {} } as IProfile

	_profile.includes = _profile.includes || []
	_profile.variables = _profile.variables || {}

	if (options.env && _profile.env && _profile.env[options.env] && _profile.env[options.env].includes) {
		profile.includes = [
			...profile.includes,
			..._profile.includes,
			..._profile.env[options.env].includes
		]
	} else {
		profile.includes = [
			...profile.includes,
			..._profile.includes
		]
	}
	if (options.env && _profile.env && _profile.env[options.env] && _profile.env[options.env].variables) {
		profile.variables = {
			...profile.variables,
			..._profile.variables,
			..._profile.env[options.env].variables
		}
	}
	for (const k in _profile.variables) {
		if (isString(_profile.variables[k])) {
			_profile.variables[k] = substitute(false, _profile.variables[k], profile.variables)
		}
	}

	profile.variables = { ...profile.variables, ..._profile.variables,  ..._profile.env[options.env]?.variables || {} }
	for (const k in profile.variables) {
		if (isString(profile.variables[k])) {
			profile.variables[k] = substitute(false, profile.variables[k], profile.variables)
		}
	}
	profile.includes = Array.from(new Set(profile.includes))
	profile.includes = [
		...profile.includes.map((i) => {
			if (!path.isAbsolute(i) && rel && !i.match(REGEX_VAR)) {
				return path.resolve(`${rel}/${i}`)
			}
			let ret = resolve(i, false, profile.variables)
			ret = path.resolve(substitute(false, ret, profile.variables))
			return ret
		})]

	profile.includes = profile.includes.filter((include) =>
		include !== null &&
		include !== '')
	profile.includes = Array.from(new Set(profile.includes))
	return profile
}

export const parse = (options: IOptions, argv: any): IOptions => {

	for (const k in argv) {
		if (!(k in options.variables)
			&& k !== '_'
			&& k !== '$0'
			&& k !== 'variables'
			&& k !== 'source'
			&& k !== 'language'
			&& k !== 'envVariables'
			&& k !== 'env-variables'
			&& k !== 'format'
			&& k !== 'profile'
			&& k !== 'output'
			&& k !== 'plugins'
			&& k !== 'dry'
			&& k !== 'stdout'
			&& k !== 'alt'
			&& k !== 'template'
			&& k !== 'trace'
			&& k !== 'string'
			&& k !== 'bootstrap') {
			options.variables[k] = argv[k];
		}
	}

	const variables = {
		...DEFAULT_ROOTS,
		...options.variables,
		sourceLanguage: argv.sourceLanguage,
		targetLanguage: argv.targetLanguage,
		cwd: options.variables?.cwd || options.cwd,
		trace: argv.trace
	}
	resolveConfig(variables)

	const profile: IProfile = { variables: { ...variables }, includes: [] }
	
	const srcInfo = pathInfo(options.source)
	if (argv.profile) {
		if (typeof argv.profile === 'string') {
			argv.profile = [argv.profile]
		} else if (isArray(argv.profile)) {
			argv.profile = argv.profile
		} else {
			argv.profile = []
		}
	}

	if (options.source) {
		if (srcInfo && srcInfo.FILES && srcInfo.FILES.length) {
			options.srcInfo = srcInfo;
			for (const key in srcInfo) {
				if (Object.prototype.hasOwnProperty.call(srcInfo, key)) {
					options.variables['SRC_' + key] = srcInfo[key]
				}
			}
		} else {
			options.source = path.resolve(substitute(options.alt, options.source, profile.variables))
		}
	}

	if (argv.profile) {
		argv.profile.forEach((p) => parseProfile(p, profile, options))
	}

	if (srcInfo && srcInfo.FILES && srcInfo.FILES.length) {
		options.srcInfo = srcInfo;
		for (const key in srcInfo) {
			if (Object.prototype.hasOwnProperty.call(srcInfo, key)) {
				options.variables['SRC_' + key] = srcInfo[key]
			}
		}
		srcInfo.FILES.forEach((f) => {
			const srcParts = path.parse(f)
			const profilePath = path.resolve(`${srcParts.dir}/${PROFILE_FILE_NAME}`)
			if (exists(profilePath)) {
				parseProfile(profilePath, profile, options, srcParts.dir)
			}
		})
	}

	options.profile = profile
	if (options.plugins) {
		options.plugins = options.plugins.map((p) => {
			let dir = path.resolve(substitute(false, p, options.variables))
			if (exists(dir)) {
				return dir
			}
		})
	}

	if (options.output) {
		const out = substitute(options.alt, options.output, options.variables);
		let targetInfo = pathInfo(out)
		if (options.srcInfo && targetInfo) {
			targetInfo.PATH = options.output as string
			for (const key in targetInfo) {
				if (Object.prototype.hasOwnProperty.call(targetInfo, key)) {
					options.variables['DST_' + key] = targetInfo[key]
				}
			}
			options.targetInfo = targetInfo

		} else {
			options.output = path.resolve(substitute(options.alt, options.output || '', options.variables))
		}
	} else {
		options.stdout = true
	}

	options.pathVariables = options.variables
	options.sourceLanguage = argv.sourceLanguage || 'en'
	options.targetLanguage = argv.targetLanguage || 'en'
	options.logLevel = argv.logLevel || 'warn'
	return options
}
