import { storage } from "./firebase";

export async function uploadToFirebase(file: File | Blob, path: string, onProgress?: (pct: number) => void): Promise<string> {
  const storageRef = storage.ref().child(path);
  const uploadTask = storageRef.put(file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot: any) => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(Math.round(pct));
      },
      (error: any) => reject(error),
      async () => {
        const url = await uploadTask.snapshot!.ref.getDownloadURL();
        resolve(url);
      }
    );
  });
}

export async function deleteFromFirebase(path: string) {
  return storage.ref().child(path).delete();
}

export async function uploadSongFile(file: File | Blob, songId: string, onProgress?: (pct: number) => void) {
  return uploadToFirebase(file, `songs/${songId}/audio.mp3`, onProgress);
}

export async function uploadArtwork(file: File | Blob, songId: string, onProgress?: (pct: number) => void) {
  return uploadToFirebase(file, `songs/${songId}/artwork.jpg`, onProgress);
}

export async function uploadAttachment(file: File | Blob, ticketId: string, fileName: string) {
  return uploadToFirebase(file, `support/${ticketId}/${fileName}`);
}
