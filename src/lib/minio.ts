import { Client as MinioClient } from "minio";

let _client: MinioClient | null = null;
let _bucket: string | null = null;
let _publicUrl: string | null = null;

function getConfig() {
  const rawPort = parseInt(process.env.MINIO_PORT || "9500");
  const port = (rawPort && rawPort > 0) ? rawPort : 9500;
  return {
    endPoint: process.env.MINIO_ENDPOINT || "127.0.0.1",
    port,
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY || "ugmusic_admin",
    secretKey: process.env.MINIO_SECRET_KEY || "ugmusic_minio_secret",
  };
}

function getClient(): MinioClient {
  if (!_client) {
    const cfg = getConfig();
    console.log("[MinIO] Connecting to", cfg.endPoint, "port", cfg.port);
    _client = new MinioClient(cfg);
  }
  return _client;
}

function getBucket(): string {
  if (!_bucket) {
    _bucket = process.env.MINIO_BUCKET || "ugandan-music";
  }
  return _bucket;
}

function getPublicUrl(): string {
  if (!_publicUrl) {
    _publicUrl = process.env.S3_PUBLIC_URL || "http://localhost:9500";
  }
  return _publicUrl;
}

export async function ensureBucket() {
  const client = getClient();
  const bucket = getBucket();
  const exists = await client.bucketExists(bucket);
  if (!exists) {
    await client.makeBucket(bucket, "us-east-1");
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: "*",
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${bucket}/*`],
        },
      ],
    };
    await client.setBucketPolicy(bucket, JSON.stringify(policy));
    console.log("[MinIO] Bucket created:", bucket);
  }
  return bucket;
}

export async function uploadFile(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const client = getClient();
  const bucket = await ensureBucket();
  await client.putObject(bucket, key, buffer, buffer.length, {
    "Content-Type": contentType,
  });
  return `${getPublicUrl()}/${bucket}/${key}`;
}

export async function deleteFile(key: string) {
  const client = getClient();
  const bucket = getBucket();
  await client.removeObject(bucket, key);
}

export async function getPresignedUrl(key: string, expirySeconds = 3600) {
  const client = getClient();
  const bucket = getBucket();
  return client.presignedGetObject(bucket, key, expirySeconds);
}

export async function fileExists(key: string): Promise<boolean> {
  try {
    const client = getClient();
    const bucket = getBucket();
    await client.statObject(bucket, key);
    return true;
  } catch {
    return false;
  }
}

export async function downloadFile(key: string): Promise<Buffer> {
  const client = getClient();
  const bucket = getBucket();
  const stream = await client.getObject(bucket, key);
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

export async function testConnection(): Promise<{ ok: boolean; endpoint: string; port: number; bucket: string; error?: string }> {
  try {
    const cfg = getConfig();
    const client = getClient();
    const bucket = getBucket();
    const exists = await client.bucketExists(bucket);
    return { ok: exists, endpoint: cfg.endPoint, port: cfg.port, bucket };
  } catch (e: any) {
    const cfg = getConfig();
    return { ok: false, endpoint: cfg.endPoint, port: cfg.port, bucket: getBucket(), error: e?.message || String(e) };
  }
}

export function resetClient() {
  _client = null;
  _bucket = null;
  _publicUrl = null;
}

const BUCKET = "";

export { getClient as minioClient, BUCKET, getBucket, getPublicUrl as PUBLIC_URL };
