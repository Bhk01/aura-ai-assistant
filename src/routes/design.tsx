import { createFileRoute } from '@tanstack/react-router';
import { DesignPreview } from '@/components/hub/design-preview';
export const Route = createFileRoute('/design')({
  head: () => ({ meta: [
    { title: 'S-IT Hub — Atelier de design' },
    { name: 'description', content: 'Palette, typographie, commandes et personnage Hub : le langage visuel de S-IT Hub.' },
    { property: 'og:title', content: 'S-IT Hub — Atelier de design' },
    { property: 'og:description', content: 'Le langage visuel original de S-IT Hub.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: Design,
});
function Design() { return <DesignPreview gallery />; }