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
use Flarum\Http\RequestUtil;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Support\Arr;
use Laminas\Diactoros\Response\EmptyResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Rewrites the order of the tours from a list of ids.
 *
 * The order decides which auto tour goes first when a member is eligible for
 * more than one on the same page.
 */
class OrderToursController implements RequestHandlerInterface
{
    public function __construct(
        protected ConnectionInterface $connection,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        RequestUtil::getActor($request)->assertAdmin();

        $order = Arr::get($request->getParsedBody(), 'order');

        if (! is_array($order) || $order !== array_filter($order, 'is_numeric')) {
            return new EmptyResponse(422);
        }

        // All of it or none of it: a half-applied order is an order nobody chose.
        $this->connection->transaction(function () use ($order): void {
            foreach (array_values($order) as $position => $id) {
                Tour::query()->whereKey($id)->update(['position' => $position]);
            }
        });

        return new EmptyResponse(204);
    }
}
