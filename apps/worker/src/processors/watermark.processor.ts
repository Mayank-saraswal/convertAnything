import { addWatermark } from "@repo/pdf-core";

export async function processWatermark(
  inputBuffers: Buffer[],
  options?: Record<string, unknown>
) {
  const result = await addWatermark(inputBuffers[0]!, {
    text: (options?.text as string) || "WATERMARK",
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
  });

  return {
    buffer: result.buffer,
    filename: result.filename,
    mimeType: result.mimeType,
  };
}
