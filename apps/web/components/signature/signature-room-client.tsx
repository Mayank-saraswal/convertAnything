"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { trpc } from "~/lib/trpc";
import { Loader2 } from "lucide-react";
import { SignatureModal } from "./signature-modal";
import { PdfViewer } from "./pdf-viewer";

export function SignatureRoomClient({ requestId }: { requestId: string }) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || undefined;

  const [signatureId, setSignatureId] = useState<string | null>(null);
  const [signatureBlob, setSignatureBlob] = useState<string | null>(null);
  const [placements, setPlacements] = useState<any[]>([]);

  const { data: request, isLoading, error } = trpc.sign.getDocument.useQuery(
    { requestId, token },
    {
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  const submitMutation = trpc.sign.submitSign.useMutation();
  const downloadMutation = trpc.sign.downloadSigned.useMutation();

  const handleSign = async () => {
    if (!signatureId) return;
    try {
      await submitMutation.mutateAsync({
        requestId,
        token,
        signatureId,
        placements,
      });
      // In a real app we would poll `getStatus` until `completed`
      alert("Document submitted for signing! Processing in background.");
      
      // Simulating a wait then downloading (this would be polled normally)
      setTimeout(async () => {
        try {
          const dl = await downloadMutation.mutateAsync({ requestId });
          window.location.href = dl.downloadUrl;
        } catch (e) {
          console.error("Wait for background job to finish.");
        }
      }, 3000);
    } catch (err) {
      alert("Error submitting signature");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-black" />
          <p className="text-gray-500 font-medium">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md p-8 bg-white rounded-2xl shadow-sm text-center">
          <h2 className="text-2xl font-serif text-black mb-2">Access Denied</h2>
          <p className="text-gray-500">{error?.message || "Document not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F9F9F9] overflow-hidden">
      {/* Sidebar */}
      <div className="w-[320px] bg-white border-r border-gray-200 flex flex-col h-full flex-shrink-0 z-10">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-serif text-black mb-1">Sign Document</h1>
          <p className="text-sm text-gray-500 truncate">{request.signerEmail}</p>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {!signatureId ? (
            <SignatureModal
              onSave={(id, blob) => {
                setSignatureId(id);
                setSignatureBlob(blob);
              }}
            />
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-black uppercase tracking-wider">
                Your Signature
              </h3>
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex items-center justify-center h-24">
                <img
                  src={signatureBlob!}
                  alt="Your signature"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <p className="text-xs text-gray-500">
                Click anywhere on the document to place your signature.
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100">
          <button
            onClick={handleSign}
            disabled={!signatureId || placements.length === 0 || submitMutation.isPending}
            className="w-full rounded-full bg-black py-3 text-sm font-semibold text-white transition-all disabled:opacity-50 hover:bg-gray-900"
          >
            {submitMutation.isPending ? "Signing..." : "Finish & Sign"}
          </button>
        </div>
      </div>

      {/* Document Viewer */}
      <div className="flex-1 overflow-y-auto relative p-8 flex justify-center custom-scrollbar">
        <PdfViewer
          documentUrl={request.documentUrl}
          signatureBlob={signatureBlob}
          placements={placements}
          onPlacementsChange={setPlacements}
        />
      </div>
    </div>
  );
}
