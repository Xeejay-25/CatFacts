<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateUserRequest extends FormRequest
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
            'name' => 'required|string|min:2|max:255|unique:users,name|regex:/^[a-zA-Z0-9\s\-_]+$/',
            'email' => 'nullable|email|max:255|unique:users,email',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Player name is required.',
            'name.min' => 'Player name must be at least 2 characters.',
            'name.max' => 'Player name cannot exceed 255 characters.',
            'name.unique' => 'This player name is already taken.',
            'name.regex' => 'Player name can only contain letters, numbers, spaces, hyphens, and underscores.',
            'email.email' => 'Please provide a valid email address.',
            'email.unique' => 'This email address is already in use.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => trim($this->name),
            'email' => $this->email ? trim(strtolower($this->email)) : null,
        ]);
    }
}