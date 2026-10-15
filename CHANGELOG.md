# Changelog

## 2.1.0

Run `php flarum migrate` after updating. Descriptions are converted to the
formatter's stored format, and audience groups move to a table of their own.

### Changed

- Leaving the page ends the tour and records it as left early. A click on the
  last step that leads elsewhere counts as finished.
- The progress count covers every step meant for the device and never moves. A
  step whose element is missing is skipped when reached.
- A step that waits for the member's click picks up the steps that click
  reveals, the same as a step that clicks its target.
- Clicks on the tour no longer reach the page, so a menu a step points into
  stays open.
- Tours start once the page has its content, instead of polling for up to 8
  seconds.
- One tour per page visit. Another tour due on the same page waits for the next
  visit.
- Pick, Test and Preview open the forum on the tour's page when the route needs
  no discussion or member.
- Descriptions are parsed when saved, as posts are. Toggling a formatting
  extension no longer needs `php flarum cache:clear`.
- Audience groups follow Flarum's permission groups, so an unconfirmed account
  only counts as a guest.
- Duplicating a tour keeps its audience.
- The reset control shows to everyone allowed to reset, without counting
  completions first.

### Fixed

- A tour aimed at the Members group never matched anyone.
- Closing a preview opened it again.
- Escape closed the tour while it was closing a menu.
- A step stayed in the middle of the screen after its element was redrawn.
- Header items in the closed phone drawer counted as on screen.

### API

- Members read `GET /api/tour-guide-tours?filter[available]=1`.
- Completions are recorded with `POST /api/tour-guide-completions`.
- Reset is `DELETE /api/users/{id}/tour-guide-completions`.
- Order, duplicate, stats, export and import are endpoints of the
  `tour-guide-tours` and `tour-guide-steps` resources.
- The `/api/tour-guide/*` routes and the `tourGuideCompletionCount` user
  attribute are gone.
- Audience groups are the `groups` relationship, replacing `groupIds`.
- Creating a tour or step answers with the defaults of the fields left out,
  instead of `null`.
- In the forum JS, `showTour` takes a `Tour` model. `TourData` and
  `TourStepData` are gone.

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
