import { Metadata } from "next";
import { SignatureRoomClient } from "~/components/signature/signature-room-client";

export const metadata: Metadata = {
  title: "Sign Document | PDFvault",
  description: "Secure electronic document signing room.",
};

export default function SignatureRoomPage({
  params,
}: {
  params: { requestId: string };
}) {
  return <SignatureRoomClient requestId={params.requestId} />;
}
