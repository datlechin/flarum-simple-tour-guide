# Tour Guide

![License](https://img.shields.io/badge/license-MIT-blue.svg) [![Latest Stable Version](https://img.shields.io/packagist/v/datlechin/flarum-simple-tour-guide.svg)](https://packagist.org/packages/datlechin/flarum-simple-tour-guide) [![Total Downloads](https://img.shields.io/packagist/dt/datlechin/flarum-simple-tour-guide.svg)](https://packagist.org/packages/datlechin/flarum-simple-tour-guide)

Guided tours that walk new members through your forum. Each step points at
something on the page and says what it is.

![A step anchored to an element](screenshots/02-anchored.png)

## Features

- **Several tours.** A welcome tour on the index, another on the discussion
  page, a what-is-new tour after an upgrade. Each keeps its own record of who
  has taken it.
- **Bound to a page.** A tour names the route it belongs to and waits for it, so
  a member who lands somewhere else still gets it when they arrive.
- **Desktop and mobile.** Mark a tour or a step for one or the other. On a phone
  the popover becomes a bottom sheet.
- **Steps that do not fit are skipped**, so the progress count is always right.
  A step with no target is shown in the middle of the screen.
- **Steps can drive the page.** A step can click what it highlights, so the next
  one can point inside a menu. Or it can wait for the member to click it.
- **Pick targets by clicking them.** Press Pick and the forum opens in a second
  window: hover to highlight, click to capture. Press Test to see what a
  selector you already have matches.

  ![Picking an element](screenshots/08-element-picker.png)
- **Translations.** Write each step per locale. Anything untranslated falls back
  to what you typed.
- **Formatted descriptions.** Rendered by the forum's own formatter, so Markdown,
  links and images work as far as your enabled extensions allow.
- **Audience rules.** Limit a tour to certain groups, or to accounts under a
  given age in days.
- **Statistics.** How many finished, how many left early, and which step loses
  them.
- **Preview** a tour before switching it on. Nothing is recorded.
- **Import and export** as JSON, to move a tour between forums.
- **Duplicate** a tour or a step.
- **Replay.** Members can retake a tour from their settings. Moderators with the
  permission can reset one for somebody else.

## More

| | |
|---|---|
| ![Centred step](screenshots/01-welcome-centred.png) | A step with no target, shown on its own |
| ![Click to continue](screenshots/06-click-to-continue.png) | A step that waits for the member to click |
| ![Bottom sheet](screenshots/07-mobile-sheet.png) | The popover on a phone |
| ![Admin](screenshots/09-admin-tours.png) | Tours, their steps, and how they are doing |
| ![Step editor](screenshots/10-step-modal.png) | Editing a step, with Pick, Test and translations |

## Installation

```sh
composer require datlechin/flarum-simple-tour-guide:"*"
php flarum migrate
php flarum cache:clear
```

## Updating

```sh
composer update datlechin/flarum-simple-tour-guide
php flarum migrate
php flarum cache:clear
```

## Upgrading from 0.x

Your steps are carried over into one tour called "Welcome tour", and anyone who
had dismissed the old tour is recorded as having finished it.

Steps had no order of their own before, so they are numbered oldest first. Check
the order in the admin area and drag anything out of place.

## Notes

- Descriptions are cached once rendered. After enabling or disabling a
  formatting extension, run `php flarum cache:clear`.
- Lists reorder by dragging, or from each row's menu if you are not using a
  mouse.

## Changelog

See [CHANGELOG.md](CHANGELOG.md). Version 2.0 is a rewrite for Flarum 2 with
breaking changes; read the upgrade notes above before updating.

## Links

- [Packagist](https://packagist.org/packages/datlechin/flarum-simple-tour-guide)
- [GitHub](https://github.com/datlechin/flarum-simple-tour-guide)
- [Discuss](https://discuss.flarum.org/d/33683)

## Support

If this extension is useful to you, you can sponsor its development at
https://github.com/sponsors/datlechin.
