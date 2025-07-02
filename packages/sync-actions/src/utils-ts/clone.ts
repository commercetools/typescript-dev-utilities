type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

export default function clone<T>(obj: T): Mutable<T> {
  return JSON.parse(JSON.stringify(obj));
}

export function notEmpty<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
