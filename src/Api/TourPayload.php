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
use Datlechin\FlarumSimpleTourGuide\TourCompletion;
use Datlechin\FlarumSimpleTourGuide\TourStep;
use Flarum\Locale\TranslatorInterface;
use Flarum\User\User;

/**
 * Builds what the forum needs to run somebody's tours, and nothing else.
 *
 * Audience rules and every language but the reader's are resolved here rather
 * than shipped to the browser: the browser has no business knowing which
 * groups a tour is aimed at, and no use for wording it will never show.
 */
class TourPayload
{
    public function __construct(
        protected TranslatorInterface $translator,
        protected StepRenderer $renderer,
    ) {
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function forActor(User $actor, ?string $previewKey = null): array
    {
        if (! $actor->exists) {
            return [];
        }

        $preview = $previewKey !== null && $actor->isAdmin();

        $tours = Tour::query()
            // One call, not two: a second `with` naming `steps` again would
            // register it afresh without the ordering and quietly drop it.
            ->with([
                'steps' => fn ($query) => $query->orderBy('position')->orderBy('id'),
                'steps.translations',
            ])
            ->when($preview, fn ($query) => $query->where('key', $previewKey))
            ->when(! $preview, fn ($query) => $query->where('is_enabled', true))
            ->orderBy('position')
            ->orderBy('id')
            ->get();

        // Read once rather than once per tour, which is what asking the actor
        // for its groups inside the filter would do.
        $groupIds = $actor->groups->pluck('id')->all();

        $tours = $tours
            // Previewing is how an admin sees their own work, so it ignores who
            // the tour is aimed at. Everything else respects it.
            ->filter(fn (Tour $tour) => $preview || $tour->isFor($actor, $groupIds));

        if ($tours->isEmpty()) {
            return [];
        }

        $completed = TourCompletion::query()
            ->where('user_id', $actor->id)
            ->whereIn('tour_id', $tours->pluck('id'))
            ->pluck('tour_id')
            ->all();

        $locale = $this->translator->getLocale();

        return $tours
            ->map(fn (Tour $tour) => [
                'id' => (int) $tour->id,
                'key' => $tour->key,
                'title' => $tour->title,
                'startMode' => $tour->start_mode,
                'route' => $tour->route,
                'devices' => $tour->devices,
                'completed' => in_array($tour->id, $completed, true),
                'preview' => $preview,
                'steps' => $this->steps($tour, $locale),
            ])
            // A tour with nothing left to show is not a tour.
            ->filter(fn (array $tour) => $tour['steps'] !== [])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    protected function steps(Tour $tour, string $locale): array
    {
        return $tour->steps
            // Sorted here as well as in the query. A tour whose steps arrive in
            // the wrong order is not a tour, and "whatever the database felt
            // like" is exactly how the 1.x version got it wrong.
            ->sortBy([['position', 'asc'], ['id', 'asc']])
            ->filter(fn (TourStep $step) => $step->is_enabled)
            ->map(function (TourStep $step) use ($locale) {
                $content = $step->contentFor($locale);

                return [
                    'id' => (int) $step->id,
                    'title' => $content['title'],
                    // HTML, rendered by the forum's own formatter.
                    'description' => $this->renderer->render($content['description']),
                    'target' => $step->target,
                    'placement' => $step->placement,
                    'devices' => $step->devices,
                    'clicksTarget' => $step->clicks_target,
                    'advanceOnClick' => $step->advance_on_click,
                ];
            })
            ->values()
            ->all();
    }
}
