declare module "@/utils/encryptToken" {
  export function encryptToken(token: string): string;
  export function decryptToken(token: string): string;
}
