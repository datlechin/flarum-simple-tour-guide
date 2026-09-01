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
use Flarum\Locale\TranslatorInterface;
use Illuminate\Support\Arr;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Copies a tour, its steps and their translations.
 *
 * Goes through the same document an export and import would, so a copy and a
 * round trip through a file can never drift apart.
 */
class DuplicateTourController implements RequestHandlerInterface
{
    public function __construct(
        protected TourTransfer $transfer,
        protected TranslatorInterface $translator,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        RequestUtil::getActor($request)->assertAdmin();

        $original = Tour::query()->findOrFail(Arr::get($request->getQueryParams(), 'id'));

        $document = $this->transfer->export($original);
        $document['tour']['title'] = $this->translator->trans(
            'datlechin-simple-tour-guide.admin.tours.copy_title',
            ['title' => $original->title]
        );

        $copy = $this->transfer->import($document);

        return new JsonResponse(['id' => (int) $copy->id, 'key' => $copy->key], 201);
    }
}
