export function logInfo(...msg: any[]) {
  console.log("\x1b[32m[INFO]\x1b[0m", ...msg);
}

export function logError(...msg: any[]) {
  console.error("\x1b[31m[ERROR]\x1b[0m", ...msg);
}

export function logWarn(...msg: any[]) {
  console.warn("\x1b[33m[WARN]\x1b[0m", ...msg);
}
