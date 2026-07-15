export interface PrivateStoragePort {
  put(key: string, content: Uint8Array): Promise<void>;
  createSignedRead(key: string, expiresAt: string): string;
  readSigned(token: string, now: string): Promise<Uint8Array | null>;
  delete(key: string): Promise<void>;
}
