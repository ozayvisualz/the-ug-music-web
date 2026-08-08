import { exec } from "child_process";
import { promisify } from "util";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

const execAsync = promisify(exec);

export async function transcodeToHLS(
  inputPath: string,
  outputDir: string,
  songId: string
): Promise<{ hlsUrl: string; duration: number }> {
  const outputPath = path.join(outputDir, songId);
  fs.mkdirSync(outputPath, { recursive: true });

  const hlsOutput = path.join(outputPath, "master.m3u8");

  const qualities = [
    { name: "360p", bandwidth: 800000, resolution: "640x360" },
    { name: "480p", bandwidth: 1400000, resolution: "854x480" },
    { name: "720p", bandwidth: 2800000, resolution: "1280x720" },
  ];

  const variantPlaylists = qualities
    .map(
      (q) =>
        `-map 0:v:0 -map 0:a:0 -c:v libx264 -b:v ${q.bandwidth} -c:a aac -b:a 128k ` +
        `-vf "scale=${q.resolution}" -hls_time 10 -hls_list_size 0 ` +
        `-hls_segment_filename "${path.join(outputPath, `${q.name}_%03d.ts`).replace(/\\/g, "/")}" ` +
        `${path.join(outputPath, `${q.name}.m3u8`).replace(/\\/g, "/")}`
    )
    .join(" ");

  const cmd = `ffmpeg -i "${inputPath}" ${variantPlaylists}`;

  try {
    await execAsync(cmd, { timeout: 300000 });

    const masterContent = `#EXTM3U
#EXT-X-VERSION:3
${qualities
  .map(
    (q, i) =>
      `#EXT-X-STREAM-INF:BANDWIDTH=${q.bandwidth},RESOLUTION=${q.resolution}\n${q.name}.m3u8`
  )
  .join("\n")}`;

    fs.writeFileSync(hlsOutput, masterContent);

    const probeCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`;
    const { stdout } = await execAsync(probeCmd);
    const duration = Math.round(parseFloat(stdout.trim()));

    return { hlsUrl: hlsOutput, duration };
  } catch (error) {
    throw new Error(`HLS transcoding failed: ${error}`);
  }
}

export async function processUpload(
  file: File | Buffer,
  filename: string
): Promise<{ buffer: Buffer; ext: string; tmpPath: string }> {
  let buffer: Buffer;
  if (file instanceof File) {
    buffer = Buffer.from(await file.arrayBuffer());
  } else {
    buffer = file;
  }

  const ext = path.extname(filename).toLowerCase();
  const tmpDir = os.tmpdir();
  const tmpPath = path.join(tmpDir, `upload_${Date.now()}${ext}`);
  fs.writeFileSync(tmpPath, buffer);

  return { buffer, ext, tmpPath };
}
