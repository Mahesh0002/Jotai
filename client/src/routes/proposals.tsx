import { createFileRoute } from "@tanstack/react-router";
import { ProposalInbox } from "@/components/proposals/ProposalInbox";

export const Route = createFileRoute("/proposals")({
  component: ProposalInbox,
});
