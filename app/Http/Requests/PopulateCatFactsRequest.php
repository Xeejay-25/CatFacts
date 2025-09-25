<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PopulateCatFactsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Only authenticated users can access this endpoint anyway
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'count' => 'sometimes|integer|min:1|max:100', // Limit to prevent abuse
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'count.integer' => 'Count must be a valid integer.',
            'count.min' => 'Count must be at least 1.',
            'count.max' => 'Count cannot exceed 100 facts per request.',
        ];
    }

    /**
     * Get the validated data from the request.
     */
    public function validated($key = null, $default = null): array
    {
        $data = parent::validated();
        
        // Set default count if not provided
        $data['count'] = $data['count'] ?? 50;
        
        return $data;
    }
}