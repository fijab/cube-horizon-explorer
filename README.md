# Cube Horizon Explorer

Create a stunning website built like a cube so the user can scroll both horizontally and vertically. The "cube" should give the user a feeling of depth

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a1378098-e8a3-506c-85a4-b9798eca7aa1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Static hosting with Storyblok

- Build command: `npm run build` (or `bun run build`).
- Static output directory: `dist/client`.
- External builds skip Worker packaging and use the standard static renderer; Lovable builds retain their managed Worker packaging.
- For **Cloudflare Pages**, choose framework preset **None**, build command `npm run build`, and output directory `dist/client`. The attached Workers build log used `.output/public`; that folder belongs to the previous Worker packaging, not this static build.
- Add `LOVABLE_API_KEY` and `STORYBLOK_API_KEY_2` to the external host's **build environment**, using the same linked gateway credentials as this project. `STORYBLOK_API_KEY_2` is a Lovable connector key, not a raw Storyblok token. Never commit either credential or prefix it with `VITE_`.
- `npm run build` first checks these variables and the published content, printing a specific error before rendering. Worker runtime secrets alone are not available to the build; credentials do not automatically transfer from Lovable to Cloudflare.
- The build reads published Storyblok stories and saves their content and query state in the HTML. Visitors do not need a server-function endpoint, and focus/reconnection does not refetch content.
- Rebuild after publishing Storyblok changes. Missing credentials or failed Storyblok reads fail prerendering instead of silently baking in placeholder content.
- Live editing that saves/publishes content requires a server-backed preview; static hosting uses the saved build snapshot.
