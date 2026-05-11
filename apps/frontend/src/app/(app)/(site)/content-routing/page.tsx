import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'AcadéPost Content Routing',
  description: 'Route video, short text, and carousel content to the right channels.',
};

const routingGroups = [
  {
    type: 'video',
    title: 'Video',
    description: 'Short-form and long-form video distribution.',
    platforms: ['YouTube', 'TikTok', 'Instagram Reels'],
  },
  {
    type: 'short_text',
    title: 'Short Text',
    description: 'Fast text-first publishing for conversation channels.',
    platforms: ['Threads', 'X'],
  },
  {
    type: 'carousel',
    title: 'Carousel',
    description: 'Multi-image posts for visual discovery and Meta channels.',
    platforms: ['Meta', 'Pinterest'],
  },
];

export default async function ContentRoutingPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 p-6">
      <section className="flex flex-col gap-2">
        <div className="w-fit rounded-full border border-acadeMint/30 bg-acadeMint/10 px-3 py-1 text-sm font-medium uppercase text-acadeMint">
          AcadéPost MVP
        </div>
        <h1 className="text-4xl font-semibold text-textColor">
          Content Routing
        </h1>
        <p className="max-w-3xl text-base leading-7 text-newTableText">
          Prepare one piece of content, classify it by format, and route it to
          the social platforms that match the publishing intent.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {routingGroups.map((group) => (
          <article
            key={group.type}
            className="acadepost-card flex min-h-[220px] flex-col justify-between p-6"
          >
            <div className="flex flex-col gap-3">
              <div className="text-xs font-semibold uppercase text-acadeAmber">
                {group.type}
              </div>
              <h2 className="text-xl font-semibold text-textColor">
                {group.title}
              </h2>
              <p className="text-sm leading-6 text-newTableText">
                {group.description}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {group.platforms.map((platform) => (
                <span
                  key={platform}
                  className="acadepost-pill border border-newBgLineColor px-3 py-2 text-sm text-textColor"
                >
                  {platform}
                </span>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="acadepost-card p-6">
        <h2 className="mb-3 text-xl font-semibold text-textColor">
          Demo Workflow
        </h2>
        <ol className="grid gap-3 text-sm text-newTableText md:grid-cols-4">
          <li>Create or import content.</li>
          <li>Choose video, short text, or carousel.</li>
          <li>Confirm the suggested platform group.</li>
          <li>Schedule through the existing publishing calendar.</li>
        </ol>
      </section>
    </div>
  );
}
