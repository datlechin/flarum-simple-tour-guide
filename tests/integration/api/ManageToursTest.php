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

use Datlechin\FlarumSimpleTourGuide\Tour;
use Datlechin\FlarumSimpleTourGuide\TourStep;
use PHPUnit\Framework\Attributes\Test;

/**
 * Writing tours and steps, which only admins may do.
 */
class ManageToursTest extends TourGuideTestCase
{
    #[Test]
    public function admin_may_create_a_tour(): void
    {
        $response = $this->send($this->request('POST', '/api/tour-guide-tours', [
            'authenticatedAs' => self::ADMIN,
            'json' => ['data' => ['attributes' => ['title' => 'Second', 'key' => 'second', 'route' => 'discussion']]],
        ]));

        $this->assertEquals(201, $response->getStatusCode());
        $this->assertNotNull(Tour::query()->where('key', 'second')->first());
    }

    #[Test]
    public function new_tours_go_to_the_end(): void
    {
        $this->send($this->request('POST', '/api/tour-guide-tours', [
            'authenticatedAs' => self::ADMIN,
            'json' => ['data' => ['attributes' => ['title' => 'Second', 'key' => 'second']]],
        ]));

        $this->assertEquals(1, Tour::query()->where('key', 'second')->value('position'));
    }

    #[Test]
    public function a_duplicate_key_is_rejected(): void
    {
        $response = $this->send($this->request('POST', '/api/tour-guide-tours', [
            'authenticatedAs' => self::ADMIN,
            'json' => ['data' => ['attributes' => ['title' => 'Clash', 'key' => 'welcome']]],
        ]));

        $this->assertEquals(422, $response->getStatusCode());
    }

    #[Test]
    public function member_may_not_read_or_write_the_management_list(): void
    {
        $read = $this->send($this->request('GET', '/api/tour-guide-tours', ['authenticatedAs' => self::MEMBER]));
        $write = $this->send($this->request('POST', '/api/tour-guide-tours', [
            'authenticatedAs' => self::MEMBER,
            'json' => ['data' => ['attributes' => ['title' => 'Nope', 'key' => 'nope']]],
        ]));

        $this->assertContains($read->getStatusCode(), [401, 403]);
        $this->assertContains($write->getStatusCode(), [401, 403]);
    }

    #[Test]
    public function a_step_needs_a_tour_to_belong_to(): void
    {
        $response = $this->send($this->request('POST', '/api/tour-guide-steps', [
            'authenticatedAs' => self::ADMIN,
            'json' => ['data' => ['attributes' => ['title' => 'Orphan', 'description' => 'Body.']]],
        ]));

        $this->assertEquals(422, $response->getStatusCode());
    }

    #[Test]
    public function a_target_with_a_newline_is_rejected(): void
    {
        $response = $this->createStep(['target' => "a\nb"]);

        $this->assertEquals(422, $response->getStatusCode());
    }

    #[Test]
    public function an_over_long_title_is_rejected(): void
    {
        $response = $this->createStep(['title' => str_repeat('x', 256)]);

        $this->assertEquals(422, $response->getStatusCode());
    }

    #[Test]
    public function a_blank_target_is_stored_as_no_target(): void
    {
        $response = $this->send($this->request('PATCH', '/api/tour-guide-steps/2', [
            'authenticatedAs' => self::ADMIN,
            'json' => ['data' => ['attributes' => ['target' => '   ']]],
        ]));

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertNull(TourStep::query()->find(2)->target);
    }

    #[Test]
    public function titles_are_trimmed(): void
    {
        $this->send($this->request('PATCH', '/api/tour-guide-steps/2', [
            'authenticatedAs' => self::ADMIN,
            'json' => ['data' => ['attributes' => ['title' => '  spaced  ']]],
        ]));

        $this->assertEquals('spaced', TourStep::query()->find(2)->title);
    }

    #[Test]
    public function member_may_not_edit_or_delete_a_step(): void
    {
        $edit = $this->send($this->request('PATCH', '/api/tour-guide-steps/2', [
            'authenticatedAs' => self::MEMBER,
            'json' => ['data' => ['attributes' => ['title' => 'Nope']]],
        ]));
        $delete = $this->send($this->request('DELETE', '/api/tour-guide-steps/2', ['authenticatedAs' => self::MEMBER]));

        $this->assertContains($edit->getStatusCode(), [401, 403]);
        $this->assertContains($delete->getStatusCode(), [401, 403]);
    }

    #[Test]
    public function deleting_a_tour_takes_its_steps_with_it(): void
    {
        $response = $this->send($this->request('DELETE', '/api/tour-guide-tours/1', ['authenticatedAs' => self::ADMIN]));

        $this->assertEquals(204, $response->getStatusCode());
        $this->assertEquals(0, TourStep::query()->where('tour_id', 1)->count());
    }

    #[Test]
    public function translations_round_trip_and_clear(): void
    {
        $set = $this->send($this->request('PATCH', '/api/tour-guide-steps/1', [
            'authenticatedAs' => self::ADMIN,
            'json' => ['data' => ['attributes' => ['translations' => ['vi' => ['title' => 'Xin chao', 'description' => 'Noi dung']]]]],
        ]));

        $this->assertEquals('Xin chao', $this->json($set)['data']['attributes']['translations']['vi']['title']);

        $cleared = $this->send($this->request('PATCH', '/api/tour-guide-steps/1', [
            'authenticatedAs' => self::ADMIN,
            'json' => ['data' => ['attributes' => ['translations' => ['vi' => ['title' => '', 'description' => '']]]]],
        ]));

        $this->assertEmpty($this->json($cleared)['data']['attributes']['translations']);
    }

    #[Test]
    public function admin_may_duplicate_a_tour(): void
    {
        $response = $this->send($this->request('POST', '/api/tour-guide-tours/1/duplicate', ['authenticatedAs' => self::ADMIN]));

        $this->assertEquals(201, $response->getStatusCode());

        $copy = Tour::query()->find($this->json($response)['id']);

        $this->assertNotEquals('welcome', $copy->key);
        $this->assertEquals(3, $copy->steps()->count());
        // An unreviewed copy should never start showing itself to members.
        $this->assertFalse($copy->is_enabled);
    }

    #[Test]
    public function admin_may_duplicate_a_step(): void
    {
        $response = $this->send($this->request('POST', '/api/tour-guide-steps/1/duplicate', ['authenticatedAs' => self::ADMIN]));

        $this->assertEquals(201, $response->getStatusCode());
        $this->assertEquals(4, TourStep::query()->where('tour_id', 1)->count());
    }

    #[Test]
    public function member_may_not_duplicate(): void
    {
        $tour = $this->send($this->request('POST', '/api/tour-guide-tours/1/duplicate', ['authenticatedAs' => self::MEMBER]));
        $step = $this->send($this->request('POST', '/api/tour-guide-steps/1/duplicate', ['authenticatedAs' => self::MEMBER]));

        $this->assertContains($tour->getStatusCode(), [401, 403]);
        $this->assertContains($step->getStatusCode(), [401, 403]);
    }

    protected function createStep(array $attributes)
    {
        return $this->send($this->request('POST', '/api/tour-guide-steps', [
            'authenticatedAs' => self::ADMIN,
            'json' => [
                'data' => [
                    'attributes' => $attributes + ['title' => 'New', 'description' => 'Body.'],
                    'relationships' => ['tour' => ['data' => ['type' => 'tour-guide-tours', 'id' => '1']]],
                ],
            ],
        ]));
    }
}
