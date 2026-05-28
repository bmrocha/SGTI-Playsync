export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    return fetch(input, {
        ...init,
        headers: {
            ...init?.headers,
            'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
    });
}
