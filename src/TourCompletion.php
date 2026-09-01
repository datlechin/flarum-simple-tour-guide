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
use Flarum\User\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A record that somebody has been through a tour, and where they stopped.
 *
 * @property int $id
 * @property int $user_id
 * @property int $tour_id
 * @property string $outcome
 * @property int|null $last_step_id
 * @property Carbon $completed_at
 * @property-read User $user
 * @property-read Tour $tour
 *
 * @method static Builder<static> query()
 */
class TourCompletion extends AbstractModel
{
    public const OUTCOME_FINISHED = 'finished';
    public const OUTCOME_DISMISSED = 'dismissed';

    protected $table = 'tour_guide_completions';

    protected $fillable = ['user_id', 'tour_id', 'outcome', 'last_step_id', 'completed_at'];

    public $timestamps = false;

    protected $casts = [
        'user_id' => 'int',
        'tour_id' => 'int',
        'last_step_id' => 'int',
        'completed_at' => 'datetime',
    ];

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * @return BelongsTo<Tour, $this>
     */
    public function tour(): BelongsTo
    {
        return $this->belongsTo(Tour::class, 'tour_id');
    }

    public static function outcomes(): array
    {
        return [self::OUTCOME_FINISHED, self::OUTCOME_DISMISSED];
    }
}
