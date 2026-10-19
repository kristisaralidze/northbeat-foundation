import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ProfilePage, ProfileError, ProfileNotFound } from '@/components/site/ProfilePage';
import { profileQuery } from '@/lib/profiles.query';
import { profileHead } from '@/lib/profile-head';
export const Route = createFileRoute('/podcast/$slug')({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(profileQuery('episodes', params.slug)),
  head: ({ loaderData, params }) => profileHead(loaderData, `/podcast/${encodeURIComponent(params.slug)}`),
  component: Profile,
  errorComponent: ProfileError,
  notFoundComponent: ProfileNotFound,
});
function Profile() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(profileQuery('episodes', slug));
  return <ProfilePage profile={data} />;
}
