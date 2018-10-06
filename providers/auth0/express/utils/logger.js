module.exports = function logger(tokens, req, res) {
  const log = [
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'), '-',
    tokens['response-time'](req, res), 'ms'
  ].join(' ')
  if (process.env.NODE_ENV !== 'dev') {
    // output logs to AWS cloudwatch
    console.log(log)
  }
  return log
}
