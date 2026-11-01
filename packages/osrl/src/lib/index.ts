
export const substitute = (template, map) => {
  const transform = (k) => k || '';
  return template.replace(/\$\{([^\s\:\}]+)(?:\:([^\s\:\}]+))?\}/g,
    (match, key, format) => transform(map[key]).toString());
};

const _resolve = (config) => {
  for (const key in config) {
    if (config[key] && typeof config[key] == 'string') {
      const resolved = substitute(config[key], config);
      config[key] = resolved;
    }
  }
  return config;
}
export const resolveConfig = (config) => {
  config = _resolve(config);
  config = _resolve(config);
  return config;
}