import { initializeApp, getApps, getApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAluufen67WYeGx_GUEG7x476EZcA8_WUo",
  authDomain: "stay-q.firebaseapp.com",
  projectId: "stay-q",
  storageBucket: "stay-q.firebasestorage.app",
  messagingSenderId: "608570851336",
  appId: "1:608570851336:web:stayq-client",
};

export const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const firebaseStorage = getStorage(firebaseApp);

export interface UploadedMediaItem {
  url: string;
  name: string;
  type: "image" | "video" | "document";
  size?: number;
}

/**
 * Uploads a file (image, video, document) to Firebase Storage and returns its HTTPS public URL.
 */
export async function uploadMediaFile(
  file: File,
  folder: string = "experiences"
): Promise<UploadedMediaItem> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fullPath = `${folder}/${timestamp}_${safeName}`;
  const storageRef = ref(firebaseStorage, fullPath);

  // Upload to Firebase Storage
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type || "application/octet-stream",
    customMetadata: {
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
    },
  });

  // Get HTTPS download URL
  const downloadUrl = await getDownloadURL(snapshot.ref);

  let mediaType: "image" | "video" | "document" = "document";
  if (file.type.startsWith("image/")) {
    mediaType = "image";
  } else if (file.type.startsWith("video/")) {
    mediaType = "video";
  }

  return {
    url: downloadUrl,
    name: file.name,
    type: mediaType,
    size: file.size,
  };
}
