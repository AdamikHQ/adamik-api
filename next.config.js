/** @type {import('next').NextConfig} */
const nextConfig = {};

BigInt.prototype.toJSON = function () {
  return this.toString();
};

module.exports = nextConfig;
