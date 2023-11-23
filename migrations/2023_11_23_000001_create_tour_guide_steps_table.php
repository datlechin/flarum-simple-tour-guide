<?php

use Illuminate\Database\Schema\Blueprint;

use Flarum\Database\Migration;

return Migration::createTable(
    'tour_guide_steps',
    function (Blueprint $table) {
        $table->increments('id');
        $table->string('title');
        $table->string('description');
        $table->string('target');
        $table->timestamps();
    }
);
