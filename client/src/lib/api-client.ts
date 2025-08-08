import { z } from "zod";

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const signupSchema = z.object({
  username: z.string(),
  password: z.string(),
});

type LoginCredentials = z.infer<typeof loginSchema>;
type SignupCredentials = z.infer<typeof signupSchema>;

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "An error occurred");
  }
  return response.json();
};

export const login = async (credentials: LoginCredentials) => {
  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  return handleResponse(response);
};

export const signup = async (credentials: SignupCredentials) => {
  const response = await fetch("/api/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  return handleResponse(response);
};

export const logout = async () => {
  const response = await fetch("/api/logout", {
    method: "POST",
  });
  return handleResponse(response);
};

export const getMe = async () => {
  const response = await fetch("/api/me");
  // Don't throw for 401, just return null
  if (response.status === 401) {
    return null;
  }
  return handleResponse(response);
};

export const uploadProject = async (file: File, name: string, duration: number) => {
  const formData = new FormData();
  formData.append("audio", file);
  formData.append("name", name);
  formData.append("duration", duration.toString());

  const response = await fetch("/api/projects", {
    method: "POST",
    body: formData,
  });
  return handleResponse(response);
};

export const getProjectStatus = async (projectId: number) => {
  const response = await fetch(`/api/projects/${projectId}/status`);
  return handleResponse(response);
};

export const getProjectStems = async (projectId: number) => {
  const response = await fetch(`/api/projects/${projectId}/stems`);
  return handleResponse(response) as Promise<string[]>;
};
