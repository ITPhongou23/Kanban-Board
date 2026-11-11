<?php

namespace Database\Seeders;

use App\Models\Task;
use Illuminate\Database\Seeder;

class TaskSeeder extends Seeder
{
    public function run(): void
    {
        $tasks = [
            ['title' => 'Thiết kế giao diện trang chủ', 'description' => 'Làm wireframe và chọn màu chủ đạo', 'status' => 'todo'],
            ['title' => 'Viết tài liệu API',            'description' => 'Mô tả các endpoint /tasks',         'status' => 'todo'],

            ['title' => 'Tích hợp đăng nhập',           'description' => 'Đăng nhập bằng tài khoản Google',   'status' => 'in_progress'],
            ['title' => 'Xây dựng bảng Kanban',         'description' => null,                                'status' => 'in_progress'],

            ['title' => 'Sửa lỗi hiển thị trên mobile', 'description' => 'Kiểm tra lại cột và thẻ',           'status' => 'in_review'],

            ['title' => 'Khởi tạo dự án Laravel',       'description' => 'Cài đặt và cấu hình ban đầu',       'status' => 'done'],
            ['title' => 'Tạo migration bảng tasks',     'description' => null,                                'status' => 'done'],
        ];

        foreach ($tasks as $task) {
            Task::create($task);
        }
    }
}