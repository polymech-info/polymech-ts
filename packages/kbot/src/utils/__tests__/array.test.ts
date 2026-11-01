import { describe, it, expect } from 'vitest'
import { flatten } from '../array'

describe('array utilities', () => {
  describe('flatten', () => {
    it('should handle undefined input', () => {
      expect(flatten(undefined)).toEqual([])
    })

    it('should handle string input', () => {
      expect(flatten('a,b,c')).toEqual(['a', 'b', 'c'])
    })

    it('should handle array input', () => {
      expect(flatten(['a', 'b,c'])).toEqual(['a', 'b', 'c'])
    })

    it('should filter out numbers and booleans', () => {
      expect(flatten(['a', 'true', '123', 'b'])).toEqual(['a', 'b'])
    })

    it('should remove duplicates', () => {
      expect(flatten('a,b,a,c,b')).toEqual(['a', 'b', 'c'])
    })

    it('should trim whitespace', () => {
      expect(flatten([' a ', ' b , c '])).toEqual(['a', 'b', 'c'])
    })
  })
})