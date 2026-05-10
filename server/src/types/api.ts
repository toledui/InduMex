export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
};

export type JwtPayload = {
  sub: number;
  email: string;
  rol: "admin" | "editor";
};
