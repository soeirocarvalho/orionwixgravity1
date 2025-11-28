
// Mock JWT token generation for development without backend
export function generateMockToken(user: any) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({
    ...user,
    iat: Date.now() / 1000,
    exp: (Date.now() / 1000) + (60 * 60 * 24) // 24 hours
  }));
  const signature = "mock_signature";
  return `${header}.${payload}.${signature}`;
}

export const MOCK_USER = {
  userId: "user-123",
  email: "test@gmail.com",
  subscriptionTier: "professional",
  subscriptionStatus: "active"
};
