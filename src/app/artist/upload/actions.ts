"use server";

import { uploadToStorage } from "@/lib/firebase-admin";

export async function uploadFileAction(formData: FormData): Promise<{
  url: string;
  error?: string;
}> {
  try {
    const file = formData.get("file") as File;
    if (!file) return { url: "", error: "No file provided" };

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const url = await uploadToStorage(buffer, file.name, file.type);
    return { url };
  } catch (e: any) {
    return { url: "", error: e?.message || "Upload failed" };
  }
}
