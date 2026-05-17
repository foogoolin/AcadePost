import { Metadata } from 'next';
import { EditorPresets } from '@gitroom/frontend/components/editor/editor-presets';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'AcadéPost - Editeur',
  description:
    'Creez des modeles de posts et carrousels reutilisables pour les agents AcadéPost.',
};

export default function EditorPage() {
  return <EditorPresets />;
}
