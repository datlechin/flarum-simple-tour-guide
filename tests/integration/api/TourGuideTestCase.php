<?php

/*
 * This file is part of datlechin/flarum-simple-tour-guide.
 *
 * Copyright (c) 2023 Ngo Quoc Dat.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Datlechin\FlarumSimpleTourGuide\Tests\Integration\Api;

use Carbon\Carbon;
use Flarum\Group\Group;
use Flarum\Testing\integration\RetrievesAuthorizedUsers;
use Flarum\Testing\integration\TestCase;
use Flarum\User\User;
use Psr\Http\Message\ResponseInterface;

/**
 * The forum every tour guide test starts from: an admin, a member, one tour on
 * the index and three steps in it.
 */
abstract class TourGuideTestCase extends TestCase
{
    use RetrievesAuthorizedUsers;

    protected const ADMIN = 1;
    protected const MEMBER = 2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->extension('datlechin-simple-tour-guide');

        $this->prepareDatabase([
            User::class => [
                // A real account always has one, and an age-limited tour has
                // to decide something about an account that does not.
                array_merge($this->normalUser(), ['joined_at' => Carbon::now()]),
            ],
            'tour_guide_tours' => [
                $this->tour(),
            ],
            'tour_guide_steps' => [
                $this->step(1, 'Welcome', null, ['position' => 0]),
                $this->step(2, 'The header', '#header-primary', ['position' => 1, 'devices' => 'desktop']),
                $this->step(3, 'Home', '#home-link', ['position' => 2]),
            ],
        ]);
    }

    protected function tour(array $overrides = []): array
    {
        return $overrides + [
            'id' => 1,
            'key' => 'welcome',
            'title' => 'Welcome tour',
            'is_enabled' => 1,
            'start_mode' => 'auto',
            'route' => 'index',
            'devices' => 'any',
            'group_ids' => null,
            'max_account_age_days' => null,
            'position' => 0,
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ];
    }

    protected function step(int $id, string $title, ?string $target, array $overrides = []): array
    {
        return $overrides + [
            'id' => $id,
            'tour_id' => 1,
            'title' => $title,
            'description' => "Body of $title.",
            'target' => $target,
            'placement' => 'auto',
            'devices' => 'any',
            'is_enabled' => 1,
            'clicks_target' => 0,
            'advance_on_click' => 0,
            'position' => 0,
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ];
    }

    protected function json(ResponseInterface $response): array
    {
        return json_decode((string) $response->getBody(), true) ?? [];
    }

    /**
     * The tours the forum would offer this member, keyed so a test can name the
     * one it means.
     *
     * @return array<string, array<string, mixed>>
     */
    protected function availableTo(?int $userId, array $query = []): array
    {
        $response = $this->send(
            $this->request('GET', '/api/tour-guide/available', $userId ? ['authenticatedAs' => $userId] : [])
                ->withQueryParams($query)
        );

        $this->assertEquals(200, $response->getStatusCode(), 'available tours should be readable');

        return collect($this->json($response)['tours'] ?? [])->keyBy('key')->all();
    }

    protected function memberOfNoGroups(): array
    {
        return [
            'id' => 3,
            'username' => 'grouplessuser',
            'email' => 'groupless@machine.local',
            'is_email_confirmed' => 1,
            'password' => '$2y$10$LO59tiT7uggl6Oe23o/O6.utnF6ipngYjvMvaxo1TciKqBttDNKim',
            'joined_at' => Carbon::now(),
        ];
    }

    protected function groupAssignment(int $userId, string $groupId): array
    {
        return ['user_id' => $userId, 'group_id' => $groupId];
    }

    protected function membersGroupId(): string
    {
        return Group::MEMBER_ID;
    }
}
