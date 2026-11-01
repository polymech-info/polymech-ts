import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readProjectFiles } from '../file'
import { sync as dir } from '@polymech/fs/dir'
import { sync as exists } from '@polymech/fs/exists'
import { filesEx } from '@polymech/commons/_glob'

vi.mock('@polymech/fs/dir')
vi.mock('@polymech/fs/exists')
vi.mock('@polymech/commons/_glob')
vi.mock('@polymech/fs/read')
vi.mock('path', async () => {
  const actual = await vi.importActual('path')
  return {
    ...(actual as any),
    relative: vi.fn((from, to) => to),
    extname: vi.fn((path) => path ? path.includes('.ts') ? '.ts' : '.md' : '')
  }
})

describe('file utilities', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('readProjectFiles', () => {
    it('should create directory if it does not exist', async () => {
      vi.mocked(exists).mockReturnValue(false)

      await readProjectFiles('/test/path')

      expect(dir).toHaveBeenCalledWith('/test/path')
      expect(filesEx).not.toHaveBeenCalled()
    })

   
  })
})