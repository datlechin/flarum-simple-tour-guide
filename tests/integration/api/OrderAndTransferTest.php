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
use Psr\Http\Message\ResponseInterface;

class OrderAndTransferTest extends TourGuideTestCase
{
    #[Test]
    public function admin_may_reorder_tours(): void
    {
        $this->database()->table('tour_guide_tours')->insert($this->tour(['id' => 2, 'key' => 'other', 'position' => 1]));

        $response = $this->order('/api/tour-guide-tours/order', [2, 1]);

        $this->assertEquals(204, $response->getStatusCode(), (string) $response->getBody());
        $this->assertEquals([2, 1], Tour::query()->orderBy('position')->pluck('id')->map(fn ($id) => (int) $id)->all());
    }

    #[Test]
    public function admin_may_reorder_steps(): void
    {
        $this->assertEquals(204, $this->order('/api/tour-guide-tours/1/steps/order', [3, 2, 1])->getStatusCode());
        $this->assertEquals([3, 2, 1], $this->stepIdsInOrder());
    }

    #[Test]
    public function steps_left_out_of_the_order_are_numbered_after_it(): void
    {
        $this->order('/api/tour-guide-tours/1/steps/order', [3]);

        $this->assertCount(3, array_unique(TourStep::query()->where('tour_id', 1)->pluck('position')->all()));
        $this->assertEquals(3, $this->stepIdsInOrder()[0]);
    }

    #[Test]
    public function the_order_cannot_reach_into_another_tour(): void
    {
        $this->database()->table('tour_guide_tours')->insert($this->tour(['id' => 2, 'key' => 'other', 'position' => 1]));
        $this->database()->table('tour_guide_steps')->insert($this->step(9, 'Elsewhere', '#x', ['tour_id' => 2, 'position' => 7]));

        $this->order('/api/tour-guide-tours/1/steps/order', [9]);

        $this->assertEquals(7, TourStep::query()->find(9)->position);
    }

    #[Test]
    public function a_non_numeric_id_is_rejected(): void
    {
        $this->assertEquals(422, $this->order('/api/tour-guide-tours/1/steps/order', ['not-an-id'])->getStatusCode());
    }

    #[Test]
    public function member_may_not_reorder(): void
    {
        $this->assertEquals(403, $this->order('/api/tour-guide-tours/1/steps/order', [3, 2, 1], self::MEMBER)->getStatusCode());
        $this->assertEquals(403, $this->order('/api/tour-guide-tours/order', [1], self::MEMBER)->getStatusCode());
    }

    #[Test]
    public function a_tour_survives_a_round_trip(): void
    {
        $this->patchStep(1, ['translations' => ['vi' => ['title' => 'Xin chao', 'description' => 'Noi dung']]]);

        $document = $this->export();

        $this->assertEquals(1, $document['version']);
        $this->assertCount(3, $document['steps']);
        $this->assertEquals('Body of Welcome.', $document['steps'][0]['description']);
        $this->assertEquals('Xin chao', $document['steps'][0]['translations']['vi']['title']);
        $this->assertArrayNotHasKey('id', $document['tour']);

        $response = $this->import($document);

        $this->assertEquals(201, $response->getStatusCode(), (string) $response->getBody());

        $imported = Tour::query()->find($this->json($response)['data']['id']);

        $this->assertNotEquals('welcome', $imported->key);
        $this->assertFalse($imported->is_enabled);
        $this->assertEquals(['Body of Welcome.', 'Body of The header.', 'Body of Home.'], $imported->steps->pluck('content')->all());
        $this->assertEquals('Noi dung', $imported->steps[0]->translations[0]->content);
    }

    #[Test]
    public function a_step_without_a_description_imports(): void
    {
        $response = $this->import(['version' => 1, 'tour' => ['title' => 'Bare'], 'steps' => [['title' => 'Empty', 'description' => '']]]);

        $this->assertEquals(201, $response->getStatusCode(), (string) $response->getBody());
    }

    #[Test]
    public function a_document_that_is_not_ours_is_refused(): void
    {
        $this->assertEquals(422, $this->import(['version' => 99, 'tour' => [], 'steps' => []])->getStatusCode());
        $this->assertEquals(422, $this->import(['version' => 1, 'steps' => 'nope'])->getStatusCode());
    }

    #[Test]
    public function member_may_not_export_or_import(): void
    {
        $export = $this->send($this->request('GET', '/api/tour-guide-tours/1/export', ['authenticatedAs' => self::MEMBER]));

        $this->assertEquals(403, $export->getStatusCode());
        $this->assertEquals(403, $this->import(['version' => 1, 'tour' => ['title' => 'x'], 'steps' => []], self::MEMBER)->getStatusCode());
    }

    protected function order(string $path, array $ids, int $actor = self::ADMIN): ResponseInterface
    {
        return $this->send($this->request('POST', $path, ['authenticatedAs' => $actor, 'json' => ['order' => $ids]]));
    }

    /**
     * @return array<string, mixed>
     */
    protected function export(): array
    {
        $response = $this->send($this->request('GET', '/api/tour-guide-tours/1/export', ['authenticatedAs' => self::ADMIN]));

        $this->assertEquals(200, $response->getStatusCode(), (string) $response->getBody());

        return $this->json($response)['meta'];
    }

    protected function import(array $document, int $actor = self::ADMIN): ResponseInterface
    {
        return $this->send($this->request('POST', '/api/tour-guide-tours/import', ['authenticatedAs' => $actor, 'json' => $document]));
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
