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

class CompletionsTest extends TourGuideTestCase
{
    #[Test]
    public function member_records_their_own(): void
    {
        $response = $this->record(self::MEMBER, 'dismissed', 2);

        $this->assertEquals(201, $response->getStatusCode(), (string) $response->getBody());
        $this->assertEquals(2, TourCompletion::query()->where('user_id', self::MEMBER)->value('last_step_id'));
    }

    #[Test]
    public function an_unknown_outcome_is_rejected(): void
    {
        $this->assertEquals(422, $this->record(self::MEMBER, 'nonsense')->getStatusCode());
    }

    #[Test]
    public function a_tour_the_member_is_not_offered_is_rejected(): void
    {
        $this->database()->table('tour_guide_tours')->where('id', 1)->update(['is_enabled' => 0]);

        $this->assertGreaterThanOrEqual(400, $this->record(self::MEMBER, 'finished')->getStatusCode());
        $this->assertEquals(0, TourCompletion::query()->count());
    }

    #[Test]
    public function a_step_from_another_tour_is_rejected(): void
    {
        $this->database()->table('tour_guide_tours')->insert($this->tour(['id' => 2, 'key' => 'other', 'position' => 1]));
        $this->database()->table('tour_guide_steps')->insert($this->step(9, 'Elsewhere', '#x', ['tour_id' => 2]));

        $this->assertEquals(422, $this->record(self::MEMBER, 'dismissed', 9)->getStatusCode());
        $this->assertEquals(0, TourCompletion::query()->count());
    }

    #[Test]
    public function guest_records_nothing(): void
    {
        $response = $this->send($this->request('POST', '/api/tour-guide-completions', [
            'json' => ['data' => ['type' => 'tour-guide-completions', 'attributes' => ['outcome' => 'finished']]],
        ]));

        $this->assertGreaterThanOrEqual(400, $response->getStatusCode());
        $this->assertEquals(0, TourCompletion::query()->count());
    }

    #[Test]
    public function taking_it_again_replaces_the_record(): void
    {
        $this->record(self::MEMBER, 'dismissed', 1);
        $response = $this->record(self::MEMBER, 'finished');

        $this->assertEquals(201, $response->getStatusCode());
        $this->assertEquals(1, TourCompletion::query()->where('user_id', self::MEMBER)->count());
        $this->assertEquals('finished', TourCompletion::query()->where('user_id', self::MEMBER)->value('outcome'));
        $this->assertNull(TourCompletion::query()->where('user_id', self::MEMBER)->value('last_step_id'));
    }

    #[Test]
    public function member_may_reset_their_own(): void
    {
        $this->record(self::MEMBER, 'finished');

        $response = $this->send($this->request('DELETE', '/api/users/'.self::MEMBER.'/tour-guide-completions', ['authenticatedAs' => self::MEMBER]));

        $this->assertEquals(204, $response->getStatusCode());
        $this->assertEquals(0, TourCompletion::query()->count());
    }

    #[Test]
    public function member_may_not_reset_somebody_else(): void
    {
        $this->record(self::ADMIN, 'finished');

        $response = $this->send($this->request('DELETE', '/api/users/'.self::ADMIN.'/tour-guide-completions', ['authenticatedAs' => self::MEMBER]));

        $this->assertEquals(403, $response->getStatusCode());
        $this->assertEquals(1, TourCompletion::query()->count());
    }

    #[Test]
    public function admin_may_reset_a_member(): void
    {
        $this->record(self::MEMBER, 'finished');

        $response = $this->send($this->request('DELETE', '/api/users/'.self::MEMBER.'/tour-guide-completions', ['authenticatedAs' => self::ADMIN]));

        $this->assertEquals(204, $response->getStatusCode());
        $this->assertEquals(0, TourCompletion::query()->count());
    }

    #[Test]
    public function stats_count_outcomes_and_pin_the_drop_off(): void
    {
        $this->record(self::MEMBER, 'dismissed', 2);
        $this->record(self::ADMIN, 'finished', 3);

        $stats = $this->stats();

        $this->assertEquals(1, $stats['finished']);
        $this->assertEquals(1, $stats['dismissed']);
        $this->assertEquals(2, $stats['total']);
        $this->assertEquals([0, 1, 0], array_column($stats['steps'], 'abandoned'));
    }

    #[Test]
    public function stats_of_an_untaken_tour_are_empty(): void
    {
        $stats = $this->stats();

        $this->assertEquals(0, $stats['total']);
        $this->assertCount(3, $stats['steps']);
    }

    #[Test]
    public function member_may_not_read_stats(): void
    {
        $response = $this->send($this->request('GET', '/api/tour-guide-tours/1/stats', ['authenticatedAs' => self::MEMBER]));

        $this->assertEquals(403, $response->getStatusCode());
    }

    /**
     * @return array<string, mixed>
     */
    protected function stats(): array
    {
        $response = $this->send($this->request('GET', '/api/tour-guide-tours/1/stats', ['authenticatedAs' => self::ADMIN]));

        $this->assertEquals(200, $response->getStatusCode(), (string) $response->getBody());

        return $this->json($response)['meta'];
    }
}
