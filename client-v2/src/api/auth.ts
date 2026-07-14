import api from "./axios";

export async function getCloudId(): Promise<{
  cloudId: string;
  siteName: string;
  url: string;
}> {
  const { data } = await api.get("/auth/jira/cloud-id");
  return data;
}

export async function getProfile(): Promise<{ user: { userId: string; email: string } }> {
  const { data } = await api.get("/auth/me");
  return data;
}
