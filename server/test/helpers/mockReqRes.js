/**
 * Create a mock Express request object.
 */
export const mockReq = (overrides = {}) => ({
  user: { userId: "test-user-123", _id: "test-user-123" },
  body: {},
  query: {},
  params: {},
  file: null,
  headers: { authorization: "Bearer test-token" },
  ...overrides,
});

/**
 * Create a mock Express response object.
 * Tracks status code and body, supports chaining.
 */
export const mockRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    send(data) {
      this.body = data;
      return this;
    },
  };
  return res;
};

/**
 * Create a mock next function that tracks calls.
 */
export const mockNext = () => {
  const fn = (...args) => {
    fn.called = true;
    fn.args = args;
  };
  fn.called = false;
  fn.args = [];
  return fn;
};
