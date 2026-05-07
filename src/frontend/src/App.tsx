import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { AlbumPage } from "./pages/AlbumPage";
import { AlbumsPage } from "./pages/AlbumsPage";
import { ComposePage } from "./pages/ComposePage";
import { HomePage } from "./pages/HomePage";
import { InboxPage } from "./pages/InboxPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ScrapbookPage } from "./pages/ScrapbookPage";
import { SentPage } from "./pages/SentPage";
import { UnboxPage } from "./pages/UnboxPage";

const rootRoute = createRootRoute();

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const composeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/compose",
  component: ComposePage,
});

const inboxRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/inbox",
  component: InboxPage,
});

const sentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sent",
  component: SentPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});

const unboxRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/letter/$id",
  component: UnboxPage,
});

const scrapbookRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/scrapbook/$id",
  component: ScrapbookPage,
});

const albumsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/albums",
  component: AlbumsPage,
});

const albumRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/album/$id",
  component: AlbumPage,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  composeRoute,
  inboxRoute,
  sentRoute,
  profileRoute,
  unboxRoute,
  scrapbookRoute,
  albumsRoute,
  albumRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
