<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TaskController extends Controller
{
    const STATUSES = ['todo', 'in_progress', 'in_review', 'done'];

    public function index()
    {
        $tasks = Task::orderBy('id')->get(['id', 'title', 'description', 'status']);
       
        return view('kanban', compact('tasks'));
    }

    public function list()
    {
        return Task::orderBy('id')->get(['id', 'title', 'description', 'status']);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'status'      => 'required|in:' . implode(',', self::STATUSES),
        ]);

        return Task::create($data);
    }

    public function update(Request $request, Task $task)
    {
        $task->update($request->validate([
            'title'       => 'sometimes|required|string|max:255',
            'description' => 'sometimes|nullable|string',
        ]));

        return $task;
    }

    public function destroy(Task $task)
    {
        $task->delete();
        return response()->noContent();
    }

    public function reorder(Request $request)
    {
        $order = $request->validate(['order' => 'required|array'])['order'];

        DB::transaction(function () use ($order) {
            foreach ($order as $status => $ids) {
                if (!in_array($status, self::STATUSES, true)) continue;
                Task::whereIn('id', $ids)->update(['status' => $status]);
            }
        });

        return response()->noContent();
    }
}