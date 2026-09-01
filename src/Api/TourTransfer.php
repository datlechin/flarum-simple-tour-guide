<?php

/*
 * This file is part of datlechin/flarum-simple-tour-guide.
 *
 * Copyright (c) 2023 Ngo Quoc Dat.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Datlechin\FlarumSimpleTourGuide\Api;

use Datlechin\FlarumSimpleTourGuide\Tour;
use Datlechin\FlarumSimpleTourGuide\TourStep;
use Datlechin\FlarumSimpleTourGuide\TourStepTranslation;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use InvalidArgumentException;

/**
 * Reads and writes a tour as a plain document, so one can be moved from a
 * staging forum to a live one without retyping it.
 *
 * What travels is the tour as written: no ids, and no record of who has been
 * through it, because neither means anything on the other forum.
 */
class TourTransfer
{
    public const VERSION = 1;

    public function __construct(
        protected ConnectionInterface $connection,
    ) {
    }

    public function export(Tour $tour): array
    {
        $tour->loadMissing(['steps.translations']);

        $steps = $tour->steps
            ->sortBy([['position', 'asc'], ['id', 'asc']])
            ->map(fn (TourStep $step) => [
                'title' => $step->title,
                'description' => $step->description,
                'target' => $step->target,
                'placement' => $step->placement,
                'devices' => $step->devices,
                'isEnabled' => $step->is_enabled,
                'clicksTarget' => $step->clicks_target,
                'advanceOnClick' => $step->advance_on_click,
                'translations' => $step->translations
                    ->sortBy('locale')
                    ->mapWithKeys(fn (TourStepTranslation $t) => [
                        $t->locale => ['title' => $t->title, 'description' => $t->description],
                    ])
                    ->all(),
            ])
            ->values()
            ->all();

        return [
            'version' => self::VERSION,
            'tour' => [
                'key' => $tour->key,
                'title' => $tour->title,
                'isEnabled' => $tour->is_enabled,
                'startMode' => $tour->start_mode,
                'route' => $tour->route,
                'devices' => $tour->devices,
                'groupIds' => $tour->group_ids,
                'maxAccountAgeDays' => $tour->max_account_age_days,
            ],
            'steps' => $steps,
        ];
    }

    /**
     * @throws InvalidArgumentException when the document is not one of ours.
     */
    public function import(array $document): Tour
    {
        if (Arr::get($document, 'version') !== self::VERSION) {
            throw new InvalidArgumentException('Unsupported tour document version.');
        }

        $attributes = Arr::get($document, 'tour');
        $steps = Arr::get($document, 'steps');

        if (! is_array($attributes) || ! is_array($steps)) {
            throw new InvalidArgumentException('A tour document needs a tour and its steps.');
        }

        return $this->connection->transaction(function () use ($attributes, $steps) {
            $tour = new Tour();
            $tour->key = $this->availableKey(Arr::get($attributes, 'key', 'imported-tour'));
            $tour->title = (string) Arr::get($attributes, 'title', $tour->key);

            // Off on arrival, whatever it was on the forum it came from: an
            // import lands unreviewed, and a tour nobody has looked at should
            // not start showing itself to members.
            $tour->is_enabled = false;

            $tour->start_mode = $this->oneOf(Arr::get($attributes, 'startMode'), Tour::startModes(), Tour::START_AUTO);
            $tour->route = Arr::get($attributes, 'route') ?: null;
            $tour->devices = $this->oneOf(Arr::get($attributes, 'devices'), Tour::deviceOptions(), Tour::DEVICES_ANY);

            // Group ids name groups on the forum it came from, which are not
            // the groups here, so the audience is left open for the admin to
            // set again rather than guessed at.
            $tour->group_ids = null;

            $maxAge = Arr::get($attributes, 'maxAccountAgeDays');
            $tour->max_account_age_days = is_numeric($maxAge) ? (int) $maxAge : null;

            $tour->position = ((int) Tour::query()->max('position')) + 1;
            $tour->save();

            foreach (array_values($steps) as $position => $step) {
                if (! is_array($step)) {
                    continue;
                }

                $model = new TourStep();
                $model->tour_id = $tour->id;
                $model->title = (string) Arr::get($step, 'title', '');
                $model->description = (string) Arr::get($step, 'description', '');
                $model->target = Arr::get($step, 'target') ?: null;
                $model->placement = $this->oneOf(Arr::get($step, 'placement'), TourStep::placements(), TourStep::PLACEMENT_AUTO);
                $model->devices = $this->oneOf(Arr::get($step, 'devices'), Tour::deviceOptions(), Tour::DEVICES_ANY);
                $model->is_enabled = (bool) Arr::get($step, 'isEnabled', true);
                $model->clicks_target = (bool) Arr::get($step, 'clicksTarget', false);
                $model->advance_on_click = (bool) Arr::get($step, 'advanceOnClick', false);
                $model->position = $position;
                $model->save();

                foreach ((array) Arr::get($step, 'translations', []) as $locale => $content) {
                    if (! is_string($locale) || ! is_array($content)) {
                        continue;
                    }

                    $translation = new TourStepTranslation();
                    $translation->step_id = $model->id;
                    $translation->locale = Str::limit($locale, 20, '');
                    $translation->title = (string) Arr::get($content, 'title', '');
                    $translation->description = (string) Arr::get($content, 'description', '');
                    $translation->save();
                }
            }

            return $tour;
        });
    }

    /**
     * Keys are unique, and an import should never overwrite the tour already
     * living under that name.
     */
    protected function availableKey(string $wanted): string
    {
        $base = Str::limit(Str::slug($wanted) ?: 'imported-tour', 90, '');
        $key = $base;
        $suffix = 2;

        while (Tour::query()->where('key', $key)->exists()) {
            $key = $base.'-'.$suffix++;
        }

        return $key;
    }

    protected function oneOf(mixed $value, array $allowed, string $fallback): string
    {
        return is_string($value) && in_array($value, $allowed, true) ? $value : $fallback;
    }
}
