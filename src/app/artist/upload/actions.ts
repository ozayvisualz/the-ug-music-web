"use server";

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

    try {
      const { uploadToStorage } = await import("@/lib/firebase-admin");
      const url = await uploadToStorage(buffer, file.name, file.type);
      return { url };
    } catch (fbError: any) {
      throw new Error("Firebase: " + (fbError?.message || "unknown"));
    }
  } catch (e: any) {
    return { url: "", error: e?.message || "Upload failed" };
  }
}
