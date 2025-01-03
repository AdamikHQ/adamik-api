/**
 * NOTE Standard JSON does not support bigint values,
 * which is an issue for our API when data is serialized as JSON into responses' body
 *
 * However as far as the API is concerned, all bigint values in requests and responses
 * can be serialized as string, which is exactly what this patch does
 *
 * Only inconvenience is that it has to be imported in every place where a JSON serialization is required...
 */
(BigInt as any).prototype.toJSON = function () {
  return this.toString();
};
