<?php

namespace Datlechin\FlarumSimpleTourGuide\Api\Controller;

use Datlechin\FlarumSimpleTourGuide\Api\Serializer\TourGuideStepSerializer;
use Datlechin\FlarumSimpleTourGuide\Command\EditTourGuideStep;
use Flarum\Api\Controller\AbstractShowController;
use Illuminate\Contracts\Bus\Dispatcher;
use Flarum\Http\RequestUtil;
use Illuminate\Support\Arr;
use Psr\Http\Message\ServerRequestInterface;
use Tobscure\JsonApi\Document;

class UpdateTourGuideStepController extends AbstractShowController
{
    public $serializer = TourGuideStepSerializer::class;

    public function __construct(protected Dispatcher $bus)
    {
    }

    protected function data(ServerRequestInterface $request, Document $document)
    {
        $id = Arr::get($request->getQueryParams(), 'id');
        $actor = RequestUtil::getActor($request);
        $data = Arr::get($request->getParsedBody(), 'data', []);

        return $this->bus->dispatch(new EditTourGuideStep($id, $actor, $data));
    }
}
