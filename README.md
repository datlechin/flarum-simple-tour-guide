# Simple Tour Guide

![License](https://img.shields.io/badge/license-MIT-blue.svg) [![Latest Stable Version](https://img.shields.io/packagist/v/datlechin/flarum-simple-tour-guide.svg)](https://packagist.org/packages/datlechin/flarum-simple-tour-guide) [![Total Downloads](https://img.shields.io/packagist/dt/datlechin/flarum-simple-tour-guide.svg)](https://packagist.org/packages/datlechin/flarum-simple-tour-guide)

Guided tours that walk members through your forum. Each step points at
something on the page and says what it is.

## What it does

**Tours, not one tour.** A welcome tour on the index, a what-is-new tour after
an upgrade, a tour of the discussion page. Each has its own steps, its own
audience, and its own record of who has taken it.

**It waits for the right page.** A tour declares the route it belongs to, so a
member arriving from a search engine straight into a discussion still gets the
index tour when they reach the index, rather than a broken half of it there and
then.

**It knows about phones.** The header becomes the drawer below 768px, so a
header selector matches nothing there. Steps and tours can be marked desktop
only, mobile only, or both, and the popover becomes a bottom sheet on a phone.

**Steps that do not apply are left out** before the tour starts, so the progress
count is always right. Leave a target empty and the step is shown on its own in
the middle of the screen, which suits a welcome or a sign-off.

**A step can drive the page.** It can click the element it highlights on the way
to the next step, so a tour can open a menu and then point inside it. Or it can
wait for the member to click it themselves, with the click passing through the
backdrop to the real element.

**Point and click authoring.** Rather than typing CSS selectors and finding out
later that they were wrong, press Pick: the forum opens in a second window, you
hover to highlight and click to capture, and a stable selector comes back. Press
Browse to navigate to another page first. Press Test to see what a selector you
already have actually matches.

**Written in every language you run.** Each step keeps the wording you typed as
its fallback, and you can translate it per locale. Members read it in theirs.

**Descriptions are formatted by the forum's own formatter**, the same one that
renders posts. Links, bold and images work exactly as far as the extensions you
have enabled allow, and nothing new had to be invented to do it.

**Duplicate a tour or a step.** Most steps are a near copy of the one before
with a different element, and a copied tour is how you draft a change to a live
one.

**You can see how it is going.** How many finished, how many left early, and
which step is losing them.

**Preview before anybody sees it.** Opens the forum with the tour running,
whether or not it is switched on and whether or not you have taken it. Nothing
is recorded.

**Import and export.** Move a tour from staging to live as a JSON file. It
arrives switched off, so you can look it over first.

**Audience rules.** Show a tour to particular groups, or only to accounts
younger than a given number of days.

**Members can take one again** from their own settings page, and moderators with
the permission can reset somebody else's from their profile.

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

### Upgrading from 1.x

The migrations carry your existing setup over. Two things worth knowing:

- Your steps had no order of their own, so they are numbered oldest first.
  Check the order in the admin area and drag anything that belongs elsewhere.
- They all become one tour, called "Welcome tour". Whoever had already dismissed
  the old tour is recorded as having finished it.

## Notes

Toggling a formatting extension changes how existing descriptions render. Run
`php flarum cache:clear` afterwards, which you would do anyway.

## Accessibility

The popover is a modal dialog with a focus trap, Escape closes it when the forum
allows closing, and step changes are announced. Reordering in the admin area is
drag only, which a keyboard cannot do.

## Links

- [Packagist](https://packagist.org/packages/datlechin/flarum-simple-tour-guide)
- [GitHub](https://github.com/datlechin/flarum-simple-tour-guide)
- [Discuss](https://discuss.flarum.org/d/33683)

## Support and Donation

If you find this extension helpful and would like to support its development, you can contribute by sponsoring this project: https://github.com/sponsors/datlechin

Your support is greatly appreciated and helps in further enhancing and maintaining this extension for the Flarum community.
