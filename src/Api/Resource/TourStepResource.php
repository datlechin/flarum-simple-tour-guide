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
use Tobyz\JsonApiServer\Context;

/**
 * Editing steps, which only admins do.
 *
 * @extends AbstractDatabaseResource<TourStep>
 */
class TourStepResource extends AbstractDatabaseResource
{
    public function type(): string
    {
        return 'tour-guide-steps';
    }

    public function model(): string
    {
        return TourStep::class;
    }

    public function endpoints(): array
    {
        return [
            Endpoint\Index::make()->admin()->defaultSort('position'),
            Endpoint\Show::make()->admin(),
            Endpoint\Create::make()->admin(),
            Endpoint\Update::make()->admin(),
            Endpoint\Delete::make()->admin(),
        ];
    }

    public function fields(): array
    {
        return [
            Schema\Str::make('title')
                ->requiredOnCreate()
                ->writable()
                ->maxLength(255)
                ->set(fn (TourStep $step, string $value) => $step->title = trim($value)),

            Schema\Str::make('description')
                ->requiredOnCreate()
                ->writable()
                ->maxLength(2000)
                ->set(fn (TourStep $step, string $value) => $step->description = trim($value)),

            // A CSS selector for the element this step points at. Leave it
            // empty and the step is shown on its own in the middle of the
            // screen, which is what a welcome or a sign-off wants.
            Schema\Str::make('target')
                ->writable()
                ->nullable()
                ->maxLength(255)
                ->regex('/^[^\r\n]*$/')
                ->set(fn (TourStep $step, ?string $value) => $step->target = ($value === null || trim($value) === '') ? null : trim($value)),

            Schema\Str::make('placement')
                ->writable()
                ->in(TourStep::placements()),

            Schema\Str::make('devices')
                ->writable()
                ->in(Tour::deviceOptions()),

            Schema\Boolean::make('isEnabled')->writable(),

            // Clicks the highlighted element on the way to the next step, so a
            // tour can open a dropdown and then point inside it.
            Schema\Boolean::make('clicksTarget')->writable(),

            // Waits for the member to click the highlighted element rather
            // than offering a Next button.
            Schema\Boolean::make('advanceOnClick')->writable(),

            // Ordering is decided for the tour as a whole, by the order
            // endpoint, so a single step cannot rewrite it on its own.
            Schema\Integer::make('position'),

            // Wording per locale, as `{"vi": {"title": ..., "description": ...}}`.
            // One attribute rather than a resource of its own: the admin edits
            // every language of a step in one form and saves it once.
            Schema\Arr::make('translations')
                ->writable()
                ->get(fn (TourStep $step) => $step->translations
                    ->mapWithKeys(fn (TourStepTranslation $t) => [
                        $t->locale => ['title' => $t->title, 'description' => $t->description],
                    ])
                    ->all())
                ->save(fn (TourStep $step, mixed $value) => $this->syncTranslations($step, (array) $value)),

            Schema\Relationship\ToOne::make('tour')
                ->type('tour-guide-tours')
                ->writable()
                ->requiredOnCreate()
                ->includable(),
        ];
    }

    public function sorts(): array
    {
        return [
            SortColumn::make('position'),
        ];
    }

    public function creating(object $model, Context $context): ?object
    {
        /** @var TourStep $model */
        $model->position = ((int) TourStep::query()->where('tour_id', $model->tour_id)->max('position')) + 1;

        return $model;
    }

    /**
     * Take the step's wording with it, and forget it as anybody's last step.
     *
     * Not left to the foreign keys, which SQLite does not enforce by default.
     */
    public function deleting(object $model, Context $context): void
    {
        /** @var TourStep $model */
        TourStepTranslation::query()->where('step_id', $model->id)->delete();
        TourCompletion::query()->where('last_step_id', $model->id)->update(['last_step_id' => null]);

        parent::deleting($model, $context);
    }

    /**
     * @param array<string, mixed> $translations
     */
    protected function syncTranslations(TourStep $step, array $translations): void
    {
        $keep = [];

        foreach ($translations as $locale => $content) {
            if (! is_string($locale) || ! is_array($content)) {
                continue;
            }

            $title = trim((string) ($content['title'] ?? ''));
            $description = trim((string) ($content['description'] ?? ''));

            // A language the admin cleared out is a language they no longer
            // want an override for, not an override that says nothing.
            if ($title === '' && $description === '') {
                continue;
            }

            TourStepTranslation::query()->updateOrCreate(
                ['step_id' => $step->id, 'locale' => $locale],
                ['title' => $title, 'description' => $description]
            );

            $keep[] = $locale;
        }

        TourStepTranslation::query()
            ->where('step_id', $step->id)
            ->whereNotIn('locale', $keep ?: [''])
            ->delete();

        $step->unsetRelation('translations');
    }
}
