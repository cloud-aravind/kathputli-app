package config

import "testing"

func TestLoadReadsArtistInternalAPIToken(t *testing.T) {
	const token = "test-internal-token"
	t.Setenv("ARTIST_INTERNAL_API_TOKEN", token)

	if got := Load().ArtistInternalAPIToken; got != token {
		t.Fatalf("ArtistInternalAPIToken = %q, want %q", got, token)
	}
}

func TestLoadLeavesArtistInternalAPITokenEmptyWhenUnset(t *testing.T) {
	t.Setenv("ARTIST_INTERNAL_API_TOKEN", "")

	if got := Load().ArtistInternalAPIToken; got != "" {
		t.Fatalf("ArtistInternalAPIToken = %q, want empty", got)
	}
}
