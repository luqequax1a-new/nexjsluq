<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductTabRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'content_html' => ['nullable', 'string'],
            'position' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'conditions' => ['nullable', 'array'],
            'conditions.match' => ['nullable', 'in:any,all'],
            'conditions.product_ids' => ['nullable', 'array'],
            'conditions.product_ids.*' => ['integer', 'min:1'],
            'conditions.category_ids' => ['nullable', 'array'],
            'conditions.category_ids.*' => ['integer', 'min:1', 'exists:categories,id'],
            'conditions.tag_names' => ['nullable', 'array'],
            'conditions.tag_names.*' => ['string', 'max:255'],
            'conditions.category_mode' => ['nullable', 'in:any,all'],
            'conditions.tag_mode' => ['nullable', 'in:any,all'],
        ];
    }
}

