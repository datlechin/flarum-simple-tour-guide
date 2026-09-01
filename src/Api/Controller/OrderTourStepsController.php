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
use Flarum\Http\RequestUtil;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Support\Arr;
use Laminas\Diactoros\Response\EmptyResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Rewrites the order of one tour's steps from a list of ids.
 */
class OrderTourStepsController implements RequestHandlerInterface
{
    public function __construct(
        protected ConnectionInterface $connection,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        RequestUtil::getActor($request)->assertAdmin();

        $tourId = Arr::get($request->getQueryParams(), 'id');
        $order = Arr::get($request->getParsedBody(), 'order');

        if (! is_array($order) || $order !== array_filter($order, 'is_numeric')) {
            return new EmptyResponse(422);
        }

        // Scoped to the tour in the path, so a stray id cannot reach into
        // another tour and renumber it.
        $this->connection->transaction(function () use ($order, $tourId): void {
            foreach (array_values($order) as $position => $id) {
                TourStep::query()
                    ->where('tour_id', $tourId)
                    ->whereKey($id)
                    ->update(['position' => $position]);
            }

            // Anything the payload left out keeps a number that may now clash
            // with one it just handed out. Numbering the tail after them keeps
            // the order total.
            $tail = TourStep::query()
                ->where('tour_id', $tourId)
                ->whereNotIn('id', $order)
                ->orderBy('position')
                ->orderBy('id')
                ->pluck('id');

            foreach ($tail as $offset => $id) {
                TourStep::query()->whereKey($id)->update(['position' => count($order) + $offset]);
            }
        });

        return new EmptyResponse(204);
    }
}
