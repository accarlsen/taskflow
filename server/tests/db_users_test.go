package main

import (
	"testing"

	"github.com/accarlsen/gqlgen-todos/graph/model"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

//Ids to help with testing

var testUserID string

//Test users
func TestCreateUser(t *testing.T) {
	userA := model.NewUser{
		Fname: "Test User A",
		Lname: "Test",
		Email: "test@gmail.com",
	}
	res := mockDbCon.SaveUserToDb(userA, "users")
	testUserID = res.InsertedID.(primitive.ObjectID).Hex()
	if res == nil {
		t.Error("Create user test failed")
	}
}

func TestFindAllUsers(t *testing.T) {
	res := mockDbCon.FindAll("users")
	if res == nil {
		t.Error("Error querying users")
	}
	if res.RemainingBatchLength() < 1 {
		t.Error("No users")
	}
}

func TestFindOneUser(t *testing.T) {
	res := mockDbCon.FindOne(testUserID, "users")
	if res == nil {
		t.Error("Error querying users")
	}
}

func TestFindOneUserByName(t *testing.T) {
	res1 := mockDbCon.FindOne(testUserID, "users")
	user1 := model.User{}
	res1.Decode(&user1)

	res := mockDbCon.FindByFName(user1.Fname, "users")
	if res == nil {
		t.Error("Error querying users")
	}
	user := model.User{}
	res.Decode(&user)
	if user.Fname != user1.Fname {
		t.Error("Could not find the user with the following name: ", user.Fname)
	}
}

func TestUpdateUser(t *testing.T) {
	res1 := mockDbCon.FindOne(testUserID, "users")
	user1 := model.User{}
	res1.Decode(&user1)
	newUser := model.NewUser{
		Fname: "Test User B",
		Lname: "Test",
		Email: "test@gmail.com",
	}

	res := mockDbCon.UpdateUser(user1.ID, newUser, "users")
	if res == nil {
		t.Error("Update user test failed")
	}

	res2 := mockDbCon.FindOne(testUserID, "users")
	user2 := model.User{}
	res2.Decode(&user2)
	if user2.Fname != "Test User B" {
		t.Error("could not update the user with id: ", testUserID)
	}
}

func TestDeleteUser(t *testing.T) {
	res := mockDbCon.DeleteOne(testUserID, "users")
	if res.DeletedCount < 1 {
		t.Error("delete user test failed")
	}
	res1 := mockDbCon.FindOne(testUserID, "users")
	user := model.User{}
	res1.Decode(&user)
	if user.ID == testUserID {
		t.Error("user was not deleted")
	}
}

func TestDeleteUser2(t *testing.T) {
	res := mockDbCon.DeleteOne(testUserID2, "users")
	if res.DeletedCount < 1 {
		t.Error("delete user test failed")
	}
	res1 := mockDbCon.FindOne(testUserID2, "users")
	user := model.User{}
	res1.Decode(&user)
	if user.ID == testUserID {
		t.Error("user was not deleted")
	}
}

func TestDeleteUser3(t *testing.T) {
	res := mockDbCon.DeleteOne(testUserID3, "users")
	if res.DeletedCount < 1 {
		t.Error("delete user test failed")
	}
	res1 := mockDbCon.FindOne(testUserID3, "users")
	user := model.User{}
	res1.Decode(&user)
	if user.ID == testUserID {
		t.Error("user was not deleted")
	}
}
