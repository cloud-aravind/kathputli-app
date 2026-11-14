package config

import "testing"

func TestLoadReadsArtistInternalAPIToken(t *testing.T) {
	const token = "test-internal-token"
	t.Setenv("ARTIST_INTERNAL_API_TOKEN", token)

	if got := Load().InternalAPIToken; got != token {
		t.Fatalf("InternalAPIToken = %q, want %q", got, token)
	}
}
