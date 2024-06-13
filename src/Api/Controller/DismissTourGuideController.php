<?php

namespace Datlechin\FlarumSimpleTourGuide\Api\Controller;

use Carbon\Carbon;
use Flarum\Http\RequestUtil;
use Laminas\Diactoros\Response\EmptyResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

class DismissTourGuideController implements RequestHandlerInterface
{
    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);

        if (! $actor->exists) {
            return new EmptyResponse(403);
        }

        $actor->forceFill([
            'tour_guide_dismissed_at' => Carbon::now(),
        ])->save();

        return new EmptyResponse(204);
    }
}
