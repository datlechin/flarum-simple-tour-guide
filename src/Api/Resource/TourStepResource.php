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
use Datlechin\FlarumSimpleTourGuide\TourStep;
use Flarum\Api\Context;
use Flarum\Api\Endpoint;
use Flarum\Api\Resource\AbstractDatabaseResource;
use Flarum\Api\Schema;
use Flarum\Locale\TranslatorInterface;
use Flarum\User\User;
use Tobyz\JsonApiServer\Context as BaseContext;

/**
 * @extends AbstractDatabaseResource<TourStep>
 */
class TourStepResource extends AbstractDatabaseResource
{
    public function __construct(
        protected TranslatorInterface $translator,
    ) {
    }

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
            Endpoint\Show::make()->admin(),
            Endpoint\Create::make()->admin(),
            Endpoint\Update::make()->admin(),
            Endpoint\Delete::make()->admin(),
            Endpoint\Create::make('duplicate')
                ->route('POST', '/{id}/duplicate')
                ->admin()
                ->action(fn (Context $context) => $this->duplicate($context->model)),
        ];
    }

    public function fields(): array
    {
        $admin = fn (TourStep $step, Context $context) => $context->getActor()->isAdmin();

        return [
            Schema\Str::make('title')
                ->requiredOnCreate()
                ->writable()
                ->rule('filled')
                ->maxLength(255)
                ->visible($admin)
                ->set(fn (TourStep $step, string $value) => $step->title = trim($value)),

            Schema\Str::make('description')
                ->property('content')
                ->requiredOnCreate()
                ->writable()
                ->rule('filled')
                ->maxLength(2000)
                ->visible($admin)
                ->set(fn (TourStep $step, string $value, Context $context) => $step->setContentAttribute(trim($value), $context->getActor())),

            Schema\Str::make('localizedTitle')
                ->get(fn (TourStep $step) => $step->translationFor($this->translator->getLocale())?->title ?: $step->title),

            Schema\Str::make('descriptionHtml')
                ->get(function (TourStep $step, Context $context) {
                    $translation = $step->translationFor($this->translator->getLocale());

                    return ($translation?->parsed_content ? $translation : $step)->formatContent($context->request);
                }),

            Schema\Str::make('target')
                ->writable()
                ->nullable()
                ->maxLength(255)
                ->regex('/^[^\r\n]*$/')
                ->set(fn (TourStep $step, ?string $value) => $step->target = trim((string) $value) ?: null),

            Schema\Str::make('placement')
                ->writable()
                ->in(TourStep::placements()),

            Schema\Str::make('devices')
                ->writable()
                ->in(Tour::deviceOptions()),

            Schema\Boolean::make('clicksTarget')
                ->writable(),

            Schema\Boolean::make('advanceOnClick')
                ->writable(),

            Schema\Boolean::make('isEnabled')
                ->writable()
                ->visible($admin),

            Schema\Integer::make('position')
                ->visible($admin),

            Schema\Arr::make('translations')
                ->writable()
                ->visible($admin)
                ->get(fn (TourStep $step) => $step->translationMap())
                ->save(fn (TourStep $step, mixed $value, Context $context) => $this->syncTranslations($step, (array) $value, $context->getActor())),

            Schema\Relationship\ToOne::make('tour')
                ->type('tour-guide-tours')
                ->writableOnCreate()
                ->requiredOnCreate()
                ->includable(),
        ];
    }

    public function creating(object $model, BaseContext $context): ?object
    {
        $model->position = TourStep::nextPosition(TourStep::query()->where('tour_id', $model->tour_id));

        return $model;
    }

    protected function duplicate(TourStep $original): TourStep
    {
        return $original->getConnection()->transaction(function () use ($original) {
            $copy = $original->replicate(['created_at', 'updated_at']);
            $copy->title = $this->translator->trans('datlechin-simple-tour-guide.admin.steps.copy_title', ['title' => $original->title]);
            $copy->position = TourStep::nextPosition(TourStep::query()->where('tour_id', $original->tour_id));
            $copy->save();

            foreach ($original->translations as $translation) {
                $copy->translations()->save($translation->replicate(['step_id', 'created_at', 'updated_at']));
            }

            return $copy;
        });
    }

    /**
     * @param array<mixed> $translations
     */
    protected function syncTranslations(TourStep $step, array $translations, User $actor): void
    {
        $kept = [];

        foreach ($translations as $locale => $content) {
            if (! is_string($locale) || ! is_array($content)) {
                continue;
            }

            $title = trim((string) ($content['title'] ?? ''));
            $description = trim((string) ($content['description'] ?? ''));

            // A language cleared of both fields no longer overrides anything.
            if ($title === '' && $description === '') {
                continue;
            }

            $step->saveTranslation($locale, $title, $description, $actor);

            $kept[] = $locale;
        }

        $step->translations()->whereNotIn('locale', $kept)->delete();
        $step->unsetRelation('translations');
    }
}
