import * as path from 'path'
import { substitute } from '../../..'
import { IResizeOptions } from '../../../types'

import { sync as exists } from "@polymech/fs/exists"
import { sync as read } from "@polymech/fs/read"
import { resolve, isFile } from '@polymech/commons/fs'
