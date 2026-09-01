# Changelog

## 2.0.0

The first release for Flarum 2, following the 0.2.x line for Flarum 1. The
major version tracks Flarum's, so 2.x means Flarum 2.

Requires Flarum 2.0. Run `php flarum migrate` after updating from 0.2.x.

### Breaking

- The extension is now called **Tour Guide**. The package name, PHP namespace
  and extension id are unchanged, so nothing installed breaks.
- `users.tour_guide_dismissed_at` is replaced by a `tour_guide_completions`
  table. Existing dismissals are migrated and recorded as finished.
- Your steps become one tour called "Welcome tour". They had no order of their
  own before, so they are numbered oldest first. Check the order in the admin
  area.
- `is_trigger_click` is now `clicks_target`, and the API attribute is
  `clicksTarget`.
- The `skip_null_elements` setting is gone. Skipping steps that do not fit is
  now how the tour always behaves.
- driver.js is no longer used. Custom CSS targeting `.driver-*` will not apply.

### Fixed

- Anyone signed in could create, edit and delete steps. The write endpoints
  were never authorised.
- The reset permission checked the target user rather than the actor.
- The "Allow close" setting used three different keys and never worked.
- Steps ran in an undefined order. The table's timestamps were never written,
  so ordering by them was ordering by null.
- `tourGuideDismissedAt` was exposed to anyone who could see a user.

### Added

- Several tours, each with its own steps, audience and completion record.
- Tours are bound to a route and wait for it, instead of running wherever the
  member happens to land.
- Desktop and mobile targeting, with a bottom sheet popover on phones.
- Steps can click what they highlight, or wait for the member to click it.
- A point-and-click selector picker, with a test mode.
- Per-locale step content, falling back to what was typed.
- Descriptions rendered by the forum's own formatter.
- Audience rules by group and by account age.
- Completion statistics, including which step loses people.
- JSON import and export, duplication, and preview.
- Members can retake a tour from their settings page.
- Reordering from each row's menu, for anyone not using a mouse.

### Changed

- The tour is drawn with Flarum's own components and design tokens rather than
  a restyled third-party library. The forum bundle is smaller than before.
- The popover is a modal dialog with a focus trap, Escape to close, and step
  changes announced.
