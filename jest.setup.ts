// Global mocks
jest.mock("@t3-oss/env-nextjs", () => ({
  createEnv: () => ({
    env: {
      MOESIF_APPLICATION_ID: "test",
      TEST_ENV: "test",
      REDIS_URL: "test",
    },
  }),
}));

// Add any other global mocks here
