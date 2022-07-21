package mockdb

import "github.com/accarlsen/gqlgen-todos/db"

// NewMockDb exported
func NewMockDb(uri string) *db.Database {
	return db.Connect(uri)
}
