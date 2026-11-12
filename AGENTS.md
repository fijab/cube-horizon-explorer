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
