function isArray(value) {
  return Array.isArray(value);
}
function isBoolean(value) {
  return typeof value === "boolean";
}
function isEmptyArray(array) {
  return array.length === 0;
}
function isEmptyObject(object) {
  return Object.keys(object).length === 0;
}
function isEmptyString(string) {
  return string.length === 0;
}
function isObject(value) {
  return isArray(value) ? false : typeof value == "object" ? true : false;
}
function isString(value) {
  return typeof value === "string";
}
export {
  isArray,
  isBoolean,
  isEmptyArray,
  isEmptyObject,
  isEmptyString,
  isObject,
  isString
};
