package main

import (
	"context"
	"fmt"
	"log"
	"testing"
	"time"

	"github.com/accarlsen/gqlgen-todos/graph/model"
	mockdb "github.com/accarlsen/gqlgen-todos/tests/mockServer"
	"github.com/aws/aws-sdk-go/aws"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var uri = "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false"
var mockDbCon = mockdb.NewMockDb(uri)

//Ids to help with testing
var testTaskID string
var testTaskPhase string
var testTaskOrg string
var testUserA string
var testUserB string
var testSubtask string

//Test tasks
func TestCreateTask(t *testing.T) {

	userA := model.NewUser{
		Fname: "Test User A",
		Lname: "Test",
		Email: "test@gmail.com",
	}
	resA := mockDbCon.SaveUserToDb(userA, "users")
	testUserA = resA.InsertedID.(primitive.ObjectID).Hex()
	if resA == nil {
		t.Error("Create user test failed")
	}

	userB := model.NewUser{
		Fname: "Test User B",
		Lname: "Test",
		Email: "test@gmail.com",
	}
	resB := mockDbCon.SaveUserToDb(userB, "users")
	testUserB = resB.InsertedID.(primitive.ObjectID).Hex()
	if resB == nil {
		t.Error("Create user test failed")
	}

	dateNow := time.Now().Format("2006-01-02")
	timeNow := time.Now().Format("15:04:05")

	mockTaskA := model.NewTask{
		Name:         "this is a test task",
		Description:  aws.String("this is a test task"),
		AssignedID:   aws.String(testUserA),
		AuthorID:     testUserB,
		DeadlineDate: "11-02-2021",
		DeadlineTime: "23:00:00",
		OrgID:        aws.String(testOrgID),
		CreateDate:   aws.String(dateNow),
		CreateTime:   aws.String(timeNow),
		Progress:     aws.Int(5),
		Weight:       aws.Int(34),
		Archived:     aws.Bool(false),
	}
	res := mockDbCon.SaveTaskToDb(mockTaskA, "tasks")
	testTaskID = res.InsertedID.(primitive.ObjectID).Hex()
	if res == nil {
		t.Error("Create task test failed")
	}
	resGet := mockDbCon.FindOne(testTaskID, "tasks")
	task := model.Task{}
	resGet.Decode(&task)
	if res == nil {
		t.Error("Error getting task from db")
	}
	if task.Name != "this is a test task" {
		t.Error("Data corrupted, check db")
	}
}

func TestCreateTaskPhase(t *testing.T) {
	dateNow := time.Now().Format("2006-01-02")
	timeNow := time.Now().Format("15:04:05")

	mockTaskA := model.NewTask{
		Name:         "this is a test task with phase",
		Description:  aws.String("this is a test desc"),
		AssignedID:   aws.String(testUserA),
		AuthorID:     testUserB,
		PhaseID:      aws.String("Some random phase id"),
		DeadlineDate: "11-02-2021",
		DeadlineTime: "23:00:00",
		OrgID:        aws.String(testOrgID),
		CreateDate:   aws.String(dateNow),
		CreateTime:   aws.String(timeNow),
		Progress:     aws.Int(5),
		Weight:       aws.Int(34),
		Archived:     aws.Bool(false),
	}
	res := mockDbCon.SaveTaskToDb(mockTaskA, "tasks")
	testTaskPhase = res.InsertedID.(primitive.ObjectID).Hex()
	if res == nil {
		t.Error("Create task test failed")
	}
	resGet := mockDbCon.FindOne(testTaskPhase, "tasks")
	task := model.Task{}
	resGet.Decode(&task)
	if res == nil {
		t.Error("Error getting task from db")
	}
	if task.Name != "this is a test task with phase" {
		t.Error("Data corrupted, check db")
	}
}

func TestCreateTaskOrg(t *testing.T) {
	dateNow := time.Now().Format("2006-01-02")
	timeNow := time.Now().Format("15:04:05")

	mockTaskA := model.NewTask{
		Name:         "this is a task with org",
		Description:  aws.String("this is a test with org"),
		AssignedID:   aws.String(testUserA),
		AuthorID:     testUserB,
		OrgID:        aws.String(testOrgID),
		DeadlineDate: "11-02-2021",
		DeadlineTime: "23:00:00",
		CreateDate:   aws.String(dateNow),
		CreateTime:   aws.String(timeNow),
		Progress:     aws.Int(5),
		Weight:       aws.Int(34),
		Archived:     aws.Bool(false),
	}
	res := mockDbCon.SaveTaskToDb(mockTaskA, "tasks")
	testTaskOrg = res.InsertedID.(primitive.ObjectID).Hex()
	if res == nil {
		t.Error("Create task test failed")
	}
	resGet := mockDbCon.FindOne(testTaskOrg, "tasks")
	task := model.Task{}
	resGet.Decode(&task)
	if res == nil {
		t.Error("Error getting task from db")
	}
	if task.Name != "this is a task with org" {
		t.Error("Data corrupted, check db")
	}
}

func TestCreateSubtask(t *testing.T) {
	dateNow := time.Now().Format("2006-01-02")
	timeNow := time.Now().Format("15:04:05")
	mockSub := model.NewSubtask{
		Name:         aws.String("Subtask1"),
		Description:  aws.String("Subtask to task"),
		ParentID:     aws.String(testTaskID),
		CreateDate:   aws.String(dateNow),
		CreateTime:   aws.String(timeNow),
		DeadlineDate: aws.String("11-02-2021"),
		DeadlineTime: aws.String("23:00:00"),
		Archived:     aws.Bool(false),
	}

	res := mockDbCon.SaveSubtaskToDb(mockSub, "subtasks")
	if res == nil {
		t.Error("Error saving task to db")
	}
	testSubtask = res.InsertedID.(primitive.ObjectID).Hex()
	resGet := mockDbCon.FindOne(testSubtask, "subtasks")
	checkSub := model.Subtask{}
	resGet.Decode(&checkSub)
	if checkSub.Name != "Subtask1" {
		t.Error("Data saved to db corrupted, check db")
	}
}

func TestFindAllSubtasksOfParent(t *testing.T) {
	res := mockDbCon.FindAllSubtasksOfParent(testTaskID)
	if res == nil {
		t.Error("Error fetching subtasks with the same parent ID")
	}
	if res.RemainingBatchLength() < 1 {
		t.Error("No subtasks in cursor")
	}
}

func TestSetSubtaskState(t *testing.T) {

	// In this resolver, check if this is the last subtask to be set "done"
	// If it is, set the parent task to done aswell

	updateState := model.UpdateSubtask{
		State: aws.String("done"),
	}
	res := mockDbCon.SetSubtaskState(testSubtask, aws.StringValue(updateState.State), 0)
	if res == nil {
		t.Error("Error setting subtaskstate")
	}
	resGet := mockDbCon.FindOne(testSubtask, "subtasks")
	checkSub := model.Subtask{}
	resGet.Decode(&checkSub)
	if aws.StringValue(checkSub.State) != "done" {
		t.Error("Error updating state")
	}
}

func TestSetParentTaskState(t *testing.T) {
	res := mockDbCon.SetTaskState(testTaskID, "done", 0, false)
	if res == nil {
		t.Error("Error updating task state")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	resGet := mockDbCon.FindAllSubtasksOfParent(testTaskID)
	if resGet == nil {
		t.Error("Error getting subtasks")
	}
	defer resGet.Close(ctx)
	var foundSubtasks []*model.Subtask
	for resGet.Next(ctx) {
		var foundSubtask *model.Subtask
		err := resGet.Decode(&foundSubtask)
		if err != nil {
			t.Error("Error", err)
		}
		if aws.StringValue(foundSubtask.State) != "done" {
			updateState := model.UpdateSubtask{
				State: aws.String("done"),
			}
			res := mockDbCon.SetSubtaskState(foundSubtask.ID, aws.StringValue(updateState.State), 0)
			if res == nil {
				t.Error("Error setting subtaskstate")
			}
		}
		foundSubtasks = append(foundSubtasks, foundSubtask)
		if len(foundSubtasks) != 1 {
			t.Error("Subtasks not found")
		}
		resCheck := mockDbCon.FindOne(testSubtask, "subtasks")
		if resCheck == nil {
			t.Error("Error fetching subtask")
		}
		checkSub := model.Subtask{}
		resCheck.Decode(&checkSub)
		if aws.StringValue(checkSub.State) != "done" {
			t.Error("Subtask not updated")
		}
	}
}

func TestFindAllTasks(t *testing.T) {
	res := mockDbCon.FindAll("tasks")
	//fmt.Println(res.RemainingBatchLength())
	if res == nil {
		t.Error("Error querying tasks")
	}
	if res.RemainingBatchLength() < 1 {
		t.Error("No tasks")
	}
}

func TestFindOneTask(t *testing.T) {
	res := mockDbCon.FindOne(testTaskID, "tasks")
	if res == nil {
		t.Error("Error querying tasks")
	}
	task := model.Task{}
	res.Decode(&task)
	if aws.StringValue(task.Description) != "this is a test task" {
		t.Error("Task data not found, check db")
	}
}

func TestFindOneTaskByName(t *testing.T) {
	res1 := mockDbCon.FindOne(testTaskID, "tasks")
	if res1 == nil {
		t.Error("Error fetching task")
	}
	task := model.Task{}
	res1.Decode(&task)
	res := mockDbCon.FindByName(task.Name, "tasks")
	if res == nil {
		t.Error("Error querying tasks")
	}
	task1 := model.Task{}
	res.Decode(&task1)
	if task1.Name != task.Name {
		t.Error("Could not find the task withi the following name: ", task1.Name)
	}
}

func TestUpdateTask(t *testing.T) {
	resGet := mockDbCon.FindOne(testTaskID, "tasks")
	if resGet == nil {
		t.Error("Error fetching task")
	}
	task := model.Task{}
	resGet.Decode(&task)
	mockTaskB := model.UpdateTask{
		Name:        aws.String("this is a test B"),
		Description: aws.String("this is a test desc B"),
		Progress:    aws.Int(5),
		Weight:      aws.Int(34),
	}
	resUpdate := mockDbCon.UpdateTask(task.ID, mockTaskB, "tasks")
	if resUpdate == nil {
		t.Error("Update task test failed")
	}
	resGet2 := mockDbCon.FindOne(testTaskID, "tasks")
	task2 := model.Task{}
	resGet2.Decode(&task2)
	if task2.Name != "this is a test B" {
		t.Error("Could not update the task with id: ", testTaskID)
	}
}

func TestAssignTask(t *testing.T) {
	resGet := mockDbCon.FindOne(testTaskID, "tasks")
	if resGet == nil {
		t.Error("Error fetching task")
	}
	task := model.Task{}
	resGet.Decode(&task)
	assigned := model.UpdateTask{
		AssignedID: aws.String(testUserA),
	}
	res := mockDbCon.AssignTask(task.ID, assigned)
	if res == nil {
		t.Error("Task not updated")
	}
	resAfter := mockDbCon.FindOne(testTaskOrg, "tasks")
	taskAfter := model.Task{}
	resAfter.Decode(&taskAfter)
	if aws.StringValue(taskAfter.AssignedID) != testUserA {
		t.Error("Task not assigned, check db")
	}
}

func TestAssignSubtask(t *testing.T) {
	resGet := mockDbCon.FindOne(testSubtask, "subtasks")
	if resGet == nil {
		t.Error("Error fetching subtask")
	}
	task := model.Subtask{}
	resGet.Decode(&task)
	assigned := model.UpdateSubtask{
		AssignedID: aws.String(testUserA),
	}
	res := mockDbCon.AssignSubtask(testSubtask, assigned)
	if res == nil {
		t.Error("Task not updated")
	}
	resAfter := mockDbCon.FindOne(testSubtask, "subtasks")
	taskAfter := model.Subtask{}
	resAfter.Decode(&taskAfter)
	if aws.StringValue(taskAfter.AssignedID) != testUserA {
		t.Error("Task not assigned, check db")
	}
}

func TestUpdateState(t *testing.T) {
	resGet := mockDbCon.FindOne(testTaskOrg, "tasks")
	if resGet == nil {
		t.Error("Error fetching task")
	}
	task := model.Task{}
	resGet.Decode(&task)
	res := mockDbCon.SetTaskState(task.ID, "doing", 0, false)
	if res == nil {
		t.Error("Error updating task state")
	}
	resAfter := mockDbCon.FindOne(testTaskOrg, "tasks")
	if resAfter == nil {
		t.Error("Error fetching after update")
	}
	taskAfter := model.Task{}
	resAfter.Decode(&taskAfter)
	if aws.StringValue(taskAfter.State) != "doing" {
		t.Error("Update failed, check db")
	}
}

func TestGetTasksByStateInOrg(t *testing.T) {
	cur := mockDbCon.FindByStateOrg(testOrgID, "doing")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	if cur == nil {
		t.Error("Error fetching task")
	}
	//fmt.Println("Cur length: ", cur.RemainingBatchLength())
	var foundTasks []model.Task
	defer cur.Close(ctx)
	for cur.Next(ctx) {
		var foundTask model.Task
		err := cur.Decode(&foundTask)
		if err != nil {
			log.Fatal(err)
		}
		foundTasks = append(foundTasks, foundTask)
	}
	nameCheck := foundTasks[0].Name
	//fmt.Println("TASK NAME BY STATE: ", nameCheck)
	if nameCheck != "this is a task with org" {
		t.Error("Task data not found")
	}
}

func TestGetTasksInOrg(t *testing.T) {
	cur := mockDbCon.FindAllTasksOrg(testOrgID, "tasks")
	if cur == nil {
		t.Error("Error fetching tasks")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	if cur == nil {
		t.Error("Error fetching task")
	}
	var foundTasks []model.Task
	defer cur.Close(ctx)
	for cur.Next(ctx) {
		var foundTask model.Task
		err := cur.Decode(&foundTask)
		if err != nil {
			log.Fatal(err)
		}
		foundTasks = append(foundTasks, foundTask)
	}
	nameCheck := foundTasks[2].Name
	//fmt.Println("TASK NAME BY ORG: ", nameCheck)
	if nameCheck != "this is a task with org" {
		t.Error("Task data not found")
	}
}

func TestGetAssignedTasks(t *testing.T) {
	cur := mockDbCon.FindAllTasksAssigned(testOrgID, testUserA, false, 5)
	if cur == nil {
		t.Error("Error fetching tasks assigned to user A")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)

	defer cancel()
	var foundTasks []model.Task
	defer cur.Close(ctx)
	for cur.Next(ctx) {
		var foundTask model.Task

		err := cur.Decode(&foundTask)
		if err != nil {
			fmt.Println(err)
		}
		foundTasks = append(foundTasks, foundTask)
	}
	nameCheck := foundTasks[0].Name
	if nameCheck != "this is a test B" {
		t.Error("Task data not found")
	}
}

func TestGetByAuthor(t *testing.T) {
	cur := mockDbCon.FindAllTasksByAuthor(testOrgID, testUserB, false, 5)
	if cur == nil {
		t.Error("Error fetching tasks assigned to user A")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	var foundTasks []model.Task
	defer cur.Close(ctx)
	for cur.Next(ctx) {
		var foundTask model.Task
		err := cur.Decode(&foundTask)
		if err != nil {
			log.Fatal(err)
		}
		foundTasks = append(foundTasks, foundTask)
	}
	nameCheck := foundTasks[0].Name
	//fmt.Println("TASK NAME BY AUTHOR: ", nameCheck)
	if nameCheck != "this is a test B" {
		t.Error("Task data not found")
	}
}

func TestAddTaskDependencies(t *testing.T) {
	var nextTasks []string
	nextTasks = append(nextTasks, testTaskOrg)
	taskDep := model.UpdateTask{
		NextTasks: aws.StringSlice(nextTasks),
	}
	res := mockDbCon.AddDepToTask(testTaskID, taskDep)
	if res == nil {
		t.Error("Error adding dependencies to task")
	}
	resGet := mockDbCon.FindOne(testTaskID, "tasks")
	if resGet == nil {
		t.Error("Error fetching task")
	}
	task := model.Task{}
	resGet.Decode(&task)
	//fmt.Println("Task dep length: ", len(task.NextTasks))
	if len(task.NextTasks) == 0 {
		t.Error("No dependencies")
	}
}
