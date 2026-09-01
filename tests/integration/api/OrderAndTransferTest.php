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
 * Reordering, and moving a tour between forums as a document.
 */
class OrderAndTransferTest extends TourGuideTestCase
{
    #[Test]
    public function admin_may_reorder_steps(): void
    {
        $response = $this->send($this->request('POST', '/api/tour-guide-tours/1/steps/order', [
            'authenticatedAs' => self::ADMIN,
            'json' => ['order' => [3, 2, 1]],
        ]));

        $this->assertEquals(204, $response->getStatusCode());
        $this->assertEquals([3, 2, 1], $this->stepIdsInOrder());
    }

    #[Test]
    public function steps_left_out_of_the_order_are_numbered_after_it(): void
    {
        $this->send($this->request('POST', '/api/tour-guide-tours/1/steps/order', [
            'authenticatedAs' => self::ADMIN,
            'json' => ['order' => [3]],
        ]));

        // No two steps may share a position, or the order stops being an order.
        $positions = TourStep::query()->where('tour_id', 1)->pluck('position')->all();

        $this->assertCount(3, array_unique($positions));
        $this->assertEquals(3, $this->stepIdsInOrder()[0]);
    }

    #[Test]
    public function the_order_cannot_reach_into_another_tour(): void
    {
        $this->database()->table('tour_guide_tours')->insert($this->tour(['id' => 2, 'key' => 'other', 'position' => 1]));
        $this->database()->table('tour_guide_steps')->insert($this->step(9, 'Elsewhere', '#x', ['tour_id' => 2, 'position' => 7]));

        $this->send($this->request('POST', '/api/tour-guide-tours/1/steps/order', [
            'authenticatedAs' => self::ADMIN,
            'json' => ['order' => [9]],
        ]));

        $this->assertEquals(7, TourStep::query()->find(9)->position);
    }

    #[Test]
    public function a_non_numeric_id_is_rejected(): void
    {
        $response = $this->send($this->request('POST', '/api/tour-guide-tours/1/steps/order', [
            'authenticatedAs' => self::ADMIN,
            'json' => ['order' => ['not-an-id']],
        ]));

        $this->assertEquals(422, $response->getStatusCode());
    }

    #[Test]
    public function member_may_not_reorder(): void
    {
        $steps = $this->send($this->request('POST', '/api/tour-guide-tours/1/steps/order', [
            'authenticatedAs' => self::MEMBER,
            'json' => ['order' => [3, 2, 1]],
        ]));
        $tours = $this->send($this->request('POST', '/api/tour-guide-tours/order', [
            'authenticatedAs' => self::MEMBER,
            'json' => ['order' => [1]],
        ]));

        $this->assertContains($steps->getStatusCode(), [401, 403]);
        $this->assertContains($tours->getStatusCode(), [401, 403]);
    }

    #[Test]
    public function a_tour_survives_a_round_trip(): void
    {
        $document = $this->json($this->send($this->request('GET', '/api/tour-guide-tours/1/export', ['authenticatedAs' => self::ADMIN])));

        $this->assertEquals(1, $document['version']);
        $this->assertCount(3, $document['steps']);
        // Ids mean nothing on the forum it lands on.
        $this->assertArrayNotHasKey('id', $document['tour']);

        $response = $this->send($this->request('POST', '/api/tour-guide-tours/import', [
            'authenticatedAs' => self::ADMIN,
            'json' => $document,
        ]));

        $this->assertEquals(201, $response->getStatusCode());

        $imported = Tour::query()->find($this->json($response)['id']);

        $this->assertNotEquals('welcome', $imported->key);
        $this->assertEquals(3, $imported->steps()->count());
        $this->assertFalse($imported->is_enabled);
    }

    #[Test]
    public function translations_travel_with_the_tour(): void
    {
        $this->send($this->request('PATCH', '/api/tour-guide-steps/1', [
            'authenticatedAs' => self::ADMIN,
            'json' => ['data' => ['attributes' => ['translations' => ['vi' => ['title' => 'Xin chao', 'description' => 'Noi dung']]]]],
        ]));

        $document = $this->json($this->send($this->request('GET', '/api/tour-guide-tours/1/export', ['authenticatedAs' => self::ADMIN])));

        $this->assertEquals('Xin chao', $document['steps'][0]['translations']['vi']['title']);
    }

    #[Test]
    public function a_document_from_the_future_is_refused(): void
    {
        $response = $this->send($this->request('POST', '/api/tour-guide-tours/import', [
            'authenticatedAs' => self::ADMIN,
            'json' => ['version' => 99],
        ]));

        $this->assertEquals(422, $response->getStatusCode());
    }

    #[Test]
    public function member_may_not_export_or_import(): void
    {
        $export = $this->send($this->request('GET', '/api/tour-guide-tours/1/export', ['authenticatedAs' => self::MEMBER]));
        $import = $this->send($this->request('POST', '/api/tour-guide-tours/import', [
            'authenticatedAs' => self::MEMBER,
            'json' => ['version' => 1, 'tour' => [], 'steps' => []],
        ]));

        $this->assertContains($export->getStatusCode(), [401, 403]);
        $this->assertContains($import->getStatusCode(), [401, 403]);
    }

    /**
     * @return array<int, int>
     */
    protected function stepIdsInOrder(): array
    {
        return TourStep::query()
            ->where('tour_id', 1)
            ->orderBy('position')
            ->orderBy('id')
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }
}
