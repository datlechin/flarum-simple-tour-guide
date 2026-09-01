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
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A named sequence of steps, with the rules for who sees it and where.
 *
 * @property int $id
 * @property string $key
 * @property string $title
 * @property bool $is_enabled
 * @property string $start_mode
 * @property string|null $route
 * @property string $devices
 * @property int[]|null $group_ids
 * @property int|null $max_account_age_days
 * @property int $position
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, TourStep> $steps
 * @property-read \Illuminate\Database\Eloquent\Collection<int, TourCompletion> $completions
 *
 * @method static Builder<static> query()
 */
class Tour extends AbstractModel
{
    public const START_AUTO = 'auto';
    public const START_MANUAL = 'manual';

    public const DEVICES_ANY = 'any';
    public const DEVICES_DESKTOP = 'desktop';
    public const DEVICES_MOBILE = 'mobile';

    protected $table = 'tour_guide_tours';

    public $timestamps = true;

    /**
     * Mirrors the column defaults, so a freshly made tour describes itself
     * fully without having to be read back from the database first.
     */
    protected $attributes = [
        'is_enabled' => true,
        'start_mode' => self::START_AUTO,
        'devices' => self::DEVICES_ANY,
        'position' => 0,
    ];

    protected $casts = [
        'is_enabled' => 'bool',
        'group_ids' => 'array',
        'max_account_age_days' => 'int',
        'position' => 'int',
    ];

    /**
     * @return HasMany<TourStep, $this>
     */
    public function steps(): HasMany
    {
        return $this->hasMany(TourStep::class, 'tour_id');
    }

    /**
     * @return HasMany<TourCompletion, $this>
     */
    public function completions(): HasMany
    {
        return $this->hasMany(TourCompletion::class, 'tour_id');
    }

    /**
     * Whether this tour is meant for the given member.
     *
     * Says nothing about where they are or what they are holding: route and
     * device are decided in the browser, which is the only place that knows.
     *
     * `$actorGroupIds` lets a caller checking many tours read the actor's
     * groups once instead of once per tour.
     */
    public function isFor(User $user, ?array $actorGroupIds = null): bool
    {
        if (! $this->is_enabled || ! $user->exists) {
            return false;
        }

        $wanted = $this->group_ids;

        if (! empty($wanted)) {
            $actorGroupIds ??= $user->groups->pluck('id')->all();

            if (empty(array_intersect($wanted, $actorGroupIds))) {
                return false;
            }
        }

        if ($this->max_account_age_days !== null) {
            $joined = $user->joined_at;

            if ($joined === null || $joined->lt(Carbon::now()->subDays($this->max_account_age_days))) {
                return false;
            }
        }

        return true;
    }

    /**
     * Not `devices()`: Eloquent treats a method named after a column as a
     * relation as soon as that column is missing from the loaded attributes,
     * which is exactly what happens to a row that took the column's default.
     */
    public static function deviceOptions(): array
    {
        return [self::DEVICES_ANY, self::DEVICES_DESKTOP, self::DEVICES_MOBILE];
    }

    public static function startModes(): array
    {
        return [self::START_AUTO, self::START_MANUAL];
    }
}
