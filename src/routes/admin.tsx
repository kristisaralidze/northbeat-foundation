import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/admin/login" });
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
    return { isAdmin: Boolean(isAdmin), email: data.user.email ?? "" };
  },
  head: () => ({
    meta: [
      { title: "Admin · Northbeat" },
      { name: "description", content: "Northbeat admin area." },
      { property: "og:title", content: "Admin · Northbeat" },
      { property: "og:description", content: "Northbeat admin area." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

const items = [
  { title: "Logo check", to: "/admin/logo-check" },
  { title: "Missing official assets", to: "/admin/missing-assets" },
  { title: "Fetch brand data", to: "/admin/brand-data" },
  { title: "Cover images", to: "/admin/cover-images" },
  { title: "Website health", to: "/admin/website-health" },
  { title: "Organisations", to: "/admin/organisations" },
  { title: "People", to: "/admin/people" },
  { title: "Events", to: "/admin/events" },
  { title: "Opportunities", to: "/admin/opportunities" },
  { title: "Episodes", to: "/admin/episodes" },
  { title: "Guides", to: "/admin/guides" },
  { title: "Glossary", to: "/admin/glossary" },
  { title: "Newsletter", to: "/admin/newsletter" },
  { title: "Submissions", to: "/admin/submissions" },
  { title: "Tags", to: "/admin/tags" },
] as const;

function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
  };
}

function AdminLayout() {
  const { isAdmin, email } = Route.useRouteContext();
  const signOut = useSignOut();
  const path = useRouterState({ select: (s) => s.location.pathname });

  if (!isAdmin) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <h1 className="text-2xl font-semibold text-foreground">No access</h1>
        <p className="text-sm text-muted-foreground">{email} is not an admin.</p>
        <Button variant="outline" onClick={signOut}>Sign out</Button>
      </main>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Northbeat admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild isActive={path.startsWith(item.to)} tooltip={item.title}>
                        <Link to={item.to}>
                          <span className="w-4 text-center text-xs">{item.title[0]}</span>
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <Button variant="outline" size="sm" onClick={signOut}>Sign out</Button>
          </SidebarFooter>
        </Sidebar>
        <div className="flex flex-1 flex-col">
          <header className="flex h-12 items-center gap-2 border-b px-2">
            <SidebarTrigger />
            <span className="text-sm text-muted-foreground">{email}</span>
          </header>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
