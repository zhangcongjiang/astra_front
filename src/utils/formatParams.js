export default function formatParams(params) {
  for (const [k, v] of Object.entries(params)) {
    if (v === '' || v === undefined || v === null) {
      delete params[k]
    }
  }
  return params
}
