<?php

namespace Datlechin\FlarumSimpleTourGuide;

use Flarum\Database\AbstractModel;

class TourGuideStep extends AbstractModel
{
    protected $table = 'tour_guide_steps';

    protected $fillable = [
        'title',
        'description',
        'target',
    ];
}
