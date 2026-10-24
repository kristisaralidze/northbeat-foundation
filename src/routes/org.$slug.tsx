import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ProfilePage, ProfileError, ProfileNotFound } from '@/components/site/ProfilePage';
import { profileQuery } from '@/lib/profiles.query';
import { profileHead } from '@/lib/profile-head';
export const Route = createFileRoute('/org/$slug')({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(profileQuery('organisations', params.slug)),
  head: ({ loaderData, params }) => profileHead(loaderData, `/org/${encodeURIComponent(params.slug)}`, { kind: 'org', slug: params.slug }),
  component: Profile,
  errorComponent: ProfileError,
  notFoundComponent: ProfileNotFound,
});
function Profile() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(profileQuery('organisations', slug));
  return <ProfilePage profile={data} />;
}
