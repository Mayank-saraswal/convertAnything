import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { trpc } from "~/trpc/client";
import { SignaturePad } from "./signature-pad";

export function SignatureModal({ onSave }: { onSave: (id: string, blob: string) => void }) {
  const [open, setOpen] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const saveMutation = trpc.sign.saveSignature.useMutation();

  const handleSave = async () => {
    if (!signatureData) return;
    try {
      const res = await saveMutation.mutateAsync({
        name: "Self",
        signatureType: "draw",
        signatureData,
      });
      onSave(res.signatureId, signatureData);
      setOpen(false);
    } catch (err) {
      alert("Failed to save signature");
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="w-full rounded-xl border-2 border-dashed border-gray-300 py-8 text-sm font-medium text-gray-600 hover:border-black hover:text-black transition-colors">
          + Create Signature
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl shadow-2xl p-8 z-50">
          <Dialog.Title className="text-2xl font-serif text-black mb-6">
            Create your signature
          </Dialog.Title>

          <div className="flex space-x-4 border-b border-gray-100 mb-6 pb-2">
            <button className="text-sm font-semibold text-black border-b-2 border-black pb-2 -mb-[10px]">
              Draw
            </button>
            <button className="text-sm font-medium text-gray-400 cursor-not-allowed">
              Type (Coming Soon)
            </button>
            <button className="text-sm font-medium text-gray-400 cursor-not-allowed">
              Upload
            </button>
          </div>

          <div className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50 mb-6 relative">
            <SignaturePad onEnd={(data) => setSignatureData(data)} />
          </div>

          <div className="flex justify-end space-x-3">
            <Dialog.Close asChild>
              <button className="px-6 py-2.5 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100">
                Cancel
              </button>
            </Dialog.Close>
            <button
              onClick={handleSave}
              disabled={!signatureData || saveMutation.isPending}
              className="px-6 py-2.5 rounded-full bg-black text-sm font-semibold text-white hover:bg-gray-900 disabled:opacity-50"
            >
              {saveMutation.isPending ? "Saving..." : "Save Signature"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
