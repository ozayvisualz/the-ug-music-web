import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase";

export async function uploadToFirebase(file: File | Blob, path: string, onProgress?: (pct: number) => void): Promise<string> {
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(Math.round(pct));
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
}

export async function deleteFromFirebase(path: string) {
  const storageRef = ref(storage, path);
  return deleteObject(storageRef);
}

// Upload song audio
export async function uploadSongFile(file: File | Blob, songId: string, onProgress?: (pct: number) => void) {
  return uploadToFirebase(file, `songs/${songId}/audio.mp3`, onProgress);
}

// Upload song artwork
export async function uploadArtwork(file: File | Blob, songId: string, onProgress?: (pct: number) => void) {
  return uploadToFirebase(file, `songs/${songId}/artwork.jpg`, onProgress);
}

// Upload support attachment
export async function uploadAttachment(file: File | Blob, ticketId: string, fileName: string) {
  return uploadToFirebase(file, `support/${ticketId}/${fileName}`);
}
