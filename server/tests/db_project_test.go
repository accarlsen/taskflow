package main

import (
	"testing"

	"github.com/accarlsen/gqlgen-todos/graph/model"
	"github.com/aws/aws-sdk-go/aws"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var testProjectID string

func TestCreateProject(t *testing.T) {

	var members []string
	members = append(members, testUserID)
	projectInput := model.NewProjectMod{
		Name:             "Project I",
		Description:      aws.String("The first project."),
		Progress:         6,
		Weight:           11,
		StartDate:        "20.02.2021",
		EndDate:          "29.02.2021",
		OrganizationID:   testOrgID,
		CreatedByID:      testUserID,
		ProjectLeadID:    testAdminID,
		ProjectMonitorID: aws.String(testUserID),
	}
	res := mockDbCon.SaveProjectToDB(projectInput)
	testPhaseID = res.InsertedID.(primitive.ObjectID).Hex()
	if res == nil {
		t.Error("Create phase test failed")
	}
}
