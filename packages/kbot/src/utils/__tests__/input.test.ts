import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { resolveQuery, readStdin } from '../input'
import { detectAndHandle } from '../../commands/handlers'
import { sync as exists } from '@polymech/fs/exists'
import { sync as read } from '@polymech/fs/read'
import * as path from 'node:path'

vi.mock('@polymech/fs/exists')
vi.mock('@polymech/fs/read')
vi.mock('../../commands/handlers')
vi.mock('path', async () => {
  const actual = await vi.importActual('path')
  return {
    ...actual as any,
    resolve: vi.fn((p) => p),
    extname: vi.fn(() => '.txt')
  }
})

describe('input utilities', () => {
  let mockStdin: any

  beforeEach(() => {
    vi.resetAllMocks()
    mockStdin = {
      isTTY: true,
      on: vi.fn(),
    }
    Object.defineProperty(process, 'stdin', {
      value: mockStdin,
      writable: true
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('resolveQuery', () => {
    it('should handle file path query', async () => {
      const mockOptions = { query: 'test.txt' }
      vi.mocked(exists).mockReturnValue(true)
      vi.mocked(read).mockReturnValue(Buffer.from('file content'))
      vi.mocked(detectAndHandle).mockResolvedValue('processed file content')

      const result = await resolveQuery(mockOptions)

      expect(result).toBe('processed file content')
      expect(detectAndHandle).toHaveBeenCalled()
    })

    it('should return direct query if not file path', async () => {
      const mockOptions = { query: 'direct query' }
      vi.mocked(exists).mockReturnValue(false)
      const result = await resolveQuery(mockOptions)
      expect(result).toBe('direct query')
    })

    it('should throw error if no query provided', async () => {
      await expect(resolveQuery({})).rejects.toThrow('No query provided')
    })
  })

  describe('readStdin', () => {
    it('should handle TTY input', async () => {
      mockStdin.isTTY = true

      const result = await readStdin()

      expect(result).toEqual(Buffer.from(''))
      expect(mockStdin.on).not.toHaveBeenCalled()
    })

    it('should handle non-TTY input', async () => {
      mockStdin.isTTY = false
      const mockData = Buffer.from('test input')
      
      // Simulate data events
      mockStdin.on.mockImplementation((event, callback) => {
        if (event === 'data') callback(mockData)
        if (event === 'end') callback()
      })

      const result = await readStdin()

      expect(result).toEqual(mockData)
      expect(mockStdin.on).toHaveBeenCalledWith('data', expect.any(Function))
      expect(mockStdin.on).toHaveBeenCalledWith('end', expect.any(Function))
    })
  })
})