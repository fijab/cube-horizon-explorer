<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Cube geometry stays local; face stories use the public Storyblok CDN through a server function so management credentials and drafts never reach visitors.
- Cube face stories compose reusable teaser and reading blocks rendered with the Storyblok SDK, keeping content editing independent of rotation.
- The cube page is prerendered to static HTML at build time; Storyblok content refreshes on each rebuild/publish (why: static hosting, no per-request rendering).
- Serialize the Query cache through Router dehydrate/hydrate and disable automatic cube-content refetches; static hosts must hydrate the build snapshot without calling a server endpoint.
- Enable Nitro only inside the Lovable sandbox; external static builds use TanStack's Node prerenderer to avoid executing a Cloudflare Worker wrapper during build.
- Run a published-content preflight before the build; external builds read the Storyblok CDN directly with only the public token, Lovable routes through the connector gateway (why: hosts outside Lovable lack the gateway key).
- Keep cube previews bounded with clamped text and mobile frame sizing in CSS; expanded stories remain scrollable so long content is available without spilling across 3D faces.
