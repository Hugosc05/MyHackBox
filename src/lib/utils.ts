import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function parseLogin(rest: string): { username: string; password: string } {
  const [rawUser, rawPass = ""] = rest.split("::");
  return { username: rawUser.trim(), password: rawPass.trim() };
}
