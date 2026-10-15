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
use Flarum\User\User;
use Illuminate\Contracts\Validation\Factory;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class TourTransfer
{
    public const VERSION = 1;

    public function __construct(
        protected ConnectionInterface $connection,
        protected Factory $validator,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function export(Tour $tour): array
    {
        $tour->loadMissing('steps.translations');

        return [
            'version' => self::VERSION,
            'tour' => [
                'key' => $tour->key,
                'title' => $tour->title,
                'startMode' => $tour->start_mode,
                'route' => $tour->route,
                'devices' => $tour->devices,
                'maxAccountAgeDays' => $tour->max_account_age_days,
            ],
            'steps' => $tour->steps->map(fn (TourStep $step) => [
                'title' => $step->title,
                'description' => $step->content,
                'target' => $step->target,
                'placement' => $step->placement,
                'devices' => $step->devices,
                'isEnabled' => $step->is_enabled,
                'clicksTarget' => $step->clicks_target,
                'advanceOnClick' => $step->advance_on_click,
                'translations' => $step->translationMap(),
            ])->all(),
        ];
    }

    /**
     * @param array<string, mixed> $document
     */
    public function import(array $document, User $actor): Tour
    {
        $this->validator->make($document, [
            'version' => ['required', 'in:'.self::VERSION],
            'tour' => ['required', 'array'],
            'steps' => ['present', 'array'],
            'steps.*' => ['array'],
        ])->validate();

        return $this->connection->transaction(function () use ($document, $actor) {
            $attributes = $document['tour'];

            $tour = new Tour();
            $tour->key = $this->availableKey((string) Arr::get($attributes, 'key', 'imported-tour'));
            $tour->title = (string) Arr::get($attributes, 'title', $tour->key);
            // An import lands unreviewed, and its groups belong to the forum it came from.
            $tour->is_enabled = false;
            $tour->start_mode = $this->oneOf(Arr::get($attributes, 'startMode'), Tour::startModes(), Tour::START_AUTO);
            $tour->route = Arr::get($attributes, 'route') ?: null;
            $tour->devices = $this->oneOf(Arr::get($attributes, 'devices'), Tour::deviceOptions(), Tour::DEVICES_ANY);
            $tour->max_account_age_days = is_numeric($maxAge = Arr::get($attributes, 'maxAccountAgeDays')) ? (int) $maxAge : null;
            $tour->position = Tour::nextPosition(Tour::query());
            $tour->save();

            foreach (array_values($document['steps']) as $position => $data) {
                $step = new TourStep();
                $step->tour_id = $tour->id;
                $step->title = (string) Arr::get($data, 'title', '');
                $step->setContentAttribute((string) Arr::get($data, 'description', ''), $actor);
                $step->target = Arr::get($data, 'target') ?: null;
                $step->placement = $this->oneOf(Arr::get($data, 'placement'), TourStep::placements(), TourStep::PLACEMENT_AUTO);
                $step->devices = $this->oneOf(Arr::get($data, 'devices'), Tour::deviceOptions(), Tour::DEVICES_ANY);
                $step->is_enabled = (bool) Arr::get($data, 'isEnabled', true);
                $step->clicks_target = (bool) Arr::get($data, 'clicksTarget', false);
                $step->advance_on_click = (bool) Arr::get($data, 'advanceOnClick', false);
                $step->position = $position;
                $step->save();

                foreach ((array) Arr::get($data, 'translations', []) as $locale => $content) {
                    if (is_string($locale) && is_array($content)) {
                        $step->saveTranslation(Str::limit($locale, 20, ''), (string) Arr::get($content, 'title', ''), (string) Arr::get($content, 'description', ''), $actor);
                    }
                }
            }

            return $tour;
        });
    }

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
