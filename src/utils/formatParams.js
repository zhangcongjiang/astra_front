export default function formatParams(params) {
  // 如果参数为 undefined 或 null，返回空对象
  if (!params || typeof params !== 'object') {
    return {};
  }
  
  for (const [k, v] of Object.entries(params)) {
    if (v === '' || v === undefined || v === null) {
      delete params[k]
    }
  }
  return params
}
