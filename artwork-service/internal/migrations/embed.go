package migrations

import "embed"

// Files contains SQL migrations.
//
//go:embed *.sql
var Files embed.FS
