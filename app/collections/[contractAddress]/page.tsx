import { redirect } from 'next/navigation';

interface CollectionPageProps {
  params: { contractAddress: string };
}

/** Keep legacy collection links on one canonical, live contract experience. */
export default function CollectionPage({ params }: CollectionPageProps) {
  redirect(`/mint/${encodeURIComponent(params.contractAddress)}`);
}
