import { Metadata } from 'next';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'AcadéPost - Routage de contenu',
  description:
    'Orientez les vidéos, textes courts et carrousels vers les bons canaux sociaux.',
};

const routingGroups = [
  {
    type: 'video',
    eyebrow: 'VIDÉO',
    title: 'Vidéo',
    description:
      'Regroupez les formats courts et longs vers les canaux vidéo adaptés à la publication.',
    platforms: ['YouTube', 'TikTok', 'Instagram Reels'],
    signal: 'Formats courts, capsules, replays',
  },
  {
    type: 'short_text',
    eyebrow: 'TEXTE COURT',
    title: 'Texte court',
    description:
      'Préparez les messages conversationnels pour les fils rapides et les annonces courtes.',
    platforms: ['Threads', 'X'],
    signal: 'Idées, actualités, réactions',
  },
  {
    type: 'carousel',
    eyebrow: 'CARROUSEL',
    title: 'Carrousel',
    description:
      'Structurez les séries visuelles pour les posts multi-images et la découverte.',
    platforms: ['Meta', 'Pinterest'],
    signal: 'Slides, visuels pédagogiques, portfolios',
  },
];

const workflow = [
  'Importer ou rédiger le contenu',
  'Choisir le format de publication',
  'Valider le groupe de plateformes',
  'Planifier dans le calendrier',
];

export default async function ContentRoutingPage() {
  return (
    <div className="acadepost-content-page flex w-full flex-1 flex-col overflow-auto">
      <section className="acadepost-routing-hero px-6 py-8 lg:px-10 lg:py-10">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex max-w-[720px] flex-col gap-4">
            <div className="acadepost-routing-badge w-fit px-3 py-1 text-xs font-[800] uppercase">
              AcadéPost Routing
            </div>
            <div className="flex flex-col gap-3">
              <h1 className="text-[34px] font-[800] leading-tight text-textColor md:text-[44px]">
                Routage de contenu
              </h1>
              <p className="max-w-[680px] text-[15px] leading-7 text-newTableText">
                Classez chaque contenu par intention de publication, puis
                préparez les plateformes recommandées avant le passage au
                calendrier.
              </p>
            </div>
          </div>

          <div className="grid w-full max-w-[420px] grid-cols-3 gap-2">
            {routingGroups.map((group) => (
              <div
                key={group.type}
                className="acadepost-routing-card flex min-h-[86px] flex-col justify-between p-3"
              >
                <span className="text-[10px] font-[800] uppercase text-acadeAmber">
                  {group.eyebrow}
                </span>
                <span className="text-[13px] font-[800] text-textColor">
                  {group.platforms.length} canaux
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-6 py-6 lg:px-10">
        <section className="grid gap-4 xl:grid-cols-3">
          {routingGroups.map((group) => (
            <article
              key={group.type}
              className="acadepost-routing-card flex min-h-[250px] flex-col justify-between p-6"
            >
              <div className="flex flex-col gap-4">
                <div className="text-xs font-[800] uppercase text-acadeAmber">
                  {group.eyebrow}
                </div>
                <div className="flex flex-col gap-2">
                  <h2 className="text-[22px] font-[800] text-textColor">
                    {group.title}
                  </h2>
                  <p className="text-sm leading-6 text-newTableText">
                    {group.description}
                  </p>
                </div>
                <p className="text-xs font-[700] uppercase text-acadeMint">
                  {group.signal}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {group.platforms.map((platform) => (
                  <span
                    key={platform}
                    className="acadepost-routing-chip px-3 py-2 text-sm font-[700]"
                  >
                    {platform}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </section>

        <section className="acadepost-routing-workflow flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-4">
            <h2 className="text-[20px] font-[800] text-textColor">
              Parcours de démonstration
            </h2>
            <ol className="grid gap-3 text-sm text-newTableText md:grid-cols-4">
              {workflow.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="text-acadeMint font-[800]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/launches"
              className="acadepost-routing-primary-action px-4 py-3 text-sm"
            >
              Ouvrir le calendrier
            </Link>
            <Link
              href="/media"
              className="acadepost-routing-secondary-action px-4 py-3 text-sm font-[700]"
            >
              Bibliothèque média
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
