export function success(res, data) {
  return res.json({ success: true, ...data })
}

export function error(res, message, code = "PROCESSING_FAILED", status = 500) {
  return res.json({ success: false, error: message, code }, status)
}

export function unauthorized(res, message = "Pro plan required") {
  return res.json({ success: false, error: message, code: "AUTH_REQUIRED" }, 401)
}

export function forbidden(res, message = "Upgrade your plan to use this tool") {
  return res.json({ success: false, error: message, code: "PLAN_REQUIRED" }, 403)
}

export function tooLarge(res, maxBytes) {
  return res.json({
    success: false,
    error: `File too large. Max size: ${formatBytes(maxBytes)}`,
    code: "FILE_TOO_LARGE"
  }, 413)
}

function formatBytes(b) {
  if (b >= 1073741824) return `${(b/1073741824).toFixed(1)}GB`
  if (b >= 1048576) return `${(b/1048576).toFixed(0)}MB`
  return `${(b/1024).toFixed(0)}KB`
}
