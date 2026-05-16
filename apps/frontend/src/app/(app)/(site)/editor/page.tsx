import { Metadata } from 'next';
import { EditorPresets } from '@gitroom/frontend/components/editor/editor-presets';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'AcadéPost - Éditeur',
  description:
    'Créez des modèles de posts et carrousels réutilisables pour les agents AcadéPost.',
};

export default function EditorPage() {
  return <EditorPresets />;
}
