export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TOKEN_KEY = "kalk_token";

export type Course = {
  id: number;
  code: string;
  title: string;
  units: number | null;
  score: number | null;
  grade: string | null;
  session: string;
  semester: string;
  excluded: boolean;
  needs_review: boolean;
  source_file: string;
};

export type Term = { term: string; units: number; quality_points: number; gpa: number };

export type Cgpa = {
  cgpa: number;
  total_units: number;
  total_quality_points: number;
  courses_counted: number;
  courses_excluded: number;
  courses_needing_review: number;
  terms: Term[];
};

export type User = { id: number; email: string; name: string };

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage unavailable */
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError("Can't reach the server. Check that the API is running.", 0);
  }

  if (res.status === 401 && token) {
    clearToken();
    if (typeof window !== "undefined") window.location.href = "/login";
  }
  if (!res.ok) {
    let detail = res.statusText || "Something went wrong";
    try {
      const body = await res.json();
      if (typeof body.detail === "string") detail = body.detail;
      else if (Array.isArray(body.detail)) detail = body.detail.map((d: { msg: string }) => d.msg).join(", ");
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(detail, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const json = (body: unknown) => JSON.stringify(body);

export const api = {
  register: (email: string, password: string, name: string) =>
    request<{ access_token: string }>("/auth/register", { method: "POST", body: json({ email, password, name }) }),
  login: (email: string, password: string) =>
    request<{ access_token: string }>("/auth/login", { method: "POST", body: json({ email, password }) }),
  google: (id_token: string) =>
    request<{ access_token: string }>("/auth/google", { method: "POST", body: json({ id_token }) }),
  me: () => request<User>("/auth/me"),
  courses: () => request<Course[]>("/courses"),
  cgpa: () => request<Cgpa>("/cgpa"),
  addCourse: (c: Partial<Course>) => request<Course>("/courses", { method: "POST", body: json(c) }),
  patchCourse: (id: number, patch: Partial<Course>) =>
    request<Course>(`/courses/${id}`, { method: "PATCH", body: json(patch) }),
  deleteCourse: (id: number) => request<void>(`/courses/${id}`, { method: "DELETE" }),
  bulkExclude: (ids: number[], excluded: boolean) =>
    request<Course[]>("/courses/bulk-exclude", { method: "POST", body: json({ ids, excluded }) }),
  clearCourses: () => request<void>("/courses", { method: "DELETE" }),
  upload: (files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    return request<Course[]>("/results/upload", { method: "POST", body: form });
  },
};

export function classify(cgpa: number): string {
  if (cgpa >= 4.5) return "First Class";
  if (cgpa >= 3.5) return "Second Class Upper";
  if (cgpa >= 2.4) return "Second Class Lower";
  if (cgpa >= 1.5) return "Third Class";
  if (cgpa >= 1.0) return "Pass";
  return "—";
}
