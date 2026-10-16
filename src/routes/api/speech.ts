import { createFileRoute } from '@tanstack/react-router';
import { handleHubSpeech } from '@/hub/hub-ai.server';

export const Route = createFileRoute('/api/speech')({
  server: { handlers: { POST: ({ request }) => handleHubSpeech(request) } },
});
