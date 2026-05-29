export {
  initR2,
  getUploadPresignedUrl,
  getDownloadPresignedUrl,
  uploadToR2,
  downloadFromR2,
  deleteFromR2,
} from "./r2";

export type { R2Config } from "./r2";

export {
  initLocalStorage,
  saveLocally,
  readLocally,
  deleteLocally,
  getLocalUploadUrl,
  getLocalDownloadUrl,
} from "./local";
