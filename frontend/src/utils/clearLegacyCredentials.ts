/** Delete the two legacy stores that could contain provider credentials. */
export function clearLegacyCredentials(): void {
    try {
        localStorage.removeItem('chishenme-app-settings')
        localStorage.removeItem('chishenme-env-snapshot')
    } catch {
        // Storage can be unavailable in restricted browser sessions.
    }
}
