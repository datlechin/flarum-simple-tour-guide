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
use Flarum\Http\RequestUtil;
use Flarum\User\User;
use Illuminate\Support\Arr;
use Laminas\Diactoros\Response\EmptyResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Forgets that somebody has taken a tour, so they are offered it again.
 *
 * With no `tourKey` it forgets all of them, which is what the reset control on
 * a profile does.
 */
class ResetTourCompletionsController implements RequestHandlerInterface
{
    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);

        $body = (array) $request->getParsedBody();

        $user = User::query()->findOrFail(Arr::get($body, 'userId'));

        $actor->assertCan('resetTourGuide', $user);

        $query = TourCompletion::query()->where('user_id', $user->id);

        if ($tourKey = Arr::get($body, 'tourKey')) {
            $tourId = Tour::query()->where('key', $tourKey)->value('id');

            if ($tourId === null) {
                return new EmptyResponse(404);
            }

            $query->where('tour_id', $tourId);
        }

        $query->delete();

        return new EmptyResponse(204);
    }
}
