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

const UPLOAD_ERRORS = {
  LIMIT_FILE_SIZE: [413, 'File is too large (max 5 MB).'],
  LIMIT_FILE_COUNT: [400, 'Too many files.'],
  LIMIT_UNEXPECTED_FILE: [400, 'Too many files, or an unexpected file field.'],
  LIMIT_PART_COUNT: [400, 'Too many form fields.'],
  LIMIT_FIELD_VALUE: [400, 'A form field is too long.'],
};

export function errorHandler(err, req, res, _next) {
  // Upload problems (multer) are the user's mistake, not a server error.
  if (UPLOAD_ERRORS[err?.code]) {
    const [status, message] = UPLOAD_ERRORS[err.code];
    return res.status(status).json({ error: message });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, ...err.extra });
  }
  // Errors from Express/body-parser/multer that are safe to show (bad JSON,
  // cut-off upload...) carry `expose` and a 4xx status.
  if (err?.expose && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: err.status === 400 ? 'The request could not be read. Please try again.' : err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side.' });
}
