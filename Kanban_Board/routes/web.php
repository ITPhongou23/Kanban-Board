<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TaskController;

Route::get('/', [TaskController::class, 'index']);

Route::get('/tasks', [TaskController::class, 'list']);
Route::post('/tasks', [TaskController::class, 'store']);
Route::post('/tasks/reorder', [TaskController::class, 'reorder']);
Route::patch('/tasks/{task}', [TaskController::class, 'update']);
Route::delete('/tasks/{task}', [TaskController::class, 'destroy']);