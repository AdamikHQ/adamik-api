(BigInt as any).prototype.toJSON = function () {
  return this.toString();
};
