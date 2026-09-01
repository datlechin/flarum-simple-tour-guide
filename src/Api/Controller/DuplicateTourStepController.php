<?php

/*
 * This file is part of datlechin/flarum-simple-tour-guide.
 *
 * Copyright (c) 2023 Ngo Quoc Dat.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Datlechin\FlarumSimpleTourGuide\Api\Controller;

use Datlechin\FlarumSimpleTourGuide\TourStep;
use Datlechin\FlarumSimpleTourGuide\TourStepTranslation;
use Flarum\Http\RequestUtil;
use Flarum\Locale\TranslatorInterface;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Support\Arr;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Copies a step, with its translations, to the end of the same tour.
 *
 * Most steps in a tour are a near copy of the one before: same placement, same
 * device, a different element.
 */
class DuplicateTourStepController implements RequestHandlerInterface
{
    public function __construct(
        protected ConnectionInterface $connection,
        protected TranslatorInterface $translator,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        RequestUtil::getActor($request)->assertAdmin();

        $original = TourStep::query()
            ->with('translations')
            ->findOrFail(Arr::get($request->getQueryParams(), 'id'));

        $copy = $this->connection->transaction(function () use ($original) {
            $copy = $original->replicate(['created_at', 'updated_at']);
            $copy->title = $this->translator->trans(
                'datlechin-simple-tour-guide.admin.steps.copy_title',
                ['title' => $original->title]
            );
            $copy->position = ((int) TourStep::query()->where('tour_id', $original->tour_id)->max('position')) + 1;
            $copy->save();

            foreach ($original->translations as $translation) {
                TourStepTranslation::query()->create([
                    'step_id' => $copy->id,
                    'locale' => $translation->locale,
                    'title' => $translation->title,
                    'description' => $translation->description,
                ]);
            }

            return $copy;
        });

        return new JsonResponse(['id' => (int) $copy->id], 201);
    }
}
