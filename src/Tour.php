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
use Flarum\Database\ScopeVisibilityTrait;
use Flarum\Group\Group;
use Flarum\User\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @property int $id
 * @property string $key
 * @property string $title
 * @property bool $is_enabled
 * @property string $start_mode
 * @property string|null $route
 * @property string $devices
 * @property int|null $max_account_age_days
 * @property int $position
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Collection<int, TourStep> $steps
 * @property-read Collection<int, Group> $groups
 */
class Tour extends AbstractModel
{
    use Orderable;
    use ScopeVisibilityTrait;

    public const START_AUTO = 'auto';
    public const START_MANUAL = 'manual';

    public const DEVICES_ANY = 'any';
    public const DEVICES_DESKTOP = 'desktop';
    public const DEVICES_MOBILE = 'mobile';

    protected $table = 'tour_guide_tours';

    public $timestamps = true;

    protected $casts = [
        'is_enabled' => 'bool',
        'max_account_age_days' => 'int',
        'position' => 'int',
    ];

    /**
     * @return HasMany<TourStep, $this>
     */
    public function steps(): HasMany
    {
        return $this->hasMany(TourStep::class, 'tour_id')->orderBy('position')->orderBy('id');
    }

    /**
     * @return HasMany<TourStep, $this>
     */
    public function enabledSteps(): HasMany
    {
        return $this->steps()->where('is_enabled', true);
    }

    /**
     * @return BelongsToMany<Group, $this>
     */
    public function groups(): BelongsToMany
    {
        return $this->belongsToMany(Group::class, 'tour_guide_tour_group', 'tour_id', 'group_id');
    }

    /**
     * @return HasOne<TourCompletion, $this>
     */
    public function completion(): HasOne
    {
        return $this->hasOne(TourCompletion::class, 'tour_id');
    }

    /**
     * @param Builder<self> $query
     */
    public function scopeAvailableTo(Builder $query, User $actor): void
    {
        $query->where('is_enabled', true)
            ->whereHas('enabledSteps')
            ->where(fn (Builder $query) => $query
                ->whereDoesntHave('groups')
                ->orWhereHas('groups', fn (Builder $query) => $query->whereIn('groups.id', $actor->permissionGroupIds())))
            ->where(function (Builder $query) use ($actor) {
                $query->whereNull('max_account_age_days');

                if ($actor->joined_at) {
                    $query->orWhere('max_account_age_days', '>=', (int) ceil($actor->joined_at->diffInSeconds(Carbon::now()) / 86400));
                }
            });
    }

    // Not devices(): Eloquent reads a method named after a column as a relation once the column is missing.
    public static function deviceOptions(): array
    {
        return [self::DEVICES_ANY, self::DEVICES_DESKTOP, self::DEVICES_MOBILE];
    }

    public static function startModes(): array
    {
        return [self::START_AUTO, self::START_MANUAL];
    }
}
