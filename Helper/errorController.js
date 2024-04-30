module.exports = (err, req, res, next) => {
  if (err.name === "ValidationError") {
    const meg = Object.values(err.errors)[0];
    err.statusCode = 422;
    err.message = meg;
  } 
  const statusErrorCode = err.statusCode || 500;
  const handledError = err.statusCode < 500;
  const handledMessage = err?.message?.properties?.message
    ? err.message.properties.message
    : err.message;
  res.status(statusErrorCode).send({
    message: handledError ? handledMessage : "something went wrong",
    errors: err.errors || [],
  });
};
