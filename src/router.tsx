import { QueryClient, dehydrate, hydrate } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    dehydrate: () => ({ queryClientState: JSON.stringify(dehydrate(queryClient)) }),
    hydrate: (dehydrated) => {
      hydrate(queryClient, JSON.parse(dehydrated.queryClientState));
    },
  });

  return router;
};
