<?php

namespace Datlechin\FlarumSimpleTourGuide\Api\Controller;

use Datlechin\FlarumSimpleTourGuide\Command\DeleteTourGuideStep;
use Flarum\Api\Controller\AbstractDeleteController;
use Illuminate\Contracts\Bus\Dispatcher;
use Flarum\Http\RequestUtil;
use Illuminate\Support\Arr;
use Psr\Http\Message\ServerRequestInterface;

class DeleteTourGuideStepController extends AbstractDeleteController
{
    public function __construct(protected Dispatcher $bus)
    {
    }

    protected function delete(ServerRequestInterface $request)
    {
        $this->bus->dispatch(
            new DeleteTourGuideStep(Arr::get($request->getQueryParams(), 'id'), RequestUtil::getActor($request)),
        );
    }
}
