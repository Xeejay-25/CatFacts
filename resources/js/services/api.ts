/**
 * API Service for CatFacts Memory Game
 * Handles all backend communication with proper error handling and typing
 */

// Types for API responses
interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

interface GameData {
    id: number;
    session_id: string;
    difficulty: string;
    score: number;
    moves: number;
    time_elapsed: number;
    matched_pairs: number;
    total_pairs: number;
    status: 'playing' | 'won' | 'abandoned';
    completed_at?: string;
}

interface CatFactData {
    id: number;
    fact: string;
    length?: number;
}

interface LeaderboardEntry {
    id: number;
    player: string;
    score: number;
    moves: number;
    time_elapsed: number;
    difficulty: string;
    status: string;
    completed_at: string;
    facts_collected: number;
}

class ApiService {
    private baseUrl = '/api';
    private sessionId: string | null = null;

    constructor() {
        // Get or create session ID for anonymous users
        this.sessionId = this.getOrCreateSessionId();
    }

    private getOrCreateSessionId(): string {
        let sessionId = sessionStorage.getItem('game_session_id');
        if (!sessionId) {
            sessionId = this.generateUUID();
            sessionStorage.setItem('game_session_id', sessionId);
        }
        return sessionId;
    }

    private generateUUID(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    private async makeRequest<T>(
        url: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        const defaultHeaders: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        if (csrfToken) {
            defaultHeaders['X-CSRF-TOKEN'] = csrfToken;
        }

        if (this.sessionId) {
            defaultHeaders['X-Session-ID'] = this.sessionId;
        }

        const config: RequestInit = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        };

        try {
            const response = await fetch(`${this.baseUrl}${url}`, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    // Cat Facts API
    async getRandomCatFact(): Promise<ApiResponse<CatFactData>> {
        return this.makeRequest<CatFactData>('/cat-facts/random');
    }

    async searchCatFacts(query: string, limit = 10): Promise<ApiResponse<{ facts: CatFactData[] }>> {
        return this.makeRequest<{ facts: CatFactData[] }>(`/cat-facts/search?query=${encodeURIComponent(query)}&limit=${limit}`);
    }

    async getCatFactStatistics(): Promise<ApiResponse<any>> {
        return this.makeRequest('/cat-facts/statistics');
    }

    // Game API
    async startGame(difficulty: string, userId?: number): Promise<ApiResponse<{ game: GameData; session_id: string }>> {
        const body: any = {
            difficulty,
            session_id: this.sessionId
        };

        if (userId) {
            body.user_id = userId;
        }

        return this.makeRequest<{ game: GameData; session_id: string }>('/games', {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    async updateGame(
        gameId: number,
        updates: {
            score?: number;
            moves?: number;
            time_elapsed?: number;
            matched_pairs?: number;
            status?: string;
        }
    ): Promise<ApiResponse<{ game: GameData }>> {
        return this.makeRequest<{ game: GameData }>(`/games/${gameId}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    }

    async addFactToGame(gameId: number): Promise<ApiResponse<{ fact: CatFactData; facts_collected: number }>> {
        return this.makeRequest<{ fact: CatFactData; facts_collected: number }>(`/games/${gameId}/add-fact`, {
            method: 'POST',
        });
    }

    async getGame(gameId: number): Promise<ApiResponse<{ game: GameData; collected_facts: CatFactData[] }>> {
        return this.makeRequest<{ game: GameData; collected_facts: CatFactData[] }>(`/games/${gameId}`);
    }

    async getLeaderboard(filters: {
        difficulty?: string;
        user_id?: number;
        limit?: number;
        include_all?: boolean;
    } = {}): Promise<ApiResponse<{ leaderboard: LeaderboardEntry[]; total_entries: number }>> {
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined) {
                params.append(key, value.toString());
            }
        });

        const queryString = params.toString();
        const url = `/games/leaderboard${queryString ? `?${queryString}` : ''}`;

        return this.makeRequest<{ leaderboard: LeaderboardEntry[]; total_entries: number }>(url);
    }

    async getUserGameHistory(
        page = 1,
        perPage = 10,
        filters: { difficulty?: string; status?: string } = {}
    ): Promise<ApiResponse<any>> {
        const params = new URLSearchParams({
            page: page.toString(),
            per_page: perPage.toString(),
        });

        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                params.append(key, value);
            }
        });

        return this.makeRequest(`/games/user/history?${params.toString()}`);
    }

    // User API
    async createUser(name: string, email?: string): Promise<ApiResponse<{ user: any }>> {
        return this.makeRequest<{ user: any }>('/users', {
            method: 'POST',
            body: JSON.stringify({ name, email }),
        });
    }

    async getUserStats(limit = 50): Promise<ApiResponse<any>> {
        return this.makeRequest(`/users/stats?limit=${limit}`);
    }

    async getUserLeaderboard(filters: {
        limit?: number;
        difficulty?: string;
        period?: string;
    } = {}): Promise<ApiResponse<any>> {
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                params.append(key, value.toString());
            }
        });

        const queryString = params.toString();
        const url = `/users/leaderboard${queryString ? `?${queryString}` : ''}`;

        return this.makeRequest(url);
    }

    async getUser(userId: number): Promise<ApiResponse<any>> {
        return this.makeRequest(`/users/${userId}`);
    }

    // Utility methods
    getSessionId(): string | null {
        return this.sessionId;
    }

    clearSession(): void {
        sessionStorage.removeItem('game_session_id');
        this.sessionId = this.getOrCreateSessionId();
    }
}

export default new ApiService();
export type { ApiResponse, GameData, CatFactData, LeaderboardEntry };