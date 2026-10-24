import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ProfilePage, ProfileError, ProfileNotFound } from '@/components/site/ProfilePage';
import { opportunitiesQuery } from '@/lib/opportunities.query';
import { profileQuery } from '@/lib/profiles.query';
import { profileHead } from '@/lib/profile-head';
export const Route = createFileRoute('/opportunity/$slug')({
  loader: async ({ context, params }) => { const [profile] = await Promise.all([context.queryClient.ensureQueryData(profileQuery('opportunities', params.slug)),context.queryClient.ensureQueryData(opportunitiesQuery)]);return profile; },
  head: ({ loaderData, params }) => profileHead(loaderData, `/opportunity/${encodeURIComponent(params.slug)}`, { kind: 'opportunity', slug: params.slug }),
  component: Profile,
  errorComponent: ProfileError,
  notFoundComponent: ProfileNotFound,
});
function Profile() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(profileQuery('opportunities', slug));
  return <ProfilePage profile={data} />;
}
