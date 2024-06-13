<?php

namespace Datlechin\FlarumSimpleTourGuide;

use Flarum\Database\AbstractModel;

/**
 * @property string $title
 * @property string $description
 * @property string $target
 * @property bool $is_trigger_click
 */
class TourGuideStep extends AbstractModel
{
    protected $table = 'tour_guide_steps';

    protected $fillable = [
        'title',
        'description',
        'target',
        'is_trigger_click',
    ];

    protected $casts = [
        'is_trigger_click' => 'bool',
    ];
}
