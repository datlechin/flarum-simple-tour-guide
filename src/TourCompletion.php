<?php

/*
 * This file is part of datlechin/flarum-simple-tour-guide.
 *
 * Copyright (c) 2023 Ngo Quoc Dat.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Datlechin\FlarumSimpleTourGuide;

use Carbon\Carbon;
use Flarum\Database\AbstractModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $user_id
 * @property int $tour_id
 * @property string $outcome
 * @property int|null $last_step_id
 * @property Carbon $completed_at
 */
class TourCompletion extends AbstractModel
{
    public const OUTCOME_FINISHED = 'finished';
    public const OUTCOME_DISMISSED = 'dismissed';

    protected $table = 'tour_guide_completions';

    public $timestamps = false;

    protected $casts = [
        'user_id' => 'int',
        'tour_id' => 'int',
        'last_step_id' => 'int',
        'completed_at' => 'datetime',
    ];

    /**
     * @return BelongsTo<Tour, $this>
     */
    public function tour(): BelongsTo
    {
        return $this->belongsTo(Tour::class, 'tour_id');
    }

    /**
     * @return BelongsTo<TourStep, $this>
     */
    public function lastStep(): BelongsTo
    {
        return $this->belongsTo(TourStep::class, 'last_step_id');
    }

    public static function outcomes(): array
    {
        return [self::OUTCOME_FINISHED, self::OUTCOME_DISMISSED];
    }
}
