<?php

namespace Datlechin\FlarumSimpleTourGuide\Api\Controller;

use Datlechin\FlarumSimpleTourGuide\Api\Serializer\TourGuideStepSerializer;
use Datlechin\FlarumSimpleTourGuide\TourGuideStep;
use Flarum\Api\Controller\AbstractListController;
use Psr\Http\Message\ServerRequestInterface;
use Tobscure\JsonApi\Document;

class ListTourGuideStepController extends AbstractListController
{
    public $serializer = TourGuideStepSerializer::class;

    protected function data(ServerRequestInterface $request, Document $document)
    {
        return TourGuideStep::query()->latest()->get();
    }
}
