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

use Datlechin\FlarumSimpleTourGuide\Api\TourPayload;
use Flarum\Http\RequestUtil;
use Illuminate\Support\Arr;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * The tours this member could be shown, with the wording already in their
 * language.
 */
class ShowAvailableToursController implements RequestHandlerInterface
{
    public function __construct(
        protected TourPayload $payload,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertRegistered();

        $preview = Arr::get($request->getQueryParams(), 'preview');

        return new JsonResponse([
            'tours' => $this->payload->forActor($actor, is_string($preview) ? $preview : null),
        ]);
    }
}
