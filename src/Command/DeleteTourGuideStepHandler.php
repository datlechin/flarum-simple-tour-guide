<?php

namespace Datlechin\FlarumSimpleTourGuide\Command;

use Datlechin\FlarumSimpleTourGuide\TourGuideStep;
use Illuminate\Contracts\Events\Dispatcher;

class DeleteTourGuideStepHandler
{
    public function __construct(protected Dispatcher $events)
    {
    }

    public function handle(DeleteTourGuideStep $command)
    {
        $tourGuideStep = TourGuideStep::query()->findOrFail($command->id);

        $tourGuideStep->delete();

        return $tourGuideStep;
    }
}
