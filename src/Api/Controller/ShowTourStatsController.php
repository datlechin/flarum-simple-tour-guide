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

use Datlechin\FlarumSimpleTourGuide\Tour;
use Datlechin\FlarumSimpleTourGuide\TourCompletion;
use Datlechin\FlarumSimpleTourGuide\TourStep;
use Flarum\Http\RequestUtil;
use Illuminate\Support\Arr;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * How a tour is doing: how many finished it, and which step loses people.
 */
class ShowTourStatsController implements RequestHandlerInterface
{
    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        RequestUtil::getActor($request)->assertAdmin();

        $tour = Tour::query()->findOrFail(Arr::get($request->getQueryParams(), 'id'));

        $counts = TourCompletion::query()
            ->where('tour_id', $tour->id)
            ->selectRaw('outcome, count(*) as total')
            ->groupBy('outcome')
            ->pluck('total', 'outcome');

        $finished = (int) $counts->get(TourCompletion::OUTCOME_FINISHED, 0);
        $dismissed = (int) $counts->get(TourCompletion::OUTCOME_DISMISSED, 0);

        // Where the people who left early got to. Only dismissals: counting the
        // last step of everybody who finished would put a spike on the final
        // step and call it a drop-off.
        $abandonedAt = TourCompletion::query()
            ->where('tour_id', $tour->id)
            ->where('outcome', TourCompletion::OUTCOME_DISMISSED)
            ->whereNotNull('last_step_id')
            ->selectRaw('last_step_id, count(*) as total')
            ->groupBy('last_step_id')
            ->pluck('total', 'last_step_id');

        $steps = TourStep::query()
            ->where('tour_id', $tour->id)
            ->orderBy('position')
            ->orderBy('id')
            ->get()
            ->map(fn (TourStep $step) => [
                'id' => (int) $step->id,
                'title' => $step->title,
                'abandoned' => (int) $abandonedAt->get($step->id, 0),
            ])
            ->all();

        return new JsonResponse([
            'finished' => $finished,
            'dismissed' => $dismissed,
            'total' => $finished + $dismissed,
            'steps' => $steps,
        ]);
    }
}
