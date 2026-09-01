<?php

/*
 * This file is part of datlechin/flarum-simple-tour-guide.
 *
 * Copyright (c) 2023 Ngo Quoc Dat.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Datlechin\FlarumSimpleTourGuide\Tests\integration\api;

use Datlechin\FlarumSimpleTourGuide\TourCompletion;
use PHPUnit\Framework\Attributes\Test;

/**
 * Recording who has been through a tour, resetting it, and what that adds up
 * to on the admin's figures.
 */
class CompletionsTest extends TourGuideTestCase
{
    #[Test]
    public function member_records_their_own(): void
    {
        $response = $this->record(self::MEMBER, 'finished');

        $this->assertEquals(204, $response->getStatusCode());
        $this->assertTrue($this->availableTo(self::MEMBER)['welcome']['completed']);
    }

    #[Test]
    public function an_unknown_outcome_is_rejected(): void
    {
        $this->assertEquals(422, $this->record(self::MEMBER, 'nonsense')->getStatusCode());
    }

    #[Test]
    public function an_unknown_tour_is_rejected(): void
    {
        $response = $this->send($this->request('POST', '/api/tour-guide/completions', [
            'authenticatedAs' => self::MEMBER,
            'json' => ['tourKey' => 'no-such-tour', 'outcome' => 'finished'],
        ]));

        $this->assertEquals(404, $response->getStatusCode());
    }

    #[Test]
    public function a_step_from_another_tour_is_not_recorded(): void
    {
        $this->database()->table('tour_guide_tours')->insert($this->tour(['id' => 2, 'key' => 'other', 'position' => 1]));
        $this->database()->table('tour_guide_steps')->insert($this->step(9, 'Elsewhere', '#x', ['tour_id' => 2]));

        $this->record(self::MEMBER, 'dismissed', 9);

        // Trusting it would put a drop-off on a step this tour never had.
        $this->assertNull(TourCompletion::query()->where('user_id', self::MEMBER)->value('last_step_id'));
    }

    #[Test]
    public function guest_records_nothing(): void
    {
        $response = $this->send($this->request('POST', '/api/tour-guide/completions', [
            'json' => ['tourKey' => 'welcome', 'outcome' => 'finished'],
        ]));

        // A guest POST is turned away by CSRF before it ever reaches the
        // controller, so the status says 400 rather than 401. Either way the
        // guarantee worth asserting is that nothing was written.
        $this->assertGreaterThanOrEqual(400, $response->getStatusCode());
        $this->assertEquals(0, TourCompletion::query()->count());
    }

    #[Test]
    public function member_may_reset_their_own(): void
    {
        $this->record(self::MEMBER, 'finished');

        $response = $this->send($this->request('POST', '/api/tour-guide/completions/reset', [
            'authenticatedAs' => self::MEMBER,
            'json' => ['userId' => self::MEMBER],
        ]));

        $this->assertEquals(204, $response->getStatusCode());
        $this->assertEquals(0, TourCompletion::query()->where('user_id', self::MEMBER)->count());
    }

    #[Test]
    public function member_may_not_reset_somebody_else(): void
    {
        $this->record(self::ADMIN, 'finished');

        $response = $this->send($this->request('POST', '/api/tour-guide/completions/reset', [
            'authenticatedAs' => self::MEMBER,
            'json' => ['userId' => self::ADMIN],
        ]));

        $this->assertContains($response->getStatusCode(), [401, 403]);
        $this->assertEquals(1, TourCompletion::query()->where('user_id', self::ADMIN)->count());
    }

    #[Test]
    public function admin_may_reset_a_member(): void
    {
        $this->record(self::MEMBER, 'finished');

        $response = $this->send($this->request('POST', '/api/tour-guide/completions/reset', [
            'authenticatedAs' => self::ADMIN,
            'json' => ['userId' => self::MEMBER],
        ]));

        $this->assertEquals(204, $response->getStatusCode());
        $this->assertEquals(0, TourCompletion::query()->where('user_id', self::MEMBER)->count());
    }

    #[Test]
    public function stats_count_outcomes_and_pin_the_drop_off(): void
    {
        $this->record(self::MEMBER, 'dismissed', 2);
        $this->record(self::ADMIN, 'finished');

        $stats = $this->json($this->send($this->request('GET', '/api/tour-guide-tours/1/stats', ['authenticatedAs' => self::ADMIN])));

        $this->assertEquals(1, $stats['finished']);
        $this->assertEquals(1, $stats['dismissed']);
        $this->assertEquals(2, $stats['total']);
        $this->assertEquals(1, collect($stats['steps'])->firstWhere('id', 2)['abandoned']);
    }

    #[Test]
    public function finishing_is_not_counted_as_a_drop_off(): void
    {
        // Counting the last step of everybody who finished would put a spike on
        // the final step and call it the place people give up.
        $this->record(self::MEMBER, 'finished', 3);

        $stats = $this->json($this->send($this->request('GET', '/api/tour-guide-tours/1/stats', ['authenticatedAs' => self::ADMIN])));

        $this->assertEquals(0, collect($stats['steps'])->sum('abandoned'));
    }

    #[Test]
    public function member_may_not_read_stats(): void
    {
        $response = $this->send($this->request('GET', '/api/tour-guide-tours/1/stats', ['authenticatedAs' => self::MEMBER]));

        $this->assertContains($response->getStatusCode(), [401, 403]);
    }

    #[Test]
    public function taking_it_twice_leaves_one_record(): void
    {
        $this->record(self::MEMBER, 'dismissed', 1);
        $this->record(self::MEMBER, 'finished');

        $this->assertEquals(1, TourCompletion::query()->where('user_id', self::MEMBER)->count());
        $this->assertEquals('finished', TourCompletion::query()->where('user_id', self::MEMBER)->value('outcome'));
    }

    protected function record(int $userId, string $outcome, ?int $lastStepId = null)
    {
        return $this->send($this->request('POST', '/api/tour-guide/completions', [
            'authenticatedAs' => $userId,
            'json' => ['tourKey' => 'welcome', 'outcome' => $outcome, 'lastStepId' => $lastStepId],
        ]));
    }
}
