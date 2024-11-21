// lib jq-web doesn't include declaration module so we write our custom one
declare module "jq-web" {
  interface Jq {
    promised: {
      json(json: any, query: string): Promise<any>;
    };
  }

  const jq: Jq;
  export default jq;
}
