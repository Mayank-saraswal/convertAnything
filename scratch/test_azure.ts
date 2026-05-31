import { generateUploadSasUrl } from "../packages/storage/src/azure";
import * as dotenv from "dotenv";
dotenv.config({ path: "./.env" });

generateUploadSasUrl("test.txt", "text/plain")
  .then(console.log)
  .catch(console.error);
