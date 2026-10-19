import { createFileRoute } from "@tanstack/react-router";
import { handleHubChat } from "@/hub/hub-ai.server";

export const Route = createFileRoute("/api/hub")({
  server: { handlers: { POST: ({ request }) => handleHubChat(request) } },
});
