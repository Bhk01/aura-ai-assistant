import { createFileRoute } from "@tanstack/react-router";
import { DesignPreview } from '@/components/hub/design-preview';
export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: 'S-IT Hub — Chaque appareil. Chaque délai.' },
    { name: 'description', content: 'Le compagnon des équipes informatiques de Sahloul : appareils en réparation, échéances et documents.' },
    { property: 'og:title', content: 'S-IT Hub — Votre journée, en un coup d’œil' },
    { property: 'og:description', content: 'Un espace attentionné pour suivre chaque appareil et chaque délai.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Index,
});
function Index() {
  return <DesignPreview />;
}
