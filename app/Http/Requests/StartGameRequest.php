<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StartGameRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'difficulty' => 'required|in:easy,medium,hard',
            'session_id' => 'nullable|string|max:255',
            'user_id' => 'nullable|exists:users,id'
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'difficulty.required' => 'Game difficulty is required.',
            'difficulty.in' => 'Game difficulty must be easy, medium, or hard.',
            'user_id.exists' => 'The selected user does not exist.',
        ];
    }
}