
export function mod(n, m) {
  return ((n % m) + m) % m;
};

export const params = (args) => {
  const filtered = {};
  Object.entries(args).forEach(([key, value]) => {
    if (value === undefined) return;
    filtered[key] = value;
  });

  const str = new URLSearchParams(filtered).toString();
  return str.length > 0 ? "?" + str : str;
};

export const repeatArray = (arr, times) => Array(times)
  .fill([...arr])
  .reduce((a, b) => a.concat(b));
