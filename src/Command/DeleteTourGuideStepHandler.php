<?php

namespace Datlechin\FlarumSimpleTourGuide\Command;

use Datlechin\FlarumSimpleTourGuide\TourGuideStep;
use Illuminate\Contracts\Events\Dispatcher;

class DeleteTourGuideStepHandler
{
    protected $events;

    public function __construct(Dispatcher $events)
    {
        $this->events = $events;
    }

    public function handle(DeleteTourGuideStep $command)
    {
        $tourGuideStep = TourGuideStep::query()->findOrFail($command->id);

        $tourGuideStep->delete();

        return $tourGuideStep;
    }
}
