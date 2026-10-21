// HttpError lets any route `throw new HttpError(403, '...')` and have the
// error middleware turn it into a clean JSON response.
export class HttpError extends Error {
  constructor(status, message, extra) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

export function notFound(what = 'Not found') {
  return new HttpError(404, what);
}

export function errorHandler(err, req, res, _next) {
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File is too large (max 5 MB).' });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, ...err.extra });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side.' });
}
