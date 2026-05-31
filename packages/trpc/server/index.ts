import { router } from "./trpc";

import { healthRouter } from "./routes/health/route";
import { authRouter } from "./routes/auth/route";
import { uploadRouter } from "./routes/upload/route";
import { jobRouter } from "./routes/job/route";
import { signRouter } from "./routes/sign/route";
import { editorRouter } from "./routes/editor/route";
import { imageCompressRouter } from "./routes/image-compress/route";

export const serverRouter = router({
  health: healthRouter,
  auth: authRouter,
  upload: uploadRouter,
  job: jobRouter,
  sign: signRouter,
  editor: editorRouter,
  imageCompress: imageCompressRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
