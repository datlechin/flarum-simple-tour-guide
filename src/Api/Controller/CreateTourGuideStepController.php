<?php

namespace Datlechin\FlarumSimpleTourGuide\Api\Controller;

use Datlechin\FlarumSimpleTourGuide\Api\Serializer\TourGuideStepSerializer;
use Datlechin\FlarumSimpleTourGuide\Command\CreateTourGuideStep;
use Flarum\Api\Controller\AbstractCreateController;
use Illuminate\Contracts\Bus\Dispatcher;
use Flarum\Http\RequestUtil;
use Illuminate\Support\Arr;
use Psr\Http\Message\ServerRequestInterface;
use Tobscure\JsonApi\Document;

class CreateTourGuideStepController extends AbstractCreateController
{
    public $serializer = TourGuideStepSerializer::class;

    public function __construct(protected Dispatcher $bus)
    {
    }

    protected function data(ServerRequestInterface $request, Document $document)
    {
        return $this->bus->dispatch(
            new CreateTourGuideStep(RequestUtil::getActor($request), Arr::get($request->getParsedBody(), 'data', [])),
        );
    }
}
