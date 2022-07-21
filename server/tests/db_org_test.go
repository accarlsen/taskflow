package main

import (
	"context"
	"log"
	"testing"
	"time"

	"github.com/accarlsen/gqlgen-todos/graph/model"
	helper "github.com/accarlsen/gqlgen-todos/helpers"
	"github.com/aws/aws-sdk-go/aws"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

//Ids to help with testing

var testOrgID string
var testUserID3 string
var testUserID2 string
var testAdminID string
var collection string = "organizations"

//Test users
func TestCreateOrg(t *testing.T) {
	userA := model.NewUser{
		Fname: "Test User AB",
		Lname: "Test",
		Email: "test@gmail.com",
	}
	res := mockDbCon.SaveUserToDb(userA, "users")
	testUserID3 = res.InsertedID.(primitive.ObjectID).Hex()
	if res == nil {
		t.Error("Create user test failed")
	}
	var members []string
	members = append(members, testUserID3)
	org := model.NewOrg{
		Name:        "OrgA",
		Description: "The new IT giant",
		NumMembers:  aws.Int(len(members)),
		OwnerID:     aws.String(testUserID3),
		MembersID:   members,
	}
	resOrg := mockDbCon.SaveOrgToDb(org, collection)
	testOrgID = resOrg.InsertedID.(primitive.ObjectID).Hex()
	if resOrg == nil {
		t.Error("Create org test failed")
	}
}

func TestFindUsersOrgs(t *testing.T) {
	res := mockDbCon.FindOne(testOrgID, collection)
	if res == nil {
		t.Error("Error querying users")
	}
	org := model.Organization{}
	res.Decode(&org)
	if len(org.MembersID) < 1 {
		t.Error("No members")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	cur := mockDbCon.FindAll("users")
	var foundUsers []*model.User
	defer cur.Close(ctx)
	for cur.Next(ctx) {
		var foundUser *model.User
		err := cur.Decode(&foundUser)
		if err != nil {
			log.Fatal(err)
		}
		for i := 0; i < len(org.MembersID); i++ {
			if foundUser.ID == org.MembersID[i] {
				foundUsers = append(foundUsers, foundUser)
			}
		}
	}
	if foundUsers == nil {
		t.Error("Error getting users in org")
	}
	//fmt.Println("This is the get org users count:", len(foundUsers))
	if len(foundUsers) < 1 {
		t.Error("No users in org")
	}
}

func TestAddMember(t *testing.T) {
	isOwner, org := helper.CheckOrgOwner(testUserID3, testOrgID, mockDbCon)
	if org.ID == "" {
		t.Error("Error getting organization")
	}
	if !isOwner {
		isAdmin := helper.OrgAdminCheck(testUserID3, org)
		if !isAdmin {
			t.Error("Access denied, not a owner/admin")
		}
	}
	userB := model.NewUser{
		Fname: "Test User B",
		Lname: "Test",
		Email: "test@gmail.com",
	}
	res := mockDbCon.SaveUserToDb(userB, "users")
	testUserID2 = res.InsertedID.(primitive.ObjectID).Hex()
	if res == nil {
		t.Error("Error making new user")
	}
	resGet := mockDbCon.FindOne(testOrgID, collection)
	if resGet == nil {
		t.Error("Error getting organization")
	}
	mockOrg := model.Organization{}
	resGet.Decode(&mockOrg)
	var members []string = mockOrg.MembersID
	var admins []string = mockOrg.AdminsID
	members = append(members, testUserID2)
	addMember := model.Organization{
		AdminsID:   admins,
		MembersID:  members,
		NumMembers: len(members),
	}
	resAdd := mockDbCon.ManageOrgMembers(testOrgID, addMember, collection)
	if resAdd == nil {
		t.Error("Could not add member")
	}
	if resAdd.ModifiedCount != 1 {
		t.Error("Org not modified")
	}
	resGet2 := mockDbCon.FindOne(testOrgID, collection)
	if resGet2 == nil {
		t.Error("Could not find org")
	}
	testOrg := model.Organization{}
	resGet2.Decode(&testOrg)
	//fmt.Println("In test addmembers: ", testOrg.MembersID)
	//fmt.Println("In test addmembers: ", testOrg.AdminsID)
	if testOrg.NumMembers != 2 {
		t.Error("Members not added")
	}
}

func TestAddUserAsAdmin(t *testing.T) {
	hasPriviliges, mockOrg := helper.CheckOrgOwner(testUserID3, testOrgID, mockDbCon)
	if mockOrg.ID == "" {
		t.Error("Error getting user/org")
	}
	if !hasPriviliges {
		t.Error("Not a owner, only owners can add admins")
	}
	userAdmin := model.NewUser{
		Fname: "Admin user",
		Lname: "Admin",
		Email: "test@gmail.com",
	}
	res := mockDbCon.SaveUserToDb(userAdmin, "users")
	testAdminID = res.InsertedID.(primitive.ObjectID).Hex()
	if res == nil {
		t.Error("Error making new user")
	}
	var admins []string = mockOrg.AdminsID
	admins = append(admins, testAdminID)
	var members []string = mockOrg.MembersID
	members = append(members, testAdminID)
	addMember := model.Organization{
		AdminsID:   admins,
		MembersID:  members,
		NumMembers: len(members),
	}
	resAdd := mockDbCon.AddNewMemberAsAdmin(testOrgID, addMember, collection)
	if resAdd == nil {
		t.Error("Could not add member")
	}
	if resAdd.ModifiedCount != 1 {
		t.Error("Org not modified")
	}
	resGet2 := mockDbCon.FindOne(testOrgID, collection)
	if resGet2 == nil {
		t.Error("Could not find org")
	}
	testOrg := model.Organization{}
	resGet2.Decode(&testOrg)
	//fmt.Println("Admins len:", len(testOrg.AdminsID))
	//fmt.Println("Members len:", len(testOrg.MembersID))
	if testOrg.NumMembers != 3 {
		t.Error("Member not added")
	}
	if len(testOrg.AdminsID) < 1 {
		t.Error("Member not added as admin")
	}
}

func TestManageAdmins(t *testing.T) {
	isOwner, mockOrg := helper.CheckOrgOwner(testUserID3, testOrgID, mockDbCon)
	if mockOrg.ID == "" {
		t.Error("Org not found")
	}
	if !isOwner {
		t.Error("Access denied")
	}
	var admins []string = mockOrg.AdminsID
	admins = append(admins, testUserID2)
	addMember := model.Organization{
		AdminsID: admins,
	}
	resAdd := mockDbCon.ManageOrgAdmins(testOrgID, addMember, collection)
	if resAdd == nil {
		t.Error("Could not add member to admin list")
	}
	if resAdd.ModifiedCount != 1 {
		t.Error("Org not modified")
	}
	resGet2 := mockDbCon.FindOne(testOrgID, collection)
	if resGet2 == nil {
		t.Error("Could not find org")
	}
	testOrg := model.Organization{}
	resGet2.Decode(&testOrg)
	//fmt.Println("In test ManageAdmins: ", testOrg.MembersID)
	//fmt.Println("In test ManageAdmins: ", testOrg.AdminsID)
	if len(testOrg.AdminsID) != 2 {
		t.Error("Members not added")
	}
}

func TestUpdateOrg(t *testing.T) {
	isOwner, org := helper.CheckOrgOwner(testUserID2, testOrgID, mockDbCon)
	if org.ID == "" {
		t.Error("Error getting organization")
	}
	if !isOwner {
		isAdmin := helper.OrgAdminCheck(testUserID2, org)
		if !isAdmin {
			t.Error("Access denied, not a owner/admin")
		}
	}

	newOrg := model.EditOrg{
		Name:        "This is a edit",
		Description: "This is a edit test",
	}

	resUpdate := mockDbCon.UpdateOrg(testOrgID, newOrg, collection)
	if resUpdate == nil {
		t.Error("Error updating organization")
	}

	resOrgEdit := mockDbCon.FindOne(testOrgID, collection)
	if resOrgEdit == nil {
		t.Error("Error getting organization")
	}
	orgEdit := model.Organization{}
	resOrgEdit.Decode(&orgEdit)
	if orgEdit.Name != "This is a edit" {
		t.Error("Update failed, information not updated")
	}
}

func TestOwnerPriviliges(t *testing.T) {
	isOwner, org := helper.CheckOrgOwner(testUserID, testOrgID, mockDbCon)
	if org.ID == "" {
		t.Error("Org not found")
	}
	if isOwner {
		t.Error("Access granted, but user not a owner")
	}
}

func TestAdminPriviliges(t *testing.T) {
	isAdmin, org := helper.CheckAdminOrg(testUserID, testOrgID, mockDbCon)
	if org.ID == "" {
		t.Error("Org not found")
	}
	if isAdmin {
		t.Error("Access granted, but user not a admin")
	}
}

func TestOrgsUser(t *testing.T) {
	cur := mockDbCon.FindUserOrgs(testUserID2, collection)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	if cur == nil {
		t.Error("Error getting the organiztions for a single user")
	}
	var foundOrgs []*model.Organization
	defer cur.Close(ctx)
	for cur.Next(ctx) {
		var foundOrg *model.Organization
		err := cur.Decode(&foundOrg)
		if err != nil {
			log.Fatal(err)
		}
		//fmt.Println("Found Org: " + foundOrg.Name)
		foundOrgs = append(foundOrgs, foundOrg)
	}
	if len(foundOrgs) < 1 {
		t.Error("Organization(s) not found")
	}
	//fmt.Println("TestUserID2:", testUserID2)
	var userIsInOrg bool = false
	for i := 0; i < len(foundOrgs); i++ {
		//fmt.Println(foundOrgs[i].MembersID)
		for j := 0; j < len(foundOrgs[i].MembersID); j++ {
			//fmt.Println("Ids in the foundOrg:", foundOrgs[i].MembersID[j])
			if testUserID2 == foundOrgs[i].MembersID[j] {
				userIsInOrg = true
			}
		}
	}
	if !userIsInOrg {
		t.Error("User is not in org, no matching id's")
	}
}

func TestRemoveOrgMembers(t *testing.T) {
	isOwner, mockOrg := helper.CheckOrgOwner(testAdminID, testOrgID, mockDbCon)
	if mockOrg.ID == "" {
		t.Error("Error getting organization")
	}
	if !isOwner {
		isAdmin := helper.OrgAdminCheck(testAdminID, mockOrg)
		if !isAdmin {
			t.Error("Access denied, user not a admin/owner in organization")
		}
	}
	var members []string = mockOrg.MembersID
	var admins []string = mockOrg.AdminsID
	var newAdmins []string
	var newMembers []string
	for i := 0; i < len(members); i++ {
		if members[i] == testUserID2 {
			newMembers = helper.RemoveIndex(members, i)
		}
	}
	for i := 0; i < len(admins); i++ {
		if admins[i] == testUserID2 {
			newAdmins = helper.RemoveIndex(admins, i)
		}
	}
	RemoveMember := model.Organization{
		AdminsID:   newAdmins,
		MembersID:  newMembers,
		NumMembers: len(newMembers),
	}
	resRemove := mockDbCon.ManageOrgMembers(testOrgID, RemoveMember, collection)
	if resRemove == nil {
		t.Error("Error removing member")
	}
	resGet2 := mockDbCon.FindOne(testOrgID, collection)
	if resGet2 == nil {
		t.Error("Could not find org")
	}
	testOrg := model.Organization{}
	resGet2.Decode(&testOrg)
	if testOrg.NumMembers != 2 {
		t.Error("Members not removed")
	}
}

func TestRemoveOrgAdmins(t *testing.T) {
	isOwner, mockOrg := helper.CheckOrgOwner(testUserID3, testOrgID, mockDbCon)
	if mockOrg.ID == "" {
		t.Error("Error getting organization")
	}
	if !isOwner {
		t.Error("Access denied, user is not a owner in organization")
	}
	var admins []string = mockOrg.AdminsID
	var newAdmins []string
	//fmt.Println("Before: ", admins)
	for i := 0; i < len(admins); i++ {
		if admins[i] == testAdminID {
			newAdmins = helper.RemoveIndex(admins, i)
		}
	}
	//fmt.Println("After: ", newAdmins)
	RemoveAdmin := model.Organization{
		AdminsID: newAdmins,
	}
	resRemove := mockDbCon.ManageOrgAdmins(testOrgID, RemoveAdmin, collection)
	//fmt.Println("Modified count admins:", resRemove.ModifiedCount)
	if resRemove == nil {
		t.Error("Error removing member")
	}
	resGet2 := mockDbCon.FindOne(testOrgID, collection)
	if resGet2 == nil {
		t.Error("Could not find org")
	}
	testOrg := model.Organization{}
	resGet2.Decode(&testOrg)
	//fmt.Println("TestAdminID: ", testAdminID)
	for i := 0; i < len(testOrg.AdminsID); i++ {
		//fmt.Println("Admins after delete:", testOrg.AdminsID[i])
		if testOrg.AdminsID[i] == testAdminID {
			t.Error("Admin not removed")
		}
	}
}

func TestDeleteOrg(t *testing.T) {
	isOwner, mockOrg := helper.CheckOrgOwner(testUserID3, testOrgID, mockDbCon)
	if mockOrg.ID == "" {
		t.Error("Error getting organization")
	}
	if !isOwner {
		t.Error("Access denied, user is not a owner in organization")
	}
	res := mockDbCon.DeleteOne(testOrgID, collection)
	if res.DeletedCount < 1 {
		t.Error("delete org test failed")
	}
	res1 := mockDbCon.FindOne(testOrgID, collection)
	testOrg := model.Organization{}
	res1.Decode(&testOrg)
	if testOrg.ID == testOrgID {
		t.Error("Org was not deleted")
	}
}
