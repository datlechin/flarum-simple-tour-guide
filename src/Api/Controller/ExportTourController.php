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

use Datlechin\FlarumSimpleTourGuide\Api\TourTransfer;
use Datlechin\FlarumSimpleTourGuide\Tour;
use Flarum\Http\RequestUtil;
use Illuminate\Support\Arr;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

class ExportTourController implements RequestHandlerInterface
{
    public function __construct(
        protected TourTransfer $transfer,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        RequestUtil::getActor($request)->assertAdmin();

        $tour = Tour::query()->findOrFail(Arr::get($request->getQueryParams(), 'id'));

        return new JsonResponse($this->transfer->export($tour));
    }
}
