import { exec } from "child_process";
import { readFileSync, writeFileSync, unlinkSync, readdirSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { uploadFile, getPresignedUrl, getBucket, PUBLIC_URL } from "../minio";

const TEMP_DIR = join(process.cwd(), "tmp", "transcoding");

function ensureTempDir() {
  if (!existsSync(TEMP_DIR)) mkdirSync(TEMP_DIR, { recursive: true });
}

function execAsync(cmd: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout: 300000 }, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve({ stdout, stderr });
    });
  });
}

export async function transcodeToHLS(objectKey: string): Promise<{ hlsUrl: string; masterPlaylistUrl: string }> {
  ensureTempDir();

  const baseName = objectKey.replace(/\.[^/.]+$/, "");
  const workDir = join(TEMP_DIR, randomUUID());
  mkdirSync(workDir, { recursive: true });

  const inputPath = join(workDir, "input.mp3");

  // Download from MinIO
  const downloadUrl = await getPresignedUrl(objectKey, 3600);

  const response = await fetch(downloadUrl);
  if (!response.ok) throw new Error(`Failed to download file: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(inputPath, buffer);

  const hlsSegmentPath = join(workDir, "segment_%03d.ts");
  const hlsPlaylistPath = join(workDir, "playlist.m3u8");

  // Transcode to HLS
  const ffmpegCmd = [
    "ffmpeg",
    "-y",
    "-i", inputPath,
    "-c:a", "aac",
    "-b:a", "128k",
    "-ac", "2",
    "-ar", "44100",
    "-hls_time", "10",
    "-hls_list_size", "0",
    "-hls_segment_filename", hlsSegmentPath,
    hlsPlaylistPath,
  ];

  try {
    await execAsync(ffmpegCmd.join(" "));
  } catch (e: any) {
    console.error("FFmpeg error:", e.stderr || e.message);
    throw new Error("Audio transcoding failed");
  }

  // Upload HLS files to MinIO
  const hlsDir = `hls/${baseName}`;
  const files = readdirSync(workDir);

  for (const file of files) {
    const filePath = join(workDir, file);
    const content = readFileSync(filePath);
    const mimeType = file.endsWith(".m3u8") ? "application/vnd.apple.mpegurl" : "video/mp2t";

    await uploadFile(`${hlsDir}/${file}`, content, mimeType);
  }

  // Cleanup
  try {
    for (const file of files) unlinkSync(join(workDir, file));
    unlinkSync(workDir);
  } catch {}

  const publicUrl = PUBLIC_URL();
  const bucket = getBucket();

  return {
    hlsUrl: `${publicUrl}/${bucket}/${hlsDir}/playlist.m3u8`,
    masterPlaylistUrl: `${publicUrl}/${bucket}/${hlsDir}/playlist.m3u8`,
  };
}
