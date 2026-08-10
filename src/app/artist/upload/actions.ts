"use server";

import { uploadFile } from "@/lib/minio";

export async function uploadFileAction(formData: FormData): Promise<{
  url: string;
  error?: string;
}> {
  try {
    const file = formData.get("file") as File;
    if (!file) return { url: "", error: "No file provided" };

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split(".").pop() || "bin";
    const id = `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const key = `uploads/${id}.${ext}`;

    const url = await uploadFile(key, buffer, file.type);
    return { url };
  } catch (e: any) {
    return { url: "", error: e?.message || "Upload failed" };
  }
}
