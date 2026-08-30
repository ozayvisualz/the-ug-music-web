import { getStoredToken } from "../api/auth";

/** Upload a picked file (image/PDF) to the server and return its public URL. */
export async function uploadFile(uri: string, fileName: string, mimeType: string): Promise<string> {
  const token = await getStoredToken();

  const formData = new FormData();
  formData.append("file", { uri, name: fileName, type: mimeType } as any);

  const res = await fetch("https://www.theugmusic.com/api/upload", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data.url as string;
}
