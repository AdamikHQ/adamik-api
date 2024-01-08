// FIXME Find a place to put this instead of importing it manually
(BigInt as any).prototype.toJSON = function () {
  return this.toString();
};
