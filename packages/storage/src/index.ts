export {
  generateUploadPresignedUrl,
  generateDownloadPresignedUrl,
  uploadBuffer,
  downloadBuffer,
  deleteObject,
  deleteObjects,
  objectExists,
  listObjects,
  copyObject,
  getCdnUrl,
 getS3Client,
  getBucket
} from "./spaces";

export {
  initLocalStorage,
  saveLocally,
  readLocally,
  deleteLocally,
  getLocalUploadUrl,
  getLocalDownloadUrl,
} from "./local";
