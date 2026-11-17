# Storyblok content integration
- [x] Create six face stories in the separate Tesseract space.
- [x] Render published content and enable Storyblok live editing.
- [x] Verify cube expansion, navigation, and content reads.
- [ ] Configure and verify the Storyblok visual-editor preview — waiting for the website to be published.

# Mobile cube layout
- [x] Tighten screen/content margins and reduce mobile arrows and frames.
- [x] Contain face text and stop cube swipes scrolling the page while keeping expanded pages scrollable.
- [x] Verify mobile navigation, swipes, and expanded-page scrolling.

# Static Storyblok content
- [x] Preserve built Storyblok content when the page becomes interactive, without requiring a server on static hosting.
- [x] Detect missing build credentials and verify the saved content survives loading and navigation.

# Cloudflare build failure
- [x] Use the standard static renderer for external builds and verify the configuration with regression tests.
- [x] Add and test an early build credential/content check to expose failures hidden behind prerender's generic 500.
- [ ] Confirm Cloudflare deployment succeeds — needs a new external build log after the prerequisite check.