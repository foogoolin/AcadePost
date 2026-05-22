export const dynamic = 'force-dynamic';

import { ProviderLogsComponent } from '@gitroom/frontend/components/provider-logs/provider-logs.component';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AcadéPost Provider Pipeline',
  description: '',
};

export default async function Index() {
  return <ProviderLogsComponent />;
}
