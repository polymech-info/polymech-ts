import { sync }  from 'write-file-atomic'

export const file = {
  write_atomic: sync
};
export const json = {
  parse: JSON.parse,
  serialize: JSON.stringify
};
