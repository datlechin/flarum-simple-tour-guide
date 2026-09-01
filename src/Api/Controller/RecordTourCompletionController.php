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

use Carbon\Carbon;
use Datlechin\FlarumSimpleTourGuide\Tour;
use Datlechin\FlarumSimpleTourGuide\TourCompletion;
use Datlechin\FlarumSimpleTourGuide\TourStep;
use Flarum\Http\RequestUtil;
use Illuminate\Support\Arr;
use Laminas\Diactoros\Response\EmptyResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Records that the member has been through a tour, and where they stopped.
 */
class RecordTourCompletionController implements RequestHandlerInterface
{
    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertRegistered();

        $body = (array) $request->getParsedBody();

        $tour = Tour::query()->where('key', Arr::get($body, 'tourKey'))->first();

        if ($tour === null) {
            return new EmptyResponse(404);
        }

        $outcome = Arr::get($body, 'outcome');

        if (! in_array($outcome, TourCompletion::outcomes(), true)) {
            return new EmptyResponse(422);
        }

        // A step id from a different tour would make the drop-off figures lie,
        // so it is checked rather than trusted.
        $lastStepId = Arr::get($body, 'lastStepId');
        $lastStepId = $lastStepId === null ? null : TourStep::query()
            ->where('tour_id', $tour->id)
            ->whereKey($lastStepId)
            ->value('id');

        TourCompletion::query()->updateOrCreate(
            ['user_id' => $actor->id, 'tour_id' => $tour->id],
            [
                'outcome' => $outcome,
                'last_step_id' => $lastStepId,
                'completed_at' => Carbon::now(),
            ]
        );

        return new EmptyResponse(204);
    }
}
