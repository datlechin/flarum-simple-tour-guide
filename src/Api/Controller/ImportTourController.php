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
use Flarum\Http\RequestUtil;
use InvalidArgumentException;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

class ImportTourController implements RequestHandlerInterface
{
    public function __construct(
        protected TourTransfer $transfer,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        RequestUtil::getActor($request)->assertAdmin();

        try {
            $tour = $this->transfer->import((array) $request->getParsedBody());
        } catch (InvalidArgumentException $e) {
            return new JsonResponse(['error' => $e->getMessage()], 422);
        }

        return new JsonResponse(['key' => $tour->key, 'id' => (int) $tour->id], 201);
    }
}
