export type RegExCallback = (match, capture, arg1, arg2) => string

export interface RMarkOptions {
  images: RegExCallback,
  links?: RegExCallback
}