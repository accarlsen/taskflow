package helpers

import (
	"github.com/accarlsen/gqlgen-todos/db"
	"github.com/accarlsen/gqlgen-todos/graph/model"
)

// The org auth checks here are used in the db testing for git ci
// No claims are added to ci-yml, and the logic is the same, just different data
// Org auths here not used in resolvers, keep them for db tests

// CheckOrgOwner exported
func CheckOrgOwner(userID string, orgID string, db *db.Database) (bool, model.Organization) {
	var hasPriviliges bool = false
	resUser := db.FindOne(userID, "users")
	if resUser == nil {
		return hasPriviliges, model.Organization{}
	}
	resOrg := db.FindOne(orgID, "organizations")
	if resOrg == nil {
		return hasPriviliges, model.Organization{}
	}
	// Decode all data
	user := model.User{}
	resUser.Decode(&user)
	org := model.Organization{}
	resOrg.Decode(&org)

	// Check for priviliges
	if user.ID == org.OwnerID {
		hasPriviliges = true
	}
	return hasPriviliges, org
}

// CheckAdminOrg exported
func CheckAdminOrg(userID string, orgID string, db *db.Database) (bool, model.Organization) {
	var hasPriviliges bool = false
	resUser := db.FindOne(userID, "users")
	if resUser == nil {
		return hasPriviliges, model.Organization{}
	}
	resOrg := db.FindOne(orgID, "organizations")
	if resOrg == nil {
		return hasPriviliges, model.Organization{}
	}
	// Decode all data
	user := model.User{}
	resUser.Decode(&user)
	org := model.Organization{}
	resOrg.Decode(&org)

	// Check for priviliges
	for i := 0; i < len(org.AdminsID); i++ {
		if user.ID == org.AdminsID[i] {
			hasPriviliges = true
		}
	}
	return hasPriviliges, org
}

// OrgAdminCheck exported
func OrgAdminCheck(userID string, org model.Organization) bool {
	for i := 0; i < len(org.AdminsID); i++ {
		if userID == org.AdminsID[i] {
			return true
		}
	}
	return false
}

// CheckProjectLead exported
func CheckProjectLead(userID string, projectID string, db *db.Database) (bool, model.Project) {
	var hasPriviliges bool = false
	resUser := db.FindOne(userID, "users")
	if resUser == nil {
		return hasPriviliges, model.Project{}
	}
	resProject := db.FindOne(projectID, "projects")
	if resProject == nil {
		return hasPriviliges, model.Project{}
	}
	// Decode all data
	user := model.User{}
	resUser.Decode(&user)
	project := model.Project{}
	resProject.Decode(&project)

	// Check for priviliges
	if user.ID == project.ProjectLeadID {
		hasPriviliges = true
	}
	return hasPriviliges, project
}

// RemoveIndex exported
func RemoveIndex(arr []string, i int) []string {
	arr[i] = arr[len(arr)-1]
	return arr[:len(arr)-1]
}

// RemoveIndexPointerArr exported
func RemoveIndexPointerArr(arr []*string, i int) []*string {
	arr[i] = arr[len(arr)-1]
	return arr[:len(arr)-1]
}

// Contains exported
func Contains(arr []string, compareString string) bool {
	for _, check := range arr {
		if check == compareString {
			return true
		}
	}
	return false
}
