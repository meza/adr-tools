declare global {
  // eslint-disable-next-line no-unused-vars
  namespace NodeJS {
    // eslint-disable-next-line no-unused-vars
    interface ProcessEnv {
      ADR_TEMPLATE: string;
      ADR_DATE: string;
    }
  }
}

export {};
