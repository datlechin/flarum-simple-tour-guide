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

use Carbon\Carbon;
use Datlechin\FlarumSimpleTourGuide\TourCompletion;
use Datlechin\FlarumSimpleTourGuide\TourStep;
use Flarum\Api\Endpoint;
use Flarum\Api\Resource\AbstractDatabaseResource;
use Flarum\Api\Schema;
use Flarum\Foundation\ValidationException;
use Flarum\Locale\TranslatorInterface;
use Illuminate\Database\Eloquent\Builder;
use Tobyz\JsonApiServer\Context;

/**
 * @extends AbstractDatabaseResource<TourCompletion>
 */
class TourCompletionResource extends AbstractDatabaseResource
{
    public function __construct(
        protected TranslatorInterface $translator,
    ) {
    }

    public function type(): string
    {
        return 'tour-guide-completions';
    }

    public function model(): string
    {
        return TourCompletion::class;
    }

    /**
     * @param Builder<TourCompletion> $query
     */
    public function scope(Builder $query, Context $context): void
    {
        $query->where('user_id', $context->getActor()->id);
    }

    public function endpoints(): array
    {
        return [
            Endpoint\Create::make()->authenticated(),
        ];
    }

    public function fields(): array
    {
        return [
            Schema\Str::make('outcome')
                ->requiredOnCreate()
                ->writableOnCreate()
                ->in(TourCompletion::outcomes()),

            Schema\Relationship\ToOne::make('tour')
                ->type('tour-guide-tours')
                ->requiredOnCreate()
                ->writableOnCreate(),

            Schema\Relationship\ToOne::make('lastStep')
                ->type('tour-guide-steps')
                ->nullable()
                ->writableOnCreate(),
        ];
    }

    // One record per member and tour: taking a tour again replaces how it ended last time.
    public function creating(object $model, Context $context): ?object
    {
        if ($model->last_step_id && TourStep::query()->whereKey($model->last_step_id)->value('tour_id') !== $model->tour_id) {
            throw new ValidationException([], [
                'lastStep' => $this->translator->trans('datlechin-simple-tour-guide.api.step_not_in_tour'),
            ]);
        }

        $completion = TourCompletion::query()
            ->where('user_id', $context->getActor()->id)
            ->where('tour_id', $model->tour_id)
            ->first() ?? $model;

        $completion->user_id = $context->getActor()->id;
        $completion->outcome = $model->outcome;
        $completion->last_step_id = $model->last_step_id;
        $completion->completed_at = Carbon::now();

        return $completion;
    }
}
