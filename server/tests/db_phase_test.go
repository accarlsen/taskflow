package main

import (
	"testing"

	"github.com/accarlsen/gqlgen-todos/graph/model"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

//IDs to help with testing
var testPhaseID string

//Test phases db-calls
func TestSavePhaseToDB(t *testing.T) {

	var states []string
	states = append(states, "todo")
	states = append(states, "done")

	phaseA := model.NewPhase{
		Name:      "Phase 1",
		ProjectID: testProjectID,
		StartDate: "20.02.2021",
		EndDate:   "25.02.2021",
		States:    states,
	}

	res := mockDbCon.SavePhaseToDB(phaseA)
	testPhaseID = res.InsertedID.(primitive.ObjectID).Hex()
	if res == nil {
		t.Error("Create phase test failed")
	}
}
