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

use Datlechin\FlarumSimpleTourGuide\Api\TourTransfer;
use Datlechin\FlarumSimpleTourGuide\Tour;
use Datlechin\FlarumSimpleTourGuide\TourCompletion;
use Datlechin\FlarumSimpleTourGuide\TourStep;
use Flarum\Api\Context;
use Flarum\Api\Endpoint;
use Flarum\Api\Resource\AbstractDatabaseResource;
use Flarum\Api\Schema;
use Flarum\Api\Sort\SortColumn;
use Flarum\Locale\TranslatorInterface;
use Illuminate\Contracts\Validation\Factory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;
use Laminas\Diactoros\Response\EmptyResponse;
use Tobyz\JsonApiServer\Context as BaseContext;

/**
 * @extends AbstractDatabaseResource<Tour>
 */
class TourResource extends AbstractDatabaseResource
{
    public function __construct(
        protected TourTransfer $transfer,
        protected TranslatorInterface $translator,
        protected Factory $validator,
    ) {
    }

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
    public function scope(Builder $query, BaseContext $context): void
    {
        $query->whereVisibleTo($context->getActor());
    }

    public function endpoints(): array
    {
        return [
            Endpoint\Index::make()
                ->authenticated()
                ->defaultSort('position')
                ->eagerLoadWhenIncluded([
                    'steps' => ['steps.translations'],
                    'enabledSteps' => ['enabledSteps.translations'],
                ]),
            Endpoint\Show::make()->admin(),
            // The store builds the saved tour from the response alone, so an audience left out of it is lost on the next edit.
            Endpoint\Create::make()->admin()->defaultInclude(['groups']),
            Endpoint\Update::make()->admin()->defaultInclude(['groups']),
            Endpoint\Delete::make()->admin(),
            Endpoint\Endpoint::make('order')
                ->route('POST', '/order')
                ->admin()
                ->action(fn (Context $context) => Tour::reorder(Tour::query(), $this->order($context)))
                ->response(fn () => new EmptyResponse(204)),
            Endpoint\Endpoint::make('steps.order')
                ->route('POST', '/{id}/steps/order')
                ->admin()
                ->action(fn (Context $context) => TourStep::reorder(TourStep::query()->where('tour_id', $context->model->id), $this->order($context)))
                ->response(fn () => new EmptyResponse(204)),
            Endpoint\Create::make('duplicate')
                ->route('POST', '/{id}/duplicate')
                ->admin()
                ->action(fn (Context $context) => $this->duplicate($context->model, $context)),
            Endpoint\Create::make('import')
                ->route('POST', '/import')
                ->admin()
                ->action(fn (Context $context) => $this->transfer->import((array) $context->body(), $context->getActor())),
            Endpoint\Endpoint::make('export')
                ->route('GET', '/{id}/export')
                ->admin()
                ->action(fn (Context $context) => ['meta' => $this->transfer->export($context->model)]),
            Endpoint\Endpoint::make('stats')
                ->route('GET', '/{id}/stats')
                ->admin()
                ->action(fn (Context $context) => ['meta' => $this->stats($context->model)]),
        ];
    }

    public function fields(): array
    {
        $admin = fn (Tour $tour, Context $context) => $context->getActor()->isAdmin();

        return [
            Schema\Str::make('key')
                ->writable()
                ->maxLength(100)
                ->unique('tour_guide_tours', 'key', true)
                ->regex('/^[a-z0-9]+(?:-[a-z0-9]+)*$/')
                ->default(fn () => Str::lower(Str::random(8))),

            Schema\Str::make('title')
                ->requiredOnCreate()
                ->writable()
                ->maxLength(255)
                ->set(fn (Tour $tour, string $value) => $tour->title = trim($value)),

            Schema\Boolean::make('isEnabled')
                ->writable()
                ->visible($admin),

            Schema\Str::make('startMode')
                ->writable()
                ->in(Tour::startModes()),

            Schema\Str::make('route')
                ->writable()
                ->nullable()
                ->maxLength(100)
                ->set(fn (Tour $tour, ?string $value) => $tour->route = trim((string) $value) ?: null),

            Schema\Str::make('devices')
                ->writable()
                ->in(Tour::deviceOptions()),

            Schema\Integer::make('maxAccountAgeDays')
                ->writable()
                ->nullable()
                ->min(1)
                ->max(3650)
                ->visible($admin),

            Schema\Integer::make('position')
                ->visible($admin),

            Schema\Relationship\ToMany::make('groups')
                ->type('groups')
                ->writable()
                ->includable()
                ->visible($admin),

            Schema\Relationship\ToMany::make('steps')
                ->type('tour-guide-steps')
                ->includable()
                ->visible($admin),

            Schema\Relationship\ToMany::make('enabledSteps')
                ->type('tour-guide-steps')
                ->includable(),

            Schema\Relationship\ToOne::make('completion')
                ->type('tour-guide-completions')
                ->includable(),
        ];
    }

    public function sorts(): array
    {
        return [
            SortColumn::make('position'),
        ];
    }

    public function creating(object $model, BaseContext $context): ?object
    {
        $model->position = Tour::nextPosition(Tour::query());

        return $model;
    }

    /**
     * @return array<int>
     */
    protected function order(Context $context): array
    {
        $body = $this->validator->make((array) $context->body(), [
            'order' => ['present', 'array'],
            'order.*' => ['integer'],
        ])->validate();

        return array_map('intval', $body['order']);
    }

    protected function duplicate(Tour $original, Context $context): Tour
    {
        $document = $this->transfer->export($original);
        $document['tour']['title'] = $this->translator->trans('datlechin-simple-tour-guide.admin.tours.copy_title', ['title' => $original->title]);

        $copy = $this->transfer->import($document, $context->getActor());
        $copy->groups()->sync($original->groups()->pluck('groups.id'));

        return $copy;
    }

    /**
     * @return array<string, mixed>
     */
    protected function stats(Tour $tour): array
    {
        $counts = TourCompletion::query()
            ->where('tour_id', $tour->id)
            ->selectRaw('outcome, count(*) as total')
            ->groupBy('outcome')
            ->pluck('total', 'outcome');

        // Only dismissals: everybody who finished was last on the final step, which is not a drop-off.
        $abandoned = TourCompletion::query()
            ->where('tour_id', $tour->id)
            ->where('outcome', TourCompletion::OUTCOME_DISMISSED)
            ->whereNotNull('last_step_id')
            ->selectRaw('last_step_id, count(*) as total')
            ->groupBy('last_step_id')
            ->pluck('total', 'last_step_id');

        $finished = (int) $counts->get(TourCompletion::OUTCOME_FINISHED, 0);
        $dismissed = (int) $counts->get(TourCompletion::OUTCOME_DISMISSED, 0);

        return [
            'finished' => $finished,
            'dismissed' => $dismissed,
            'total' => $finished + $dismissed,
            'steps' => $tour->steps->map(fn (TourStep $step) => [
                'id' => $step->id,
                'title' => $step->title,
                'abandoned' => (int) $abandoned->get($step->id, 0),
            ])->all(),
        ];
    }
}
