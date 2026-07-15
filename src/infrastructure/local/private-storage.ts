import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { PrivateStoragePort } from "@/application/evidence/private-storage";

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

export class LocalPrivateStorage implements PrivateStoragePort {
  readonly #root: string;
  readonly #secret: string;

  constructor(root: string, secret: string) {
    this.#root = resolve(root, "private");
    this.#secret = secret;
  }

  async put(key: string, content: Uint8Array): Promise<void> {
    const path = this.objectPath(key);
    await mkdir(dirname(path), { recursive: true, mode: 0o700 });
    await writeFile(path, content, { mode: 0o600 });
  }

  createSignedRead(key: string, expiresAt: string): string {
    this.objectPath(key);
    const payload = Buffer.from(`${key}|${expiresAt}`, "utf8").toString("base64url");
    const signature = createHmac("sha256", this.#secret)
      .update(payload)
      .digest("base64url");
    return `${payload}.${signature}`;
  }

  async readSigned(token: string, now: string): Promise<Uint8Array | null> {
    const [payload, signature, extra] = token.split(".");
    if (!payload || !signature || extra) return null;
    const expected = createHmac("sha256", this.#secret)
      .update(payload)
      .digest("base64url");
    const receivedBytes = Buffer.from(signature);
    const expectedBytes = Buffer.from(expected);
    if (
      receivedBytes.length !== expectedBytes.length ||
      !timingSafeEqual(receivedBytes, expectedBytes)
    ) {
      return null;
    }
    const decoded = Buffer.from(payload, "base64url").toString("utf8");
    const separator = decoded.lastIndexOf("|");
    if (separator < 1) return null;
    const key = decoded.slice(0, separator);
    const expiresAt = decoded.slice(separator + 1);
    if (!expiresAt || Date.parse(now) >= Date.parse(expiresAt)) return null;
    try {
      return await readFile(this.objectPath(key));
    } catch (error) {
      if (isMissingFile(error)) return null;
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    await rm(this.objectPath(key), { force: true });
  }

  private objectPath(key: string): string {
    if (!/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(key)) {
      throw new InvalidObjectKeyError(key);
    }
    return resolve(this.#root, key);
  }
}

export class InvalidObjectKeyError extends Error {
  readonly key: string;

  constructor(key: string) {
    super("Private object key is invalid");
    this.name = "InvalidObjectKeyError";
    this.key = key;
  }
}
