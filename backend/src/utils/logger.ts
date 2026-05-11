type LogMeta = Record<string, unknown>;

function serialize(meta?: LogMeta) {
  return meta ? ` ${JSON.stringify(meta)}` : "";
}

export const logger = {
  info(prefix: string, message: string, meta?: LogMeta) {
    console.log(`${prefix} ${message}${serialize(meta)}`);
  },
  warn(prefix: string, message: string, meta?: LogMeta) {
    console.warn(`${prefix} ${message}${serialize(meta)}`);
  },
  error(prefix: string, message: string, meta?: LogMeta) {
    console.error(`${prefix} ${message}${serialize(meta)}`);
  }
};
