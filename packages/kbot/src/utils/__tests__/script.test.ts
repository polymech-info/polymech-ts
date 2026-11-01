import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { dumpAsScript } from '../script'
import { sync as write } from '@polymech/fs/write'
import * as path from 'node:path'

vi.mock('@polymech/fs/write')
vi.mock('path', async () => {
  const actual = await vi.importActual('path')
  return {
    ...actual as any,
    resolve: vi.fn((...args) => args.join('/'))
  }
})

describe('script utilities', () => {
  const originalArgv = process.argv

  beforeAll(() => {
    process.argv = ['node', 'script.js', 'command', '--option=value', '--dump=output.sh']
  })

  afterAll(() => {
    process.argv = originalArgv
  })

  describe('dumpAsScript', () => {
    it('should not create script if dump option is not provided', async () => {
      await dumpAsScript({ dump: undefined })
      expect(write).not.toHaveBeenCalled()
    })

    it('should create script file with quoted arguments', async () => {
      await dumpAsScript({ dump: 'output.sh' })

      expect(write).toHaveBeenCalledWith(
        'output.sh',
        'kbot command --option="value"'
      )
    })
  })
})