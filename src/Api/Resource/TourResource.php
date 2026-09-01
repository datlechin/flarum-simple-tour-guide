<?php

/*
 * This file is part of datlechin/flarum-simple-tour-guide.
 *
 * Copyright (c) 2023 Ngo Quoc Dat.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Datlechin\FlarumSimpleTourGuide\Api\Resource;

use Datlechin\FlarumSimpleTourGuide\Tour;
use Datlechin\FlarumSimpleTourGuide\TourCompletion;
use Datlechin\FlarumSimpleTourGuide\TourStep;
use Datlechin\FlarumSimpleTourGuide\TourStepTranslation;
use Flarum\Api\Endpoint;
use Flarum\Api\Resource\AbstractDatabaseResource;
use Flarum\Api\Schema;
use Flarum\Api\Sort\SortColumn;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;
use Tobyz\JsonApiServer\Context;

/**
 * Managing tours, which only admins do. What members are shown comes from
 * `TourPayload` instead, already narrowed to them and in their language.
 *
 * @extends AbstractDatabaseResource<Tour>
 */
class TourResource extends AbstractDatabaseResource
{
    public function type(): string
    {
        return 'tour-guide-tours';
    }

    public function model(): string
    {
        return Tour::class;
    }

    /**
     * @param Builder<Tour> $query
     */
    public function scope(Builder $query, Context $context): void
    {
        // Counted in the same query, rather than one more query per tour on
        // the way out.
        $query->withCount('steps');
    }

    public function endpoints(): array
    {
        return [
            Endpoint\Index::make()->admin()->defaultSort('position')->defaultInclude(['steps']),
            Endpoint\Show::make()->admin()->defaultInclude(['steps']),
            Endpoint\Create::make()->admin(),
            Endpoint\Update::make()->admin(),
            Endpoint\Delete::make()->admin(),
        ];
    }

    public function fields(): array
    {
        return [
            Schema\Str::make('key')
                ->writable()
                ->maxLength(100)
                ->unique('tour_guide_tours', 'key', true)
                ->regex('/^[a-z0-9]+(?:-[a-z0-9]+)*$/')
                ->default(fn () => Str::random(8))
                ->set(fn (Tour $tour, string $value) => $tour->key = Str::slug($value)),

            Schema\Str::make('title')
                ->requiredOnCreate()
                ->writable()
                ->maxLength(255)
                ->set(fn (Tour $tour, string $value) => $tour->title = trim($value)),

            Schema\Boolean::make('isEnabled')->writable(),

            // 'auto' starts itself, 'manual' waits to be launched by the member.
            Schema\Str::make('startMode')
                ->writable()
                ->in(Tour::startModes()),

            // A Flarum route name. Empty runs the tour wherever the member is,
            // which suits a tour anchored to the header rather than to a page.
            Schema\Str::make('route')
                ->writable()
                ->nullable()
                ->maxLength(100)
                ->set(fn (Tour $tour, ?string $value) => $tour->route = ($value === null || trim($value) === '') ? null : trim($value)),

            Schema\Str::make('devices')
                ->writable()
                ->in(Tour::deviceOptions()),

            // Empty means everybody.
            Schema\Arr::make('groupIds')
                ->writable()
                ->nullable()
                ->set(function (Tour $tour, mixed $value): void {
                    $ids = array_values(array_unique(array_map('intval', array_filter((array) $value, 'is_numeric'))));

                    $tour->group_ids = $ids === [] ? null : $ids;
                }),

            Schema\Integer::make('maxAccountAgeDays')
                ->writable()
                ->nullable()
                ->min(1)
                ->max(3650),

            Schema\Integer::make('position'),

            Schema\Integer::make('stepCount')
                // A tour that has just been created was never selected with
                // the count, so it falls back to asking.
                ->get(fn (Tour $tour) => (int) ($tour->steps_count ?? $tour->steps()->count())),

            Schema\Relationship\ToMany::make('steps')
                ->type('tour-guide-steps')
                ->includable(),

            Schema\DateTime::make('createdAt'),
            Schema\DateTime::make('updatedAt'),
        ];
    }

    public function sorts(): array
    {
        return [
            SortColumn::make('position'),
            SortColumn::make('title'),
            SortColumn::make('createdAt'),
        ];
    }

    public function creating(object $model, Context $context): ?object
    {
        /** @var Tour $model */
        $model->position = ((int) Tour::query()->max('position')) + 1;

        return $model;
    }

    /**
     * Take the tour's steps, their wording and its completions with it.
     *
     * The foreign keys say to cascade, and on MySQL and PostgreSQL they do.
     * SQLite enforces none of it unless asked, so relying on the database here
     * would leave orphans on some installs and not others. Cheap to do
     * properly, and then it is the same everywhere.
     */
    public function deleting(object $model, Context $context): void
    {
        /** @var Tour $model */
        $stepIds = TourStep::query()->where('tour_id', $model->id)->pluck('id');

        TourStepTranslation::query()->whereIn('step_id', $stepIds)->delete();
        TourCompletion::query()->where('tour_id', $model->id)->delete();
        TourStep::query()->where('tour_id', $model->id)->delete();

        parent::deleting($model, $context);
    }
}
