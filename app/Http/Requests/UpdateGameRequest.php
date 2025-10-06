<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGameRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization will be handled in the controller
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'score' => 'sometimes|integer|min:0|max:999999',
            'moves' => 'sometimes|integer|min:0|max:99999',
            'time_elapsed' => 'sometimes|integer|min:0|max:86400', // Max 24 hours
            'matched_pairs' => 'sometimes|integer|min:0|max:100',
            'status' => 'sometimes|in:playing,won,abandoned',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'score.integer' => 'Score must be a valid integer.',
            'score.min' => 'Score cannot be negative.',
            'score.max' => 'Score is too high.',
            'moves.integer' => 'Moves must be a valid integer.',
            'moves.min' => 'Moves cannot be negative.',
            'time_elapsed.integer' => 'Time elapsed must be a valid integer.',
            'time_elapsed.min' => 'Time elapsed cannot be negative.',
            'time_elapsed.max' => 'Time elapsed cannot exceed 24 hours.',
            'matched_pairs.integer' => 'Matched pairs must be a valid integer.',
            'matched_pairs.min' => 'Matched pairs cannot be negative.',
            'status.in' => 'Game status must be playing, won, or abandoned.',
        ];
    }
}