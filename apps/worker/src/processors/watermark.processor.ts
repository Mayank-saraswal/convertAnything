import { addWatermark } from "@repo/pdf-core";

export async function processWatermark(
  inputBuffers: Buffer[],
  options?: Record<string, unknown>
) {
  const result = await addWatermark(inputBuffers[0]!, {
    type: (options?.type as "text" | "image") || "text",
    text: (options?.text as string) || "CONFIDENTIAL",
    imageBase64: options?.imageBase64 as string | undefined,
    fontSize: (options?.fontSize as number) || 48,
    opacity: (options?.opacity as number) || 0.3,
    position:
      (options?.position as
        | "center"
        | "top-left"
        | "top-right"
        | "bottom-left"
        | "bottom-right") || "center",
    rotation: (options?.rotation as number) || -45,
    color: (options?.color as string) || "#000000",
    imageScale: (options?.imageScale as number) || 0.5,
  });

  return {
    buffer: result.buffer,
    filename: result.filename,
    mimeType: result.mimeType,
  };
}
