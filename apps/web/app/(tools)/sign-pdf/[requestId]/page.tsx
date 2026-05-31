import { Metadata } from "next";
import { SignatureRoomClient } from "~/components/signature/signature-room-client";

export const metadata: Metadata = {
  title: "Sign Document | PDFvault",
  description: "Secure electronic document signing room.",
};

export default async function SignatureRoomPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const resolvedParams = await params;
  return <SignatureRoomClient requestId={resolvedParams.requestId} />;
}
