// standard expression for variables, eg : ${foo}
export const REGEX_VAR = /\$\{([^\s:}]+)(?::([^\s:}]+))?\}/g;
// alternate expression for variables, eg : %{foo}. this is required
// to deal with parent expression parsers where '$' is reserved, eg: %{my_var}
export const REGEX_VAR_ALT = /&\{([^\s:}]+)(?::([^\s:}]+))?\}/g;
//# sourceMappingURL=constants.js.map