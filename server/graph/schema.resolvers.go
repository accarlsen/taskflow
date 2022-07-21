package graph

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"time"

	"github.com/accarlsen/gqlgen-todos/auth"
	"github.com/accarlsen/gqlgen-todos/db"
	"github.com/accarlsen/gqlgen-todos/graph/generated"
	"github.com/accarlsen/gqlgen-todos/graph/model"
	helper "github.com/accarlsen/gqlgen-todos/helpers"
	"github.com/aws/aws-sdk-go/aws"
	jwt "github.com/dgrijalva/jwt-go"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (r *mutationResolver) UpdateTask(ctx context.Context, taskID string, input model.UpdateTask) (*model.Task, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied", userLoggedIn)
		return nil, nil
	}

	//Check authorization
	isAdmin := contex.Admin
	isOwner := contex.Owner

	resGet := databaseCon.FindOne(taskID, "tasks")
	taskCheck := model.Task{}
	resGet.Decode(&taskCheck)
	if isOwner != 1 {
		if isAdmin != 1 {
			if userLoggedIn != taskCheck.AuthorID {
				fmt.Println("Cannot update task, access denied")
				return nil, nil
			}
		}
	}

	var progress = 0
	if aws.StringValue(input.State) == "done" {
		progress = aws.IntValue(input.Weight)
	}

	if taskCheck.PhaseID != nil {

		//Get phase
		resGetP := databaseCon.FindOne(aws.StringValue(taskCheck.PhaseID), "phases")
		if resGetP == nil {
			fmt.Println("Error fetching phase while archiving Task")
			return nil, nil
		}
		phaseCheck := model.Phase{}
		resGetP.Decode(&phaseCheck)

		//Get project
		resGet := databaseCon.FindOne(phaseCheck.ProjectID, "projects")
		if resGet == nil {
			fmt.Println("Error fetching project while archiving Task")
			return nil, nil
		}
		projectCheck := model.Project{}
		resGet.Decode(&projectCheck)
		if isOwner != 1 {
			if isAdmin != 1 {
				if userLoggedIn != projectCheck.ProjectLeadID {
					fmt.Println("Access Denied")
					return nil, nil
				}
			}
		}

		//Update weight & progress from phase
		updatedPhase := databaseCon.UpdateStats(aws.StringValue(taskCheck.PhaseID), phaseCheck.Progress-aws.IntValue(taskCheck.Progress)+progress, phaseCheck.Weight-aws.IntValue(taskCheck.Weight)+aws.IntValue(input.Weight), "phases")
		if updatedPhase == nil {
			fmt.Println("Error while archiving task: Could not update Phase")
			return nil, nil
		}

		//Update weight & progress from project
		updatedProject := databaseCon.UpdateStats(phaseCheck.ProjectID, projectCheck.Progress-aws.IntValue(taskCheck.Progress)+progress, projectCheck.Weight-aws.IntValue(taskCheck.Weight)+aws.IntValue(input.Weight), "projects")
		if updatedProject == nil {
			fmt.Println("Error while archiving task: Could not update Project")
			return nil, nil
		}
	}

	updateTask := model.UpdateTask{
		Name:         input.Name,
		Description:  input.Description,
		AssignedID:   input.AssignedID,
		DeadlineTime: input.DeadlineTime,
		DeadlineDate: input.DeadlineDate,
		Weight:       input.Weight,
		Progress:     aws.Int(progress),
	}
	if len(taskCheck.Subtasks) == 0 {
		res := databaseCon.UpdateTask(taskID, updateTask, "tasks")
		if res == nil {
			return nil, nil
		}
	} else {
		res := databaseCon.UpdateTaskNoAssigned(taskID, updateTask, "tasks")
		if res == nil {
			return nil, nil
		}
	}
	task := model.Task{
		ID:           taskID,
		Name:         aws.StringValue(input.Name),
		Description:  input.Description,
		AssignedID:   input.AssignedID,
		DeadlineTime: aws.StringValue(input.DeadlineTime),
		DeadlineDate: aws.StringValue(input.DeadlineDate),
	}
	return &task, nil
}

func (r *mutationResolver) AssignTask(ctx context.Context, taskID string, email string) (*model.Task, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied", userLoggedIn)
		return nil, nil
	}
	resGet := databaseCon.FindByEmail(email)
	if resGet == nil {
		fmt.Println("Error getting user")
		return nil, nil
	}
	assignee := model.User{}
	resGet.Decode(&assignee)
	assigned := model.UpdateTask{
		AssignedID: aws.String(assignee.ID),
	}
	updatedTask := model.Task{
		ID:         taskID,
		AssignedID: aws.String(assignee.ID),
	}
	res := databaseCon.AssignTask(taskID, assigned)
	if res == nil {
		fmt.Println("Error updating task assignee")
		return nil, nil
	}
	fmt.Println("Modified count: ", res.ModifiedCount)
	return &updatedTask, nil
}

func (r *mutationResolver) AddTaskToPhase(ctx context.Context, taskID string, phaseID string) (*model.Task, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied", userLoggedIn)
		return nil, nil
	}
	res := databaseCon.ManageTaskPhase(taskID, phaseID)
	if res == nil {
		fmt.Println("Error adding task to phase")
		return nil, nil
	}
	task := model.Task{
		PhaseID: aws.String(phaseID),
	}
	fmt.Println("Documents modified:" + fmt.Sprint(res.ModifiedCount))
	return &task, nil
}

func (r *mutationResolver) RemoveTaskFromPhase(ctx context.Context, taskID string, phaseID string) (*model.Task, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied", userLoggedIn)
		return nil, nil
	}
	res := databaseCon.ManageTaskPhase(taskID, "")
	if res == nil {
		fmt.Println("Error removing task from phase")
		return nil, nil
	}
	task := model.Task{
		ID:      taskID,
		PhaseID: aws.String(""),
	}
	fmt.Println("Documents modified:" + fmt.Sprint(res.ModifiedCount))
	return &task, nil
}

func (r *mutationResolver) UpdateTaskState(ctx context.Context, taskID string, input model.UpdateTask) (*model.Task, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied", userLoggedIn)
		return nil, nil
	}

	//Get task & check if it exists
	task := databaseCon.FindOne(taskID, "tasks")
	var foundTask *model.Task
	errTask := task.Decode(&foundTask)
	if errTask != nil {
		log.Println(errTask)
		fmt.Println("Error while updating task state: Could not find Task")
		//return nil, nil
	}

	var deltaProgress = 0
	if aws.StringValue(input.State) == "done" && aws.StringValue(foundTask.State) != "done" {
		deltaProgress += aws.IntValue(foundTask.Weight)
	} else if aws.StringValue(input.State) != "done" && aws.StringValue(foundTask.State) == "done" {
		deltaProgress -= aws.IntValue(foundTask.Weight)
	} else {
		return nil, nil
	}

	var tasksInPar []*string = input.TasksInParallell
	allDone := true
	counter := 0
	for i := 0; i < len(tasksInPar); i++ {
		fmt.Println("TasksInPar:", aws.StringValue(tasksInPar[i]))
		if aws.StringValue(tasksInPar[i]) != "done" {
			counter = counter + 1
		}
	}
	if counter > 1 {
		allDone = false
	}
	fmt.Println("Done?", allDone)

	if foundTask.PhaseID != nil || aws.StringValue(foundTask.PhaseID) != "" {

		//Update weight in phase
		phase := databaseCon.FindOne(aws.StringValue(foundTask.PhaseID), "phases")
		if phase == nil {
			fmt.Println("Error while creating task: Could not find Phase")
			return nil, nil
		}
		var foundPhase *model.Phase
		errPhase := phase.Decode(&foundPhase)
		if errPhase != nil {
			log.Println(errPhase)
			fmt.Println("Error while creating task: Could not find Phase")
			//return nil, nil
		}
		updatedPhase := databaseCon.UpdateStats(aws.StringValue(foundTask.PhaseID), foundPhase.Progress+deltaProgress, foundPhase.Weight, "phases")
		if updatedPhase == nil {
			fmt.Println("Error while creating task: Could not update Phase")
			return nil, nil
		}

		//Update weight in projects
		project := databaseCon.FindOne(foundPhase.ProjectID, "projects")
		if project == nil {
			fmt.Println("Error while creating task: Could not find Project")
			return nil, nil
		}
		var foundProject *model.Project
		errProject := project.Decode(&foundProject)
		if errProject != nil {
			log.Println(errProject)
			fmt.Println("Error while creating task: Could not find decoded Project")
			//return nil, nil
		}
		updatedProject := databaseCon.UpdateStats(foundPhase.ProjectID, foundProject.Progress+deltaProgress, foundProject.Weight, "projects")
		if updatedProject == nil {
			fmt.Println("Error while creating task: Could not update Project")
			return nil, nil
		}
	}
	var ready bool = false
	var soonReady bool = false
	if aws.StringValue(input.State) != "done" {
		ready = true
	} else if aws.StringValue(input.State) == "done" {
		ready = false
	}
	fmt.Println("Setting task state, and ready bool is:", ready)
	res := databaseCon.SetTaskState(taskID, aws.StringValue(input.State), aws.IntValue(foundTask.Progress)+deltaProgress, ready)
	if res == nil {
		fmt.Println("Error updating task state")
		return nil, nil
	}

	if len(foundTask.NextTasks) != 0 {
		if aws.StringValue(input.State) == "done" && allDone {
			for i := 0; i < len(foundTask.NextTasks); i++ {
				ready = true
				soonReady = false
				fmt.Println("For task:", aws.StringValue(foundTask.NextTasks[i]), " with status:", ready, " for ready and:", soonReady)
				resReady := databaseCon.SetTaskSoonReady(aws.StringValue(foundTask.NextTasks[i]), ready, soonReady)
				if resReady == nil {
					fmt.Println("Error updating nexttasks of task to ready")
					return nil, nil
				}
				taskReady := model.Task{}
				resCheck := databaseCon.FindOne(aws.StringValue(foundTask.NextTasks[i]), "tasks")
				if resCheck == nil {
					fmt.Println("Error fetching the nexttasks of task: ", foundTask.Name)
					return nil, nil
				}
				resCheck.Decode(&taskReady)
				if len(taskReady.NextTasks) != 0 {
					ready = false
					soonReady = true
					for j := 0; j < len(taskReady.NextTasks); j++ {
						resSoonReady := databaseCon.SetTaskSoonReady(aws.StringValue(taskReady.NextTasks[j]), ready, soonReady)
						if resSoonReady == nil {
							fmt.Println("Error updating nexttasks of nexttasks of task")
							return nil, nil
						}
					}
				}
			}
		} else {
			for i := 0; i < len(foundTask.NextTasks); i++ {
				ready = false
				soonReady = true
				resReady := databaseCon.SetTaskSoonReady(aws.StringValue(foundTask.NextTasks[i]), ready, soonReady)
				if resReady == nil {
					fmt.Println("Error updating nexttasks of task to ready")
					return nil, nil
				}
				taskReady := model.Task{}
				resCheck := databaseCon.FindOne(aws.StringValue(foundTask.NextTasks[i]), "tasks")
				if resCheck == nil {
					fmt.Println("Error fetching the nexttasks of task: ", foundTask.Name)
					return nil, nil
				}
				resCheck.Decode(&taskReady)
				if len(taskReady.NextTasks) != 0 {
					ready = false
					soonReady = false
					for j := 0; j < len(taskReady.NextTasks); j++ {
						resSoonReady := databaseCon.SetTaskSoonReady(aws.StringValue(taskReady.NextTasks[j]), ready, soonReady)
						if resSoonReady == nil {
							fmt.Println("Error updating nexttasks of nexttasks of task")
							return nil, nil
						}
					}
				}
			}
		}
	}

	/*
		cur := databaseCon.FindAllSubtasksOfParent(taskID)
		defer cur.Close(ctx)
		if cur.RemainingBatchLength() != 0 {
			for cur.Next(ctx) {
				var foundParentTask *model.Subtask
				err := cur.Decode(&foundParentTask)
				if err != nil {
					fmt.Println("Error", err)
					return nil, nil
				}
				if (aws.StringValue(foundParentTask.State) != "done" && aws.StringValue(input.State) == "done") || (aws.StringValue(foundParentTask.State) == "done" && aws.StringValue(input.State) != "done") {
					resSub := databaseCon.SetSubtaskState(foundParentTask.ID, aws.StringValue(input.State), aws.IntValue(foundParentTask.Progress))
					if resSub == nil {
						fmt.Println("Error updating the subtasks in setTaskState()")
						return nil, nil
					}
				}
			}
		}*/
	taskRet := model.Task{
		ID:    taskID,
		State: input.State,
	}
	return &taskRet, nil
}

func (r *mutationResolver) CreateTask(ctx context.Context, input model.NewTask) (*model.Task, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}
	// Spilt timestamp
	dateNow := time.Now()
	timeNow := time.Now()

	if input.PhaseID != nil || aws.StringValue(input.PhaseID) != "" {
		//Update weight in phase
		phase := databaseCon.FindOne(aws.StringValue(input.PhaseID), "phases")
		var foundPhase *model.Phase
		errPhase := phase.Decode(&foundPhase)
		if errPhase != nil {
			log.Println(errPhase)
			fmt.Println("Error while creating task: Could not find Phase")
			//return nil, nil
		}
		updatedPhase := databaseCon.UpdateStats(aws.StringValue(input.PhaseID), foundPhase.Progress, foundPhase.Weight+aws.IntValue(input.Weight), "phases")
		if updatedPhase == nil {
			fmt.Println("Error while creating task: Could not update Phase")
			return nil, nil
		}

		//Update weight in projects
		project := databaseCon.FindOne(foundPhase.ProjectID, "projects")
		if project == nil {
			fmt.Println("Error while creating task: Could not find Project")
			return nil, nil
		}
		var foundProject *model.Project
		errProject := project.Decode(&foundProject)
		if errProject != nil {
			log.Println(errProject)
			fmt.Println("Error while creating task: Could not find decoded Project")
			//return nil, nil
		}
		updatedProject := databaseCon.UpdateStats(foundPhase.ProjectID, foundProject.Progress, foundProject.Weight+aws.IntValue(input.Weight), "projects")
		if updatedProject == nil {
			fmt.Println("Error while creating task: Could not update Project")
			return nil, nil
		}
	}
	var dependencies []*string

	newTask := model.NewTask{
		Name:         input.Name,
		Description:  input.Description,
		AuthorID:     userLoggedIn,
		AssignedID:   input.AssignedID,
		Progress:     aws.Int(0),
		Weight:       input.Weight,
		OrgID:        input.OrgID,
		PhaseID:      input.PhaseID,
		State:        aws.String(""),
		CreateDate:   aws.String(dateNow.Format("2006-01-02")),
		CreateTime:   aws.String(timeNow.Format("15:04:05")),
		DeadlineDate: input.DeadlineDate,
		DeadlineTime: input.DeadlineTime,
		Archived:     aws.Bool(false),
		NextTasks:    dependencies,
		SoonReady:    aws.Bool(false),
		Ready:        aws.Bool(true),
		FirstTask:    aws.Bool(true),
	}
	fmt.Println("Creating new task...")
	res := databaseCon.SaveTaskToDb(newTask, "tasks")
	return &model.Task{
		ID:           res.InsertedID.(primitive.ObjectID).Hex(),
		Name:         input.Name,
		Description:  input.Description,
		AuthorID:     userLoggedIn,
		AssignedID:   input.AssignedID,
		Progress:     aws.Int(0),
		Weight:       input.Weight,
		OrgID:        input.OrgID,
		PhaseID:      input.PhaseID,
		CreateDate:   dateNow.Format("2006-01-02"),
		CreateTime:   timeNow.Format("15:04:05"),
		DeadlineDate: input.DeadlineDate,
		DeadlineTime: input.DeadlineTime,
		Archived:     false,
		NextTasks:    dependencies,
		SoonReady:    aws.Bool(false),
		Ready:        aws.Bool(true),
		FirstTask:    aws.Bool(true),
	}, nil
}

func (r *mutationResolver) DeleteTask(ctx context.Context, taskID string) (*model.Task, error) {
	fmt.Println("Deleting a task...")
	res := databaseCon.DeleteOne(taskID, "tasks")
	fmt.Println("Documents affected: " + fmt.Sprint(res.DeletedCount))
	task := model.Task{ID: taskID}
	return &task, nil
}

func (r *mutationResolver) ArchiveTask(ctx context.Context, taskID string, archived bool) (*model.Task, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}

	//Find Task
	resCheck := databaseCon.FindOne(taskID, "tasks")
	if resCheck == nil {
		fmt.Println("Error getting task")
		return nil, nil
	}
	taskCheck := model.Task{}
	resCheck.Decode(&taskCheck)
	if userLoggedIn != taskCheck.AuthorID {
		fmt.Println("Access denied, not the author")
		return nil, nil
	}

	if taskCheck.PhaseID != nil {

		//Get phase
		resGetP := databaseCon.FindOne(aws.StringValue(taskCheck.PhaseID), "phases")
		if resGetP == nil {
			fmt.Println("Error fetching phase while archiving Task")
			return nil, nil
		}
		phaseCheck := model.Phase{}
		resGetP.Decode(&phaseCheck)

		//Get project
		resGet := databaseCon.FindOne(phaseCheck.ProjectID, "projects")
		if resGet == nil {
			fmt.Println("Error fetching project while archiving Task")
			return nil, nil
		}
		projectCheck := model.Project{}
		resGet.Decode(&projectCheck)

		//Check authorization
		isAdmin := contex.Admin
		isOwner := contex.Owner
		if isOwner != 1 {
			if isAdmin != 1 {
				if userLoggedIn != projectCheck.ProjectLeadID {
					fmt.Println("Access Denied")
					return nil, nil
				}
			}
		}

		//Remove weight & progress from phase
		updatedPhase := databaseCon.UpdateStats(aws.StringValue(taskCheck.PhaseID), phaseCheck.Progress-aws.IntValue(taskCheck.Progress), phaseCheck.Weight-aws.IntValue(taskCheck.Weight), "phases")
		if updatedPhase == nil {
			fmt.Println("Error while archiving task: Could not update Phase")
			return nil, nil
		}

		//Remove weight & progress from project
		updatedProject := databaseCon.UpdateStats(phaseCheck.ProjectID, projectCheck.Progress-aws.IntValue(taskCheck.Progress), projectCheck.Weight-aws.IntValue(taskCheck.Weight), "projects")
		if updatedProject == nil {
			fmt.Println("Error while archiving task: Could not update Project")
			return nil, nil
		}
	}

	//Archive Task
	res := databaseCon.ArchiveTask(taskID, "tasks", archived)
	if res == nil {
		fmt.Println("Error archiving task")
		return nil, nil
	}
	task := model.Task{
		ID:       taskID,
		Archived: archived,
	}
	return &task, nil
}

func (r *mutationResolver) UpdateTaskDep(ctx context.Context, taskID string, input model.UpdateTask) (*model.Task, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}

	resGet := databaseCon.FindOne(taskID, "tasks")

	if resGet == nil {
		fmt.Println("Error fetching tasks")
		return nil, nil
	}
	task := model.Task{}
	resGet.Decode(&task)
	fmt.Println("task name...", task.Name)
	var dependencies []*string = task.NextTasks
	ok := true
	index := 0
	for i := 0; i < len(dependencies); i++ {
		if dependencies[i] == input.NextTasks[0] {
			ok = false
			index = i
			break
		}
	}
	if !ok {
		dependencies = helper.RemoveIndexPointerArr(dependencies, index)
	}
	if ok {
		dependencies = append(dependencies, input.NextTasks[0])
		ok = false
	}
	newDep := model.UpdateTask{
		NextTasks: dependencies,
		FirstTask: input.FirstTask,
	}
	res := databaseCon.AddDepToTask(taskID, newDep)
	if res == nil {
		fmt.Println("Error updating dependencies")
		return nil, nil
	}

	if len(dependencies) != 0 && aws.BoolValue(input.FirstTask) == true {
		fmt.Println("inside 1. if")
		resFirstReady := databaseCon.SetTaskSoonReady(taskID, true, false)
		if resFirstReady == nil {
			fmt.Println("Error updaing firsttask ready / soonReady")
			return nil, nil
		}
		resSetFirst := databaseCon.SetFirstTask(taskID, true)
		if resSetFirst == nil {
			return nil, nil
		}
		for i := 0; i < len(dependencies); i++ {
			resReady := databaseCon.SetTaskSoonReady(aws.StringValue(dependencies[i]), false, true)
			if resReady == nil {
				return nil, nil
			}
			newFirst := false
			resSetFirst := databaseCon.SetFirstTask(aws.StringValue(dependencies[i]), newFirst)
			if resSetFirst == nil {
				return nil, nil
			}
		}
	} else {
		fmt.Println("inside 2. if")
		resSetFirst := databaseCon.SetFirstTask(taskID, false)
		if resSetFirst == nil {
			return nil, nil
		}
		for i := 0; i < len(dependencies); i++ {
			resReady := databaseCon.SetTaskSoonReady(aws.StringValue(dependencies[i]), false, false)
			if resReady == nil {
				return nil, nil
			}
			newFirst := false
			resSetFirst := databaseCon.SetFirstTask(aws.StringValue(dependencies[i]), newFirst)
			if resSetFirst == nil {
				return nil, nil
			}
		}
	}

	if aws.BoolValue(input.FirstTask) == true {
		fmt.Println("inside 3. if")
		resSetReady := databaseCon.SetTaskSoonReady(taskID, true, false)
		if resSetReady == nil {
			return nil, nil
		}
		resSetFirst := databaseCon.SetFirstTask(taskID, true)
		if resSetFirst == nil {
			return nil, nil
		}
	}

	updatedDep := model.Task{
		ID:          taskID,
		Name:        task.Name,
		Description: task.Description,
		NextTasks:   dependencies,
	}
	return &updatedDep, nil
}

func (r *mutationResolver) RemoveTaskDep(ctx context.Context, taskID string, input model.UpdateTask) (*model.Task, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}

	taskTargets := input.NextTasks
	var currentTarget string
	if len(taskTargets) == 1 {
		currentTarget = aws.StringValue(taskTargets[0])
	} else {
		currentTarget = ""
	}
	fmt.Println("Target::", currentTarget)

	resGet := databaseCon.FindOne(taskID, "tasks")
	if resGet == nil {
		fmt.Println("Error fetching tasks")
		return nil, nil
	}
	task := model.Task{}
	resGet.Decode(&task)
	var dependencies []*string = task.NextTasks
	index := -1
	minusOne := -1

	for i := 0; i < len(dependencies); i++ {
		if aws.StringValue(dependencies[i]) == aws.StringValue(input.NextTasks[0]) {
			index = i
		}
	}

	if index != minusOne {
		dependencies = helper.RemoveIndexPointerArr(dependencies, index)
	}
	if currentTarget != "" {
		resSetFirst := databaseCon.SetFirstTask(currentTarget, true)
		if resSetFirst == nil {
			return nil, nil
		}
		resSetReady := databaseCon.SetTaskSoonReady(currentTarget, true, false)
		if resSetReady == nil {
			return nil, nil
		}
	} else {
		fmt.Println("Do smthing else")
	}

	newDep := model.UpdateTask{
		NextTasks: dependencies,
	}
	res := databaseCon.RemoveDepToTask(taskID, newDep)
	if res == nil {
		fmt.Println("Error updating dependencies")
		return nil, nil
	}
	updatedDep := model.Task{
		ID:          taskID,
		Name:        task.Name,
		Description: task.Description,
		NextTasks:   dependencies,
	}
	return &updatedDep, nil
}

func (r *mutationResolver) NewSubTask(ctx context.Context, taskID string, input model.NewSubtask) (*model.Subtask, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}

	if taskID == "" {
		fmt.Println("Subtask not pointing to parent task")
		return nil, nil
	}

	//Update weight in parent task

	//Check if parent task already has subtasks
	subtasksOfParent := databaseCon.FindAllSubtasksOfParent(taskID)
	var numSubtasksOfParent = 0
	for subtasksOfParent.Next(ctx) {
		numSubtasksOfParent++
	}

	task := databaseCon.FindOne(taskID, "tasks")
	var foundTask *model.Task
	errTask := task.Decode(&foundTask)
	if errTask != nil {
		log.Println(errTask)
		fmt.Println("Error while creating subtask: Could not find parent Task")
		//return nil, nil
	}

	var removableWeightFromTask = 0
	var removableProgressFromTask = 0
	if numSubtasksOfParent == 0 {
		removableWeightFromTask = aws.IntValue(foundTask.Weight)
		removableProgressFromTask = aws.IntValue(foundTask.Progress)
	}

	updatedTask := databaseCon.UpdateStats(taskID, aws.IntValue(foundTask.Progress)-removableProgressFromTask, aws.IntValue(foundTask.Weight)+aws.IntValue(input.Weight)-removableWeightFromTask, "tasks")
	if updatedTask == nil {
		fmt.Println("Error while creating subtask: Could not update parent Task")
		return nil, nil
	}

	if aws.StringValue(foundTask.State) == "done" {
		resSetTaskState := databaseCon.SetTaskState(taskID, "todo", aws.IntValue(foundTask.Progress)-removableProgressFromTask, true)
		if resSetTaskState == nil {
			fmt.Println("Error updating task state")
			return nil, nil
		}
	}

	if foundTask.PhaseID != nil || aws.StringValue(foundTask.PhaseID) != "" {
		//Update weight in phase
		phase := databaseCon.FindOne(aws.StringValue(foundTask.PhaseID), "phases")
		var foundPhase *model.Phase
		errPhase := phase.Decode(&foundPhase)
		if errPhase != nil {
			log.Println(errPhase)
			fmt.Println("Error while creating subtask: Could not find Phase")
			//return nil, nil
		}
		updatedPhase := databaseCon.UpdateStats(aws.StringValue(foundTask.PhaseID), foundPhase.Progress-removableProgressFromTask, foundPhase.Weight+aws.IntValue(input.Weight)-removableWeightFromTask, "phases")
		if updatedPhase == nil {
			fmt.Println("Error while creating subtask: Could not update Phase")
			return nil, nil
		}

		//Update weight in projects
		project := databaseCon.FindOne(foundPhase.ProjectID, "projects")
		if project == nil {
			fmt.Println("Error while creating subtask: Could not find Project")
			return nil, nil
		}
		var foundProject *model.Project
		errProject := project.Decode(&foundProject)
		if errProject != nil {
			log.Println(errProject)
			fmt.Println("Error while creating subtask: Could not find decoded Project")
			//return nil, nil
		}
		updatedProject := databaseCon.UpdateStats(foundPhase.ProjectID, foundProject.Progress-removableProgressFromTask, foundProject.Weight+aws.IntValue(input.Weight)-removableWeightFromTask, "projects")
		if updatedProject == nil {
			fmt.Println("Error while creating subtask: Could not update Project")
			return nil, nil
		}
	}

	// Spilt timestamp
	dateNow := time.Now().Format("2006-01-24")
	timeNow := time.Now().Format("15:04:05")

	var subtaskAssignees []string
	var subtaskDeadlineDates []string
	if foundTask.SubtaskDeadlines == nil || len(foundTask.SubtaskDeadlines) == 0 {
		subtaskDeadlineDates = append(subtaskDeadlineDates, aws.StringValue(input.DeadlineDate))
	}
	if foundTask.SubtaskAssignees == nil || len(foundTask.SubtaskAssignees) == 0 {
		subtaskAssignees = append(subtaskAssignees, aws.StringValue(input.AssignedID))
		res := databaseCon.UpdateParentAssigned(taskID, subtaskAssignees, subtaskDeadlineDates, "tasks")
		if res == nil {
			return nil, nil
		}
	} else {
		for i := 0; i < len(foundTask.SubtaskAssignees); i++ {
			if aws.StringValue(foundTask.SubtaskAssignees[i]) != aws.StringValue(input.AssignedID) {
				foundTask.SubtaskAssignees = append(foundTask.SubtaskAssignees, input.AssignedID)
				break
			}
		}
		if foundTask.SubtaskDeadlines != nil {
			foundTask.SubtaskDeadlines = append(foundTask.SubtaskDeadlines, input.DeadlineDate)
		}
		res := databaseCon.UpdateParentAssigned(taskID, aws.StringValueSlice(foundTask.SubtaskAssignees), aws.StringValueSlice(foundTask.SubtaskDeadlines), "tasks")
		if res == nil {
			return nil, nil
		}
	}

	newSubtask := model.NewSubtask{
		Name:         input.Name,
		Description:  input.Description,
		AuthorID:     userLoggedIn,
		OrgID:        input.OrgID,
		PhaseID:      input.PhaseID,
		ParentID:     aws.String(taskID),
		AssignedID:   input.AssignedID,
		State:        aws.String(""),
		Progress:     aws.Int(0),
		Weight:       input.Weight,
		CreateDate:   aws.String(dateNow),
		CreateTime:   aws.String(timeNow),
		DeadlineDate: input.DeadlineDate,
		DeadlineTime: input.DeadlineTime,
		Archived:     aws.Bool(false),
	}
	fmt.Println("Creating new task...")
	res := databaseCon.SaveSubtaskToDb(newSubtask, "subtasks")
	return &model.Subtask{
		ID:           res.InsertedID.(primitive.ObjectID).Hex(),
		Name:         aws.StringValue(input.Name),
		Description:  input.Description,
		AuthorID:     aws.String(userLoggedIn),
		AssignedID:   input.AssignedID,
		Progress:     aws.Int(0),
		Weight:       input.Weight,
		OrgID:        input.OrgID,
		PhaseID:      input.PhaseID,
		CreateDate:   dateNow,
		CreateTime:   timeNow,
		ParentID:     taskID,
		DeadlineDate: aws.StringValue(input.DeadlineDate),
		DeadlineTime: aws.StringValue(input.DeadlineTime),
		Archived:     false,
	}, nil
}

func (r *mutationResolver) UpdateSubTask(ctx context.Context, subtaskID string, input model.UpdateSubtask) (*model.Subtask, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied", userLoggedIn)
		return nil, nil
	}

	resGetS := databaseCon.FindOne(subtaskID, "subtasks")
	subtaskCheck := model.Subtask{}
	resGetS.Decode(&subtaskCheck)
	isAdmin := contex.Admin
	isOwner := contex.Owner
	if isOwner != 1 {
		if isAdmin != 1 {
			if userLoggedIn != aws.StringValue(subtaskCheck.AuthorID) {
				fmt.Println("Cannot update task, access denied")
				return nil, nil
			}
		}
	}

	resGetT := databaseCon.FindOne(subtaskCheck.ParentID, "tasks")
	taskCheck := model.Task{}
	resGetT.Decode(&taskCheck)

	var progress = 0
	if aws.StringValue(input.State) == "done" {
		progress = aws.IntValue(input.Weight)
	}

	updatedTask := databaseCon.UpdateStats(subtaskCheck.ParentID, aws.IntValue(taskCheck.Progress)-aws.IntValue(subtaskCheck.Progress)+progress, aws.IntValue(taskCheck.Weight)-aws.IntValue(subtaskCheck.Weight)+aws.IntValue(input.Weight), "tasks")
	if updatedTask == nil {
		fmt.Println("Error while updating Subtask: Could not update ParentTask")
		return nil, nil
	}

	//TODO update progress & weight in: parentTask, Phase & Project

	if taskCheck.PhaseID != nil {

		//Get phase
		resGetP := databaseCon.FindOne(aws.StringValue(taskCheck.PhaseID), "phases")
		if resGetP == nil {
			fmt.Println("Error fetching phase while updating Task")
			return nil, nil
		}
		phaseCheck := model.Phase{}
		resGetP.Decode(&phaseCheck)

		//Get project
		resGet := databaseCon.FindOne(phaseCheck.ProjectID, "projects")
		if resGet == nil {
			fmt.Println("Error fetching project while updating Task")
			return nil, nil
		}
		projectCheck := model.Project{}
		resGet.Decode(&projectCheck)

		//Check authorization
		if isOwner != 1 {
			if isAdmin != 1 {
				if userLoggedIn != projectCheck.ProjectLeadID {
					fmt.Println("Access Denied")
					return nil, nil
				}
			}
		}

		//Update weight & progress from phase
		updatedPhase := databaseCon.UpdateStats(aws.StringValue(taskCheck.PhaseID), phaseCheck.Progress-aws.IntValue(subtaskCheck.Progress)+progress, phaseCheck.Weight-aws.IntValue(subtaskCheck.Weight)+aws.IntValue(input.Weight), "phases")
		if updatedPhase == nil {
			fmt.Println("Error while updating task: Could not update Phase")
			return nil, nil
		}

		//Update weight & progress from project
		updatedProject := databaseCon.UpdateStats(phaseCheck.ProjectID, projectCheck.Progress-aws.IntValue(subtaskCheck.Progress)+progress, projectCheck.Weight-aws.IntValue(subtaskCheck.Weight)+aws.IntValue(input.Weight), "projects")
		if updatedProject == nil {
			fmt.Println("Error while updating task: Could not update Project")
			return nil, nil
		}
	}

	currentDeadlines := aws.StringValueSlice(taskCheck.SubtaskDeadlines)
	currentAssignees := aws.StringValueSlice(taskCheck.SubtaskAssignees)

	if aws.StringValue(input.DeadlineDate) != "" && aws.StringValue(input.DeadlineDate) != subtaskCheck.DeadlineDate && currentDeadlines != nil && len(currentDeadlines) != 0 {
		fmt.Println("CHANGE THE DEADLINES")
		for i := 0; i < len(currentDeadlines); i++ {
			if currentDeadlines[i] == subtaskCheck.DeadlineDate {
				currentDeadlines = helper.RemoveIndex(currentDeadlines, i)
				break
			}
		}
		currentDeadlines = append(currentDeadlines, aws.StringValue(input.DeadlineDate))
	}

	// Add call to set parent subtaskAssignee
	if aws.StringValue(input.AssignedID) != "" && aws.StringValue(input.AssignedID) != aws.StringValue(subtaskCheck.AssignedID) {
		fmt.Println("We inside")
		for i := 0; i < len(currentAssignees); i++ {
			if currentAssignees[i] == aws.StringValue(subtaskCheck.AssignedID) {
				currentAssignees = helper.RemoveIndex(currentAssignees, i)
				break
			}
		}
		currentAssignees = append(currentAssignees, aws.StringValue(input.AssignedID))
	}

	fmt.Println("Current assignees:", currentAssignees)
	fmt.Println("Current deadlines:", currentDeadlines)

	resParent := databaseCon.UpdateParentAssigned(taskCheck.ID, currentAssignees, currentDeadlines, "tasks")
	if resParent == nil {
		return nil, nil
	}

	updateSubtask := model.UpdateSubtask{
		Name:         input.Name,
		Description:  input.Description,
		AssignedID:   input.AssignedID,
		DeadlineTime: input.DeadlineTime,
		DeadlineDate: input.DeadlineDate,
		Weight:       input.Weight,
		Progress:     aws.Int(progress),
	}

	res := databaseCon.UpdateSubtask(subtaskID, updateSubtask, "subtasks")
	if res == nil {
		fmt.Println("Error updating subtask")
		return nil, nil
	}
	task := model.Subtask{
		ID:           subtaskID,
		Name:         aws.StringValue(input.Name),
		Description:  input.Description,
		AssignedID:   input.AssignedID,
		DeadlineTime: aws.StringValue(input.DeadlineTime),
		DeadlineDate: aws.StringValue(input.DeadlineDate),
	}
	return &task, nil
}

func (r *mutationResolver) ArchiveSubtask(ctx context.Context, subtaskID string, input model.UpdateSubtask) (*model.Subtask, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}

	//Find Subtask
	resCheckS := databaseCon.FindOne(subtaskID, "subtasks")
	if resCheckS == nil {
		fmt.Println("Error getting task")
		return nil, nil
	}
	subtaskCheck := model.Subtask{}
	resCheckS.Decode(&subtaskCheck)
	if userLoggedIn != aws.StringValue(subtaskCheck.AuthorID) {
		fmt.Println("Access denied, not the author")
		return nil, nil
	}

	//Find Task
	resCheck := databaseCon.FindOne(subtaskCheck.ParentID, "tasks")
	if resCheck == nil {
		fmt.Println("Error getting task")
		return nil, nil
	}
	taskCheck := model.Task{}
	resCheck.Decode(&taskCheck)
	if userLoggedIn != taskCheck.AuthorID {
		fmt.Println("Access denied, not the author")
		return nil, nil
	}

	//Update weight & progress in Task
	updatedTask := databaseCon.UpdateStats(subtaskCheck.ParentID, aws.IntValue(taskCheck.Progress)-aws.IntValue(subtaskCheck.Progress), aws.IntValue(taskCheck.Weight)-aws.IntValue(subtaskCheck.Weight), "tasks")
	if updatedTask == nil {
		fmt.Println("Error while archiving Subtask: Could not update Phase")
		return nil, nil
	}

	if taskCheck.PhaseID != nil {

		//Get phase
		resGetP := databaseCon.FindOne(aws.StringValue(taskCheck.PhaseID), "phases")
		if resGetP == nil {
			fmt.Println("Error fetching phase while archiving SubTask")
			return nil, nil
		}
		phaseCheck := model.Phase{}
		resGetP.Decode(&phaseCheck)

		//Get project
		resGet := databaseCon.FindOne(phaseCheck.ProjectID, "projects")
		if resGet == nil {
			fmt.Println("Error fetching project while archiving SubTask")
			return nil, nil
		}
		projectCheck := model.Project{}
		resGet.Decode(&projectCheck)

		//Check authorization
		isAdmin := contex.Admin
		isOwner := contex.Owner
		if isOwner != 1 {
			if isAdmin != 1 {
				if userLoggedIn != projectCheck.ProjectLeadID {
					fmt.Println("Access Denied")
					return nil, nil
				}
			}
		}

		//Remove weight & progress from phase
		updatedPhase := databaseCon.UpdateStats(aws.StringValue(taskCheck.PhaseID), phaseCheck.Progress-aws.IntValue(subtaskCheck.Progress), phaseCheck.Weight-aws.IntValue(subtaskCheck.Weight), "phases")
		if updatedPhase == nil {
			fmt.Println("Error while archiving subtask: Could not update Phase")
			return nil, nil
		}

		//Remove weight & progress from project
		updatedProject := databaseCon.UpdateStats(phaseCheck.ProjectID, projectCheck.Progress-aws.IntValue(subtaskCheck.Progress), projectCheck.Weight-aws.IntValue(subtaskCheck.Weight), "projects")
		if updatedProject == nil {
			fmt.Println("Error while archiving subtask: Could not update Project")
			return nil, nil
		}
	}

	var assigneesParent []string = aws.StringValueSlice(taskCheck.SubtaskAssignees)
	var deadlinesParent []string = aws.StringValueSlice(taskCheck.SubtaskDeadlines)

	//Remove the assignee from the subtaskAssignees array
	for i := 0; i < len(assigneesParent); i++ {
		if assigneesParent[i] == aws.StringValue(subtaskCheck.AssignedID) {
			assigneesParent = helper.RemoveIndex(assigneesParent, i)
		}
	}

	for i := 0; i < len(deadlinesParent); i++ {
		if deadlinesParent[i] == subtaskCheck.DeadlineDate {
			deadlinesParent = helper.RemoveIndex(deadlinesParent, i)
		}
	}

	resUpdateAssignedParent := databaseCon.UpdateParentAssigned(taskCheck.ID, assigneesParent, deadlinesParent, "tasks")
	if resUpdateAssignedParent == nil {
		return nil, nil
	}

	//Archive Subtask
	res := databaseCon.ArchiveTask(subtaskID, "subtasks", aws.BoolValue(input.Archived))
	if res == nil {
		return nil, nil
	}
	task := model.Subtask{
		ID:       subtaskID,
		Archived: aws.BoolValue(input.Archived),
	}
	return &task, nil
}

func (r *mutationResolver) SetSubtaskState(ctx context.Context, subtaskID string, input model.UpdateSubtask) (*model.Subtask, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied", userLoggedIn)
		return nil, nil
	}

	var tasksInPar []string = aws.StringValueSlice(input.TasksInParallell)

	//Get subtask & check if it exists
	subtask := databaseCon.FindOne(subtaskID, "subtasks")
	var foundSubtask *model.Subtask
	errSubtask := subtask.Decode(&foundSubtask)
	if errSubtask != nil {
		log.Println(errSubtask)
		fmt.Println("Error while updating task state: Could not find Task")
		//return nil, nil
	}

	var deltaProgress = 0
	if aws.StringValue(input.State) == "done" && aws.StringValue(foundSubtask.State) != "done" {
		deltaProgress += aws.IntValue(foundSubtask.Weight)
	} else if aws.StringValue(input.State) != "done" && aws.StringValue(foundSubtask.State) == "done" {
		deltaProgress -= aws.IntValue(foundSubtask.Weight)
	} else {
		return nil, nil
	}

	//Get parent task & check if it exists
	task := databaseCon.FindOne(foundSubtask.ParentID, "tasks")
	var foundTask *model.Task
	errTask := task.Decode(&foundTask)
	if errTask != nil {
		log.Println(errTask)
		fmt.Println("Error while updating subtask state: Could not find Task")
		//return nil, nil
	}

	if foundTask.PhaseID != nil || aws.StringValue(foundTask.PhaseID) != "" {

		//Update weight in phase
		phase := databaseCon.FindOne(aws.StringValue(foundTask.PhaseID), "phases")
		var foundPhase *model.Phase
		errPhase := phase.Decode(&foundPhase)
		if errPhase != nil {
			log.Println(errPhase)
			fmt.Println("Error while updating subtask state: Could not find Phase")
			//return nil, nil
		}
		updatedPhase := databaseCon.UpdateStats(aws.StringValue(foundTask.PhaseID), foundPhase.Progress+deltaProgress, foundPhase.Weight, "phases")
		if updatedPhase == nil {
			fmt.Println("Error while updating subtask state: Could not update Phase")
			return nil, nil
		}

		//Update weight in projects
		project := databaseCon.FindOne(foundPhase.ProjectID, "projects")
		if project == nil {
			fmt.Println("Error while updating subtask state: Could not find Project")
			return nil, nil
		}
		var foundProject *model.Project
		errProject := project.Decode(&foundProject)
		if errProject != nil {
			log.Println(errProject)
			fmt.Println("Error while updating subtask state: Could not find decoded Project")
			//return nil, nil
		}
		updatedProject := databaseCon.UpdateStats(foundPhase.ProjectID, foundProject.Progress+deltaProgress, foundProject.Weight, "projects")
		if updatedProject == nil {
			fmt.Println("Error while updating subtask state: Could not update Project")
			return nil, nil
		}
	}

	res := databaseCon.SetSubtaskState(subtaskID, aws.StringValue(input.State), aws.IntValue(foundSubtask.Progress)+deltaProgress)
	if res == nil {
		fmt.Println("Error updating task state")
		return nil, nil
	}

	cur := databaseCon.FindAllSubtasksOfParent(foundSubtask.ParentID)
	defer cur.Close(ctx)
	allDone := true
	for i := 0; i < len(tasksInPar); i++ {
		resTask := databaseCon.FindOne(tasksInPar[i], "tasks")
		if resTask == nil {
			return nil, nil
		}
		foundTask := model.Task{}
		resTask.Decode(&foundTask)
		if aws.StringValue(foundTask.State) != "done" {
			allDone = false
			break
		}
	}
	fmt.Println("Done?", allDone)
	if cur.RemainingBatchLength() != 0 {
		ok := true
		for cur.Next(ctx) {
			var foundTask *model.Subtask
			err := cur.Decode(&foundTask)
			if err != nil {
				fmt.Println("Error", err)
				return nil, nil
			}
			if aws.StringValue(foundTask.State) != "done" {
				ok = false
			}
		}
		if ok {
			resParent := databaseCon.SetTaskState(foundSubtask.ParentID, aws.StringValue(input.State), aws.IntValue(foundTask.Progress)+deltaProgress, false)
			if resParent == nil {
				fmt.Println("Error updating parent task based on subtasks")
				return nil, nil
			}
			if allDone {
				for i := 0; i < len(foundTask.NextTasks); i++ {
					ready := true
					soonReady := false
					resReady := databaseCon.SetTaskSoonReady(aws.StringValue(foundTask.NextTasks[i]), ready, soonReady)
					if resReady == nil {
						fmt.Println("Error updating nexttasks of task to ready")
						return nil, nil
					}
				}
			}
		} else {
			resParent := databaseCon.SetTaskState(foundSubtask.ParentID, "todo", aws.IntValue(foundTask.Progress)+deltaProgress, true)
			if resParent == nil {
				fmt.Println("Error updating parent task based on subtasks")
				return nil, nil
			}
			for i := 0; i < len(foundTask.NextTasks); i++ {
				ready := false
				soonReady := true
				resReady := databaseCon.SetTaskSoonReady(aws.StringValue(foundTask.NextTasks[i]), ready, soonReady)
				if resReady == nil {
					fmt.Println("Error updating nexttasks of task to ready")
					return nil, nil
				}
			}
		}
	}
	return foundSubtask, nil
}

func (r *mutationResolver) UpdateUser(ctx context.Context, userID string, input model.NewUser) (*model.User, error) {
	fmt.Println("Updating a user...")
	res := databaseCon.UpdateUser(userID, input, "users")
	user := model.User{
		ID:    userID,
		Fname: input.Fname,
		Email: input.Email,
	}
	fmt.Println("User with id: " + userID + " with status: Documents modified:" + fmt.Sprint(res.ModifiedCount))
	return &user, nil
}

func (r *mutationResolver) CreateUser(ctx context.Context, input model.NewUser) (*model.User, error) {
	fmt.Println("Creating a user...")
	res := databaseCon.SaveUserToDb(input, "users")
	user := model.User{
		ID:    res.InsertedID.(primitive.ObjectID).Hex(),
		GID:   input.GID,
		Fname: input.Fname,
		Email: input.Email,
		Lname: input.Lname,
		Image: input.Image,
	}
	fmt.Println("User created:\nName: " + input.Fname + "\nEmail: " + input.Email)
	return &user, nil
}

func (r *mutationResolver) DeleteUser(ctx context.Context, userID string) (*model.User, error) {
	fmt.Println("Deleting a user...")
	res := databaseCon.DeleteOne(userID, "users")
	fmt.Println("Documents affected: " + fmt.Sprint(res.DeletedCount))
	user := model.User{ID: userID}
	return &user, nil
}

func (r *mutationResolver) SetClaims(ctx context.Context, orgID string) (*model.AuthToken, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}
	res := databaseCon.FindOne(orgID, "organizations")
	if res == nil {
		fmt.Println("failed to fetch organiztion")
		return nil, nil
	}
	org := model.Organization{}
	res.Decode(&org)
	owner := 0
	admin := 0
	if org.OwnerID == userLoggedIn {
		owner = 1
	}
	for i := 0; i < len(org.AdminsID); i++ {
		if org.AdminsID[i] == userLoggedIn {
			admin = 1
			break
		}
	}
	accessToken := jwt.New(jwt.SigningMethodHS256)
	claimsA := accessToken.Claims.(jwt.MapClaims)
	claimsA["userID"] = userLoggedIn
	claimsA["tokenExpiration"] = time.Now().Add(time.Minute * 60).Unix()
	claimsA["owner"] = owner
	claimsA["admin"] = admin
	accessTokenString, err := accessToken.SignedString(SecretKey)
	if err != nil {
		log.Println("Error in Generating access token")
	}

	//Generate refresh token
	refreshToken := jwt.New(jwt.SigningMethodHS256)
	claimsR := refreshToken.Claims.(jwt.MapClaims)
	claimsR["tokenExpiration"] = time.Now().Add(time.Hour * 72).Unix()
	claimsR["userID"] = userLoggedIn
	refreshTokenString, err := refreshToken.SignedString(SecretKey2)
	if err != nil {
		log.Println("Error in Generating refresh token")
	}
	contex.Write(accessTokenString, refreshTokenString, 86400)
	return &model.AuthToken{
		AccessToken:  accessTokenString,
		RefreshToken: refreshTokenString,
	}, nil
}

func (r *mutationResolver) UpdateOrganization(ctx context.Context, orgID string, input model.EditOrg) (*model.Organization, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	fmt.Println("User i update org: ", userLoggedIn)
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}
	isOwner := contex.Owner
	if isOwner == 0 {
		fmt.Println("Only owner can update orgs")
		return nil, nil
	}
	resOrg := databaseCon.FindOne(orgID, "organizations")
	org := model.Organization{}
	resOrg.Decode(&org)
	newOrg := model.EditOrg{
		Name:        input.Name,
		Description: input.Description,
	}
	resUpdate := databaseCon.UpdateOrg(orgID, newOrg, "organizations")
	if resUpdate == nil {
		fmt.Println("Error in response the org")
	}
	if resUpdate.ModifiedCount == 0 {
		fmt.Println("Org not updated")
	}
	return &org, nil
}

func (r *mutationResolver) AddMember(ctx context.Context, orgID string, email string) (*model.Organization, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}
	isOwner := contex.Owner
	isAdmin := contex.Admin
	if isOwner == 0 {
		if isAdmin == 0 {
			fmt.Println("Access denied")
			return nil, nil
		}
	}
	resOrg := databaseCon.FindOne(orgID, "organizations")
	org := model.Organization{}
	resOrg.Decode(&org)
	resUser := databaseCon.FindByEmail(email)
	if resUser == nil {
		fmt.Println("No user with this is exists")
		return nil, nil
	}
	user := model.User{}
	errUser := resUser.Decode(&user)
	if errUser != nil {
		return nil, nil
	}
	userID := user.ID
	var members []string = org.MembersID
	var admins []string = org.AdminsID
	for i := 0; i < len(members); i++ {
		if members[i] == userID {
			fmt.Println("User is allready a member of org")
			sameMembers := model.Organization{
				ID:          orgID,
				Name:        org.Name,
				Description: org.Description,
				MembersID:   members,
				AdminsID:    admins,
				NumMembers:  0,
			}
			return &sameMembers, nil
		}
	}
	members = append(members, userID)
	newMembers := model.Organization{
		ID:          orgID,
		Name:        org.Name,
		Description: org.Description,
		MembersID:   members,
		AdminsID:    admins,
		NumMembers:  len(members),
	}
	res := databaseCon.ManageOrgMembers(orgID, newMembers, "organizations")
	fmt.Println("Modified Count:", res.ModifiedCount)
	fmt.Println("Org data: " + fmt.Sprint(newMembers.ID) + ", Members: " + fmt.Sprint(newMembers.NumMembers))
	return &newMembers, nil
}

func (r *mutationResolver) RemoveMember(ctx context.Context, orgID string, email string) (*model.Organization, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}
	// Check for auth in org
	isOwner := contex.Owner
	isAdmin := contex.Admin
	if isOwner == 0 {
		if isAdmin == 0 {
			fmt.Println("Access denied")
			return nil, nil
		}
	}
	// Get the org
	resOrg := databaseCon.FindOne(orgID, "organizations")
	if resOrg == nil {
		fmt.Println("Org not found, error in res")
		return nil, nil
	}
	org := model.Organization{}
	resOrg.Decode(&org)
	// Get the user
	resUser := databaseCon.FindByEmail(email)
	if resUser == nil {
		fmt.Println("No user with this email exists")
		return nil, nil
	}
	user := model.User{}
	resUser.Decode(&user)
	userID := user.ID
	if userLoggedIn == userID {
		fmt.Println("Cannot delete own user")
		return nil, nil
	}
	if userID == org.OwnerID {
		fmt.Println("Cannot delete organization owner")
		return nil, nil
	}

	for i := 0; i < len(org.AdminsID); i++ {
		if userID == org.AdminsID[i] {
			return nil, nil
		}
	}
	// Remove user from current members / admins
	var members []string = org.MembersID
	var updatedMembers []string
	var admins []string = org.AdminsID
	fmt.Println("ADMINS: ", org.AdminsID)
	var removed bool = false
	for i := 0; i < len(members); i++ {
		if members[i] == userID {
			updatedMembers = helper.RemoveIndex(members, i)
			removed = true
			break
		}
	}
	for i := 0; i < len(admins); i++ {
		if admins[i] == userID {
			admins = helper.RemoveIndex(admins, i)
			break
		}
	}
	if removed != true {
		fmt.Println("User doesnt exist")
		return nil, nil
	}
	removedMember := model.Organization{
		ID:          orgID,
		Name:        org.Name,
		Description: org.Description,
		AdminsID:    admins,
		MembersID:   updatedMembers,
		NumMembers:  len(updatedMembers),
	}
	res := databaseCon.ManageOrgMembers(orgID, removedMember, "organizations")
	fmt.Println("Modified Count:", res.ModifiedCount)
	return &removedMember, nil
}

func (r *mutationResolver) AddAdmin(ctx context.Context, orgID string, email string) (*model.Organization, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}
	isOwner := contex.Owner
	if isOwner == 0 {
		fmt.Println("Only owner can add an admin")
		return nil, nil
	}
	resOrg := databaseCon.FindOne(orgID, "organizations")
	org := model.Organization{}
	resOrg.Decode(&org)
	resUser := databaseCon.FindByEmail(email)
	if resUser == nil {
		fmt.Println("No user with this is exists")
		return nil, nil
	}
	user := model.User{}
	resUser.Decode(&user)
	userID := user.ID
	for i := 0; i < len(org.AdminsID); i++ {
		if userID == org.AdminsID[i] {
			fmt.Println("User is allready a admin, returning")
			return nil, nil
		}
	}
	for i := 0; i < len(org.MembersID); i++ {
		if userID == org.MembersID[i] {
			fmt.Println("User found in members, adding as admin")
			var admins []string = org.AdminsID
			admins = append(admins, userID)
			addMember := model.Organization{
				AdminsID:   admins,
				MembersID:  org.MembersID,
				NumMembers: org.NumMembers,
			}
			resAdd := databaseCon.ManageOrgAdmins(orgID, addMember, "organizations")
			if resAdd == nil {
				fmt.Println("Error updating the organization")
				return nil, nil
			}
			return &addMember, nil
		}
	}
	fmt.Println("User not found in members, adding as member+admin")
	resUser2 := databaseCon.FindOne(userID, "users")
	if resUser2 == nil {
		fmt.Println("Error getting user")
		return nil, nil
	}
	addUser := model.User{}
	resUser2.Decode(&addUser)
	var admins []string = org.AdminsID
	admins = append(admins, addUser.ID)
	var members []string = org.MembersID
	members = append(members, addUser.ID)
	updatedMembers := model.Organization{
		AdminsID:   admins,
		MembersID:  members,
		NumMembers: len(members),
	}
	resAdd := databaseCon.AddNewMemberAsAdmin(orgID, updatedMembers, "organizations")
	if resAdd == nil {
		fmt.Println("Error updating organization")
		return nil, nil
	}
	return &updatedMembers, nil
}

func (r *mutationResolver) RemoveAdmin(ctx context.Context, orgID string, email string) (*model.Organization, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	fmt.Println("User i removeAdmin: ", userLoggedIn)
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}
	// Check for owner auth, from claims in token, values set in middleware
	isOwner := contex.Owner
	if isOwner == 0 {
		fmt.Println("Only owner can remove an admin")
		return nil, nil
	}
	// Get org
	resOrg := databaseCon.FindOne(orgID, "organizations")
	org := model.Organization{}
	resOrg.Decode(&org)
	// Get user
	resUser := databaseCon.FindByEmail(email)
	if resUser == nil {
		fmt.Println("No user with this is exists")
		return nil, nil
	}
	user := model.User{}
	resUser.Decode(&user)
	userID := user.ID
	if userID == org.OwnerID {
		fmt.Println("Cannot delete owner")
		return nil, nil
	}
	if userID == userLoggedIn {
		fmt.Println("Cannot delete own user")
		return nil, nil
	}
	// Remove user from current admins
	var admins []string = org.AdminsID
	var updatedAdmins []string
	for i := 0; i < len(admins); i++ {
		if admins[i] == userID {
			updatedAdmins = helper.RemoveIndex(admins, i)
		}
	}
	removeAdmin := model.Organization{
		AdminsID: updatedAdmins,
	}
	resRemove := databaseCon.ManageOrgAdmins(orgID, removeAdmin, "organizations")
	if resRemove == nil {
		fmt.Println("Error updating admins")
		return nil, nil
	}
	return &removeAdmin, nil
}

func (r *mutationResolver) CreateOrganization(ctx context.Context, input model.NewOrg) (*model.Organization, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}

	resGet := databaseCon.FindOne(userLoggedIn, "users")
	user := model.User{}
	resGet.Decode(&user)
	if user.ID == "" {
		fmt.Println("Not a user, log in to create a organization")
		return nil, nil
	}
	var members []string
	members = append(members, userLoggedIn)
	var admins []string
	admins = append(admins, userLoggedIn)
	fmt.Println("Admins:", admins, ", Count:", len(admins))
	fmt.Println("Members:", members, ", Count:", len(members))
	newOrg := model.NewOrg{
		Name:        input.Name,
		Description: input.Description,
		MembersID:   members,
		AdminsID:    admins,
		NumMembers:  aws.Int(len(members)),
		OwnerID:     aws.String(userLoggedIn),
	}
	res := databaseCon.SaveOrgToDb(newOrg, "organizations")
	organization := model.Organization{
		ID:          res.InsertedID.(primitive.ObjectID).Hex(),
		Name:        input.Name,
		Description: input.Description,
		MembersID:   members,
		AdminsID:    admins,
		NumMembers:  len(members),
		OwnerID:     userLoggedIn,
	}
	return &organization, nil
}

func (r *mutationResolver) DeleteOrganization(ctx context.Context, orgID string) (*model.Organization, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	isOwnerCon := contex.Owner
	isAdmin := contex.Admin
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}
	if isAdmin != 1 && isOwnerCon != 1 {
		fmt.Println("You can't delete an organization if you are not an admin or owner of the organization")
		return nil, nil
	}
	isOwner, org := helper.CheckOrgOwner(userLoggedIn, orgID, databaseCon)
	if org.ID == "" {
		fmt.Println("No org found")
		return nil, nil
	}
	if !isOwner {
		fmt.Println("Access denied")
		return nil, nil
	}

	res := databaseCon.DeleteOne(orgID, "organizations")
	fmt.Println("Documents affected: " + fmt.Sprint(res.DeletedCount))
	return &org, nil
}

func (r *mutationResolver) NewProject(ctx context.Context, input model.NewProject) (*model.Project, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	isOwner := contex.Owner
	isAdmin := contex.Admin
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}
	if isAdmin != 1 && isOwner != 1 {
		fmt.Println("You can't add a project if you are not an admin or owner of the organization")
		return nil, nil
	}

	//TODO: Sjekk om bruker er admin i input.organizationID

	//Check input validity
	startDate, err := time.Parse("2006-01-02", input.StartDate) //StartDate is a valid date
	if err != nil {
		fmt.Println("Error in New Project: Start Date not valid")
		return nil, err
	}

	endDate, err := time.Parse("2006-01-02", input.EndDate) //EndDate is a valid date
	if err != nil {
		fmt.Println("Error in New Project: Start Date not valid")
		return nil, err
	}

	if endDate.Before(startDate) { //StartDate is an earlier date than EndDate
		fmt.Println("Error in New Project: End Date is before Start Date")
		return nil, nil
	}

	if len(input.Name) < 3 {
		fmt.Println("Error in New Project: Name is shorter than 3 characters")
		return nil, nil
	}

	var members []string
	//members = append(members, userLoggedIn)

	//Creates a project struct & saves it in DB
	projectInput := model.NewProjectMod{
		Name:             input.Name,
		Description:      input.Description,
		Progress:         0,
		Weight:           0,
		StartDate:        input.StartDate,
		EndDate:          input.EndDate,
		Archived:         false,
		OrganizationID:   input.OrganizationID,
		CreatedByID:      userLoggedIn,
		ProjectLeadID:    input.ProjectLeadID,
		ProjectMonitorID: input.ProjectMonitorID,
	}
	res := databaseCon.SaveProjectToDB(projectInput)

	newProject := model.Project{
		ID:               res.InsertedID.(primitive.ObjectID).Hex(),
		Name:             input.Name,
		Description:      input.Description,
		Progress:         0,
		Weight:           0,
		StartDate:        input.StartDate,
		EndDate:          input.EndDate,
		OrganizationID:   input.OrganizationID,
		CreatedByID:      userLoggedIn,
		MembersID:        members,
		ProjectLeadID:    input.ProjectLeadID,
		ProjectMonitorID: input.ProjectMonitorID,
	}

	// Creates a default phase in the project
	var states []string
	states = append(states, "todo")
	states = append(states, "done")
	phaseInput := model.NewPhase{
		Name:      input.Name + " Phase 1",
		ProjectID: res.InsertedID.(primitive.ObjectID).Hex(),
		StartDate: input.StartDate,
		EndDate:   input.EndDate,
		States:    states,
		Archived:  aws.Bool(false),
	}
	resP := databaseCon.SavePhaseToDB(phaseInput)
	databaseCon.SetCurrentPhase(res.InsertedID.(primitive.ObjectID).Hex(), resP.InsertedID.(primitive.ObjectID).Hex())
	return &newProject, nil
}

func (r *mutationResolver) UpdateProject(ctx context.Context, projectID string, input model.EditProject) (*model.Project, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	isOwner := contex.Owner
	isAdmin := contex.Admin
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}

	isProjectLead, project := helper.CheckProjectLead(userLoggedIn, projectID, databaseCon)
	if project.ID == "" {
		fmt.Println("No Project found")
		return nil, nil
	}
	if !isProjectLead && isAdmin != 1 && isOwner != 1 {
		fmt.Println("Access denied")
		return nil, nil
	}

	//Check input validity
	startDate, err := time.Parse("2006-01-02", input.StartDate) //StartDate is a valid date
	if err != nil {
		fmt.Println("Error in New Project: Start Date not valid")
		return nil, err
	}

	endDate, err := time.Parse("2006-01-02", input.EndDate) //EndDate is a valid date
	if err != nil {
		fmt.Println("Error in New Project: Start Date not valid")
		return nil, err
	}

	if endDate.Before(startDate) { //StartDate is an earlier date than EndDate
		fmt.Println("Error in New Project: End Date is before Start Date")
		return nil, nil
	}

	if len(input.Name) < 3 {
		fmt.Println("Error in New Project: Name is shorter than 3 characters")
		return nil, nil
	}

	updatedProject := model.EditProject{
		Name:             input.Name,
		Description:      input.Description,
		StartDate:        input.StartDate,
		EndDate:          input.EndDate,
		Archived:         input.Archived,
		ProjectLeadID:    input.ProjectLeadID,
		ProjectMonitorID: input.ProjectMonitorID,
		CurrentPhase:     input.CurrentPhase,
	}

	resP := databaseCon.FindOne(projectID, "projects")
	var foundProject *model.Project
	errFP := resP.Decode(&foundProject)
	if errFP != nil {
		log.Println(errFP)
	}

	resUpdate := databaseCon.UpdateProject(projectID, updatedProject)
	if resUpdate == nil {
		fmt.Println("Error in response when updating Project")
	}
	if resUpdate.ModifiedCount == 0 {
		fmt.Println("Project not updated")
	}
	return foundProject, nil
}

func (r *mutationResolver) AddMemberToProject(ctx context.Context, projectID string, userID string) (*model.Project, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}

	//Check if the user is admin/owner in org
	isOwner := contex.Owner
	isAdmin := contex.Admin

	resP := databaseCon.FindOne(projectID, "projects")
	var foundProject *model.Project
	err := resP.Decode(&foundProject)
	if err != nil {
		log.Println(err)
	}

	isProjectLead, project := helper.CheckProjectLead(userLoggedIn, projectID, databaseCon)
	if project.ID == "" {
		fmt.Println("No Project found")
		return nil, nil
	}
	if !isProjectLead && isOwner == 0 && isAdmin == 0 {
		fmt.Println("You are not projectlead or orgAdmin")
		return nil, nil
	}

	var member = foundProject.MembersID
	member = append(member, userID)

	resUpdate := databaseCon.UpdateProjectMember(projectID, member)
	if resUpdate == nil {
		fmt.Println("Error in response the phase")
	}
	if resUpdate.ModifiedCount == 0 {
		fmt.Println("Phase not updated")
	}
	return foundProject, nil
}

func (r *mutationResolver) RemoveMemberFromProject(ctx context.Context, projectID string, userID string) (*model.Project, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}

	isOwner := contex.Owner
	isAdmin := contex.Admin

	isProjectLead, project := helper.CheckProjectLead(userLoggedIn, projectID, databaseCon)
	if project.ID == "" {
		fmt.Println("No Project found")
		return nil, nil
	}
	if !isProjectLead && isOwner == 0 && isAdmin == 0 {
		fmt.Println("You are not projectlead or orgAdmin")
		return nil, nil
	}

	resP := databaseCon.FindOne(projectID, "projects")
	var foundProject *model.Project
	err := resP.Decode(&foundProject)
	if err != nil {
		log.Println(err)
	}

	var members []string = foundProject.MembersID
	var updatedMembers []string
	var removed bool = false
	for i := 0; i < len(members); i++ {
		if members[i] == userID {
			updatedMembers = helper.RemoveIndex(members, i)
			removed = true
			break
		}
	}
	if removed != true {
		fmt.Println("User doesnt exist")
		return nil, nil
	}
	res := databaseCon.RemoveProjectMember(projectID, updatedMembers)
	fmt.Println("Modified Count:", res.ModifiedCount)
	return foundProject, nil
}

func (r *mutationResolver) ArchiveProject(ctx context.Context, projectID string, input model.ArchiveProject) (*model.Project, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}
	resGet := databaseCon.FindOne(projectID, "projects")
	if resGet == nil {
		fmt.Println("Error fetching project:", projectID)
		return nil, nil
	}
	projectCheck := model.Project{}
	resGet.Decode(&projectCheck)
	isAdmin := contex.Admin
	isOwner := contex.Owner
	if isOwner != 1 {
		if isAdmin != 1 {
			if userLoggedIn != projectCheck.ProjectLeadID {
				fmt.Println("Access Denied")
				return nil, nil
			}
		}
	}
	archive := model.ArchiveProject{
		Archived: input.Archived,
	}
	resArchive := databaseCon.ArchiveProject(projectID, archive)
	if resArchive == nil {
		fmt.Println("Error archiving project:", projectCheck.Name)
	}
	cur := databaseCon.FindAllGiven("projectid", projectID, "phases", false)
	if cur == nil {
		fmt.Println("Error fetching phases in project:", projectCheck.Name)
		return nil, nil
	}
	defer cur.Close(ctx)
	for cur.Next(ctx) {
		var foundPhase *model.Phase
		err := cur.Decode(&foundPhase)
		if err != nil {
			fmt.Println("Error fecthing tasks", err)
			return nil, nil
		}
		resArchiveTasks := databaseCon.ArchiveTasksFromPhase(foundPhase.ID, aws.BoolValue(input.Archived))
		if resArchiveTasks == nil {
			fmt.Println("Error archiving tasks in phase:", foundPhase.Name)
			return nil, nil
		}
	}
	return &model.Project{
		ID:       projectCheck.ID,
		Archived: aws.BoolValue(input.Archived),
		Name:     projectCheck.Name,
	}, nil
}

func (r *mutationResolver) NewPhase(ctx context.Context, input model.NewPhase) (*model.Phase, error) {
	fmt.Println("Creating new phase in: ", input.ProjectID)
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied", userLoggedIn)
		return nil, nil
	}
	isOwner := contex.Owner
	isAdmin := contex.Admin

	isProjectLead, project := helper.CheckProjectLead(userLoggedIn, input.ProjectID, databaseCon)
	if project.ID == "" {
		fmt.Println("No Project found")
		return nil, nil
	}
	if !isProjectLead && isOwner != 1 && isAdmin != 1 {
		fmt.Println("You can't add a new phase")
		return nil, nil
	}

	//Check input validity
	startDate, err := time.Parse("2006-01-02", input.StartDate) //StartDate is a valid date
	if err != nil {
		fmt.Println("Error in New Project: Start Date not valid")
		return nil, err
	}

	endDate, err := time.Parse("2006-01-02", input.EndDate) //EndDate is a valid date
	if err != nil {
		fmt.Println("Error in New Project: Start Date not valid")
		return nil, err
	}

	if endDate.Before(startDate) { //StartDate is an earlier date than EndDate
		fmt.Println("Error in New Project: End Date is before Start Date")
		return nil, nil
	}

	if len(input.Name) < 3 {
		fmt.Println("Error in New Project: Name is shorter than 3 characters")
		return nil, nil
	}

	var states []string
	states = append(states, "todo")
	states = append(states, "done")
	phaseInput := model.NewPhase{
		Name:      input.Name,
		ProjectID: input.ProjectID,
		Progress:  0,
		Weight:    0,
		StartDate: input.StartDate,
		EndDate:   input.EndDate,
		States:    states,
		Archived:  aws.Bool(false),
	}
	res := databaseCon.SavePhaseToDB(phaseInput)
	newPhase := model.Phase{
		ID:        res.InsertedID.(primitive.ObjectID).Hex(),
		Name:      input.Name,
		ProjectID: input.ProjectID,
		Progress:  0,
		Weight:    0,
		StartDate: input.StartDate,
		EndDate:   input.EndDate,
		States:    states,
	}
	return &newPhase, nil
}

func (r *mutationResolver) UpdatePhase(ctx context.Context, phaseID string, input model.EditPhase) (*model.Phase, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}

	resP := databaseCon.FindOne(phaseID, "phases")
	var foundPhase *model.Phase
	errFP := resP.Decode(&foundPhase)
	if errFP != nil {
		log.Println(errFP)
	}

	isOwner := contex.Owner
	isAdmin := contex.Admin

	isProjectLead, project := helper.CheckProjectLead(userLoggedIn, foundPhase.ProjectID, databaseCon)
	if project.ID == "" {
		fmt.Println("No Project found")
		return nil, nil
	}
	if !isProjectLead && isOwner != 1 && isAdmin != 1 {
		fmt.Println("You have no access to update phase")
		return nil, nil
	}

	//Check input validity
	startDate, err := time.Parse("2006-01-02", input.StartDate) //StartDate is a valid date
	if err != nil {
		fmt.Println("Error in New Project: Start Date not valid")
		return nil, err
	}

	endDate, err := time.Parse("2006-01-02", input.EndDate) //EndDate is a valid date
	if err != nil {
		fmt.Println("Error in New Project: Start Date not valid")
		return nil, err
	}

	if endDate.Before(startDate) { //StartDate is an earlier date than EndDate
		fmt.Println("Error in New Project: End Date is before Start Date")
		return nil, nil
	}

	if len(input.Name) < 3 {
		fmt.Println("Error in New Project: Name is shorter than 3 characters")
		return nil, nil
	}

	newPhase := model.EditPhase{
		Name:      input.Name,
		StartDate: input.StartDate,
		EndDate:   input.EndDate,
	}

	resUpdate := databaseCon.UpdatePhase(phaseID, newPhase, "phases")
	if resUpdate == nil {
		fmt.Println("Error in response the phase")
	}
	if resUpdate.ModifiedCount == 0 {
		fmt.Println("Phase not updated")
	}
	return foundPhase, nil
}

func (r *mutationResolver) DeletePhase(ctx context.Context, phaseID string, projectID string) (*model.Phase, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}

	resP := databaseCon.FindOne(phaseID, "phases")
	var foundPhase *model.Phase
	errFP := resP.Decode(&foundPhase)
	if errFP != nil {
		log.Println(errFP)
	}

	isOwner := contex.Owner
	isAdmin := contex.Admin

	isProjectLead, project := helper.CheckProjectLead(userLoggedIn, foundPhase.ProjectID, databaseCon)
	if project.ID == "" {
		fmt.Println("No Project found")
		return nil, nil
	}
	if !isProjectLead && isOwner != 1 && isAdmin != 1 {
		fmt.Println("You have no access to delete a phase")
		return nil, nil
	}

	fmt.Println("Deleting a organization...")
	res := databaseCon.DeleteOne(phaseID, "phases")
	fmt.Println("Documents affected: " + fmt.Sprint(res.DeletedCount))
	return foundPhase, nil
}

func (r *mutationResolver) NewState(ctx context.Context, phaseID string, state string) (*model.Phase, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}

	resP := databaseCon.FindOne(phaseID, "phases")
	var foundPhase *model.Phase
	err := resP.Decode(&foundPhase)
	if err != nil {
		log.Println(err)
	}

	isProjectLead, project := helper.CheckProjectLead(userLoggedIn, foundPhase.ProjectID, databaseCon)
	if project.ID == "" {
		fmt.Println("No Project found")
		return nil, nil
	}
	if !isProjectLead {
		fmt.Println("Access denied")
		return nil, nil
	}

	var states = foundPhase.States

	for i := 0; i < len(states); i++ {
		if states[i] == state {
			fmt.Println("Error adding state: State already exists")
			return nil, nil
		}
	}

	states = append(states, state)

	resUpdate := databaseCon.UpdateState(phaseID, states)
	if resUpdate == nil {
		fmt.Println("Error in response the phase")
	}
	if resUpdate.ModifiedCount == 0 {
		fmt.Println("Phase not updated")
	}
	return foundPhase, nil
}

func (r *mutationResolver) DeleteState(ctx context.Context, phaseID string, state string) (*model.Phase, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}

	if state == "todo" || state == "done" {
		fmt.Println("Error in DeleteState: Cannot delete default states")
		return nil, nil
	}

	resP := databaseCon.FindOne(phaseID, "phases")
	var foundPhase *model.Phase
	err := resP.Decode(&foundPhase)
	if err != nil {
		log.Println(err)
	}

	var states []string = foundPhase.States
	var updatedStates []string
	var removed bool = false
	for i := 0; i < len(states); i++ {
		if states[i] == state {
			updatedStates = helper.RemoveIndex(states, i)
			removed = true
			break
		}
	}
	if removed != true {
		fmt.Println("User doesnt exist")
		return nil, nil
	}
	res := databaseCon.UpdateState(phaseID, updatedStates)
	fmt.Println("Modified Count:", res.ModifiedCount)
	return foundPhase, nil
}

func (r *mutationResolver) ArchivePhase(ctx context.Context, phaseID string, input model.ArchivePhase) (*model.Phase, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}

	//Find phase
	resGetP := databaseCon.FindOne(phaseID, "phases")
	if resGetP == nil {
		fmt.Println("Error fetching phase:", phaseID)
		return nil, nil
	}
	phaseCheck := model.Phase{}
	resGetP.Decode(&phaseCheck)
	projectID := phaseCheck.ProjectID

	//Find project
	resGet := databaseCon.FindOne(projectID, "projects")
	if resGet == nil {
		fmt.Println("Error fetching project:", projectID)
		return nil, nil
	}
	projectCheck := model.Project{}
	resGet.Decode(&projectCheck)

	//Check authorization
	isAdmin := contex.Admin
	isOwner := contex.Owner
	if isOwner != 1 {
		if isAdmin != 1 {
			if userLoggedIn != projectCheck.ProjectLeadID {
				fmt.Println("Access Denied")
				return nil, nil
			}
		}
	}
	archived := model.ArchivePhase{
		Archived: input.Archived,
	}

	//Subtract phase's progress & weight from project
	updatedProject := databaseCon.UpdateStats(phaseCheck.ProjectID, projectCheck.Progress-phaseCheck.Progress, projectCheck.Weight-phaseCheck.Weight, "projects")
	if updatedProject == nil {
		fmt.Println("Error while creating task: Could not update Project")
		return nil, nil
	}

	//Archive phase
	resArchive := databaseCon.ArchivePhase(phaseID, archived)
	if resArchive == nil {
		fmt.Println("Error archiving phase")
		return nil, nil
	}
	return &model.Phase{
		ID:       phaseCheck.ID,
		Archived: input.Archived,
		Name:     phaseCheck.Name,
	}, nil
}

func (r *mutationResolver) Login(ctx context.Context, input model.LoginRequest) (*model.AuthToken, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	res, err := http.PostForm("https://oauth2.googleapis.com/tokeninfo",
		url.Values{"access_token": {input.AccessToken}})
	if err != nil {
		log.Println(err)
		return nil, err
	}

	response := &model.AuthRes{}
	decoder := json.NewDecoder(res.Body)
	err1 := decoder.Decode(response)

	if err1 != nil {
		log.Println(err1)
		return nil, err1
	}
	defer res.Body.Close()

	userID := ""
	if response.Email != "" {
		URL := (&url.URL{
			Scheme: "https",
			Host:   "www.googleapis.com",
			Path:   "oauth2/v1/userinfo",
			RawQuery: url.Values{
				"alt":          []string{"json"},
				"access_token": []string{input.AccessToken},
			}.Encode(),
		}).String()

		res, err := http.Get(URL)
		if err != nil {
			log.Println(err)
			return nil, err
		}

		gInfoRes := &model.GInfoRes{}
		decoderGI := json.NewDecoder(res.Body)
		errGI := decoderGI.Decode(gInfoRes)

		if errGI != nil {
			fmt.Println(errGI)
			return nil, errGI
		}
		defer res.Body.Close()

		DBInfoRes := databaseCon.FindByGID(gInfoRes.ID) //Burde sammenligne med GoogleID (gID)
		user := model.User{}
		DBInfoRes.Decode(&user)
		if user.ID == "" {
			fmt.Println("registering a user")
			user1 := model.NewUser{ //We may need to add an image to user  type
				Fname: gInfoRes.GivenName,
				Lname: gInfoRes.FamilyName,
				Email: gInfoRes.Email,
				Image: gInfoRes.Picture,
				GID:   gInfoRes.ID,
			}
			res := databaseCon.SaveUserToDb(user1, "users")
			userID = res.InsertedID.(primitive.ObjectID).Hex()

			// Make My Org here
			var members []string
			members = append(members, userID)
			var admins []string
			admins = append(admins, userID)
			defaultOrg := model.NewOrg{
				Name:        gInfoRes.GivenName + "'s Workspace",
				Description: "Your own personal workspace for simple tasks and reminders!",
				NumMembers:  aws.Int(len(members)),
				OwnerID:     aws.String(userID),
				MembersID:   members,
				AdminsID:    admins,
			}
			resCreateDefaultOrg := databaseCon.SaveOrgToDb(defaultOrg, "organizations")
			fmt.Println("Created org: ", resCreateDefaultOrg)
		} else {
			fmt.Println("User is registered")
			userID = user.ID
		}

		//Generate access token
		accessToken := jwt.New(jwt.SigningMethodHS256)
		claimsA := accessToken.Claims.(jwt.MapClaims)
		claimsA["userID"] = userID
		claimsA["tokenExpiration"] = time.Now().Add(time.Minute * 60).Unix()
		accessTokenString, err := accessToken.SignedString(SecretKey)
		if err != nil {
			log.Println("Error in Generating access token")
		}

		//Generate refresh token
		refreshToken := jwt.New(jwt.SigningMethodHS256)
		claimsR := refreshToken.Claims.(jwt.MapClaims)
		claimsR["tokenExpiration"] = time.Now().Add(time.Hour * 72).Unix()
		claimsR["userID"] = userID
		refreshTokenString, err := refreshToken.SignedString(SecretKey2)
		if err != nil {
			log.Println("Error in Generating refresh token")
		}
		contex.Write(accessTokenString, refreshTokenString, 86400)
		return &model.AuthToken{
			AccessToken:  accessTokenString,
			RefreshToken: refreshTokenString,
		}, nil
	}
	return nil, nil
}

func (r *mutationResolver) RenewToken(ctx context.Context, input model.TokenRequest) (*model.AuthToken, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	toki, err := jwt.Parse(input.RefreshToken, func(token *jwt.Token) (interface{}, error) {
		return SecretKey2, nil
	})
	if err != nil {
		fmt.Println("Error on parsing refresh token: ", err)
	}
	if claims, ok := toki.Claims.(jwt.MapClaims); ok && toki.Valid {

		if claims == nil {
			return nil, nil
		}
		timeNow := float64(time.Now().Unix())
		timeToken, ok := claims["tokenExpiration"]
		userIDClaim := claims["userID"]
		if ok != true {
			fmt.Println("Could not fetch refreshTtoken expiration time", err)
		}

		if err != nil {
			fmt.Println(err)
		}
		if timeToken.(float64)-timeNow > 0 {
			//generate access token.
			accessToken := jwt.New(jwt.SigningMethodHS256)
			claimsA := accessToken.Claims.(jwt.MapClaims)
			claimsA["userID"] = userIDClaim
			claimsA["tokenExpiration"] = time.Now().Add(time.Minute * 60).Unix()
			accessTokenString, err := accessToken.SignedString(SecretKey)
			if err != nil {
				log.Println("Error in Generating access token")
			}

			//Generate refresh token
			refreshToken := jwt.New(jwt.SigningMethodHS256)
			claimsR := refreshToken.Claims.(jwt.MapClaims)
			claimsR["tokenExpiration"] = time.Now().Add(time.Hour * 72).Unix() //time.Hour * 72
			claimsR["userID"] = userIDClaim
			refreshTokenString, err := refreshToken.SignedString(SecretKey2)
			if err != nil {
				log.Println("Error in Generating refresh token")
			}
			contex.Write(accessTokenString, refreshTokenString, 86400)
			return &model.AuthToken{
				AccessToken:  accessTokenString,
				RefreshToken: refreshTokenString,
			}, nil
		} else {
			return nil, nil
		}

	}
	contex.Write("accessTokenString", "refreshTokenString", -1)
	return &model.AuthToken{
		AccessToken:  "accessTokenString",
		RefreshToken: "refreshTokenString",
	}, nil
}

func (r *mutationResolver) Logout(ctx context.Context) (*model.AuthToken, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}
	contex.Write("accessTokenString", "accessTokenString", -1)
	return &model.AuthToken{
		AccessToken:  "",
		RefreshToken: "",
	}, nil
}

func (r *queryResolver) Tasks(ctx context.Context) ([]*model.Task, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}
	fmt.Println("Getting tasks...")
	cur := databaseCon.FindAll("tasks")
	var foundTasks []*model.Task
	defer cur.Close(ctx)
	for cur.Next(ctx) {
		var foundTask *model.Task
		err := cur.Decode(&foundTask)
		if err != nil {
			fmt.Println("Error", err)
			return nil, nil
		}
		//fmt.Println("Found task: " + foundUser.Name)
		foundTasks = append(foundTasks, foundTask)
	}
	return foundTasks, nil
}

func (r *queryResolver) Task(ctx context.Context, taskID string) (*model.Task, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}
	user := contex.UserId
	fmt.Println("User i get task: ", user)
	if user != "" {
		fmt.Println("Access accepted", user)
	} else {
		fmt.Println("Access denied", user)
		return nil, nil
	}
	fmt.Println("Getting a task...")
	res := databaseCon.FindOne(taskID, "tasks")
	task := model.Task{}
	res.Decode(&task)
	fmt.Println("Task data: " + fmt.Sprint(task.ID))
	return &task, nil
}

func (r *queryResolver) TaskByName(ctx context.Context, name string) (*model.Task, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}
	fmt.Println("Getting one task by name...")
	res := databaseCon.FindByName(name, "tasks")
	task := model.Task{}
	res.Decode(&task)
	return &task, nil
}

func (r *queryResolver) TasksInOrg(ctx context.Context, orgID string) ([]*model.Task, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}
	cur := databaseCon.FindAllTasksOrg(orgID, "tasks")
	if cur == nil {
		fmt.Println("Error fetching tasks by org")
		return nil, nil
	}
	var foundTasks []*model.Task
	defer cur.Close(ctx)
	for cur.Next(ctx) {
		var foundTask *model.Task
		err := cur.Decode(&foundTask)
		if err != nil {
			log.Fatal(err)
		}
		foundTasks = append(foundTasks, foundTask)
	}
	return foundTasks, nil
}

func (r *queryResolver) TasksInPhase(ctx context.Context, phaseID string) ([]*model.Task, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}

	cur := databaseCon.FindAllTasksInPhase(phaseID)
	if cur == nil {
		fmt.Println("Error fetching tasks by phase and by state")
		return nil, nil
	}
	var foundTasks []*model.Task
	defer cur.Close(ctx)
	for cur.Next(ctx) {
		var foundTask *model.Task
		err := cur.Decode(&foundTask)
		if err != nil {
			fmt.Println("Error", err)
			return nil, nil
		}
		var nestedSubtasks []*model.Subtask
		curSub := databaseCon.FindAllSubtasksOfParent(foundTask.ID)
		if curSub == nil {
			fmt.Println("Error fetching nested subtasks")
			return nil, nil
		}
		if curSub.RemainingBatchLength() != 0 {
			defer curSub.Close(ctx)
			for curSub.Next(ctx) {
				var foundSubtask *model.Subtask
				errSub := curSub.Decode(&foundSubtask)
				if errSub != nil {
					fmt.Println("Error in for subtasks", err)
					return nil, nil
				}
				nestedSubtasks = append(nestedSubtasks, foundSubtask)
			}
			foundTask.Subtasks = nestedSubtasks
		}
		foundTasks = append(foundTasks, foundTask)
	}
	return foundTasks, nil
}

func (r *queryResolver) TasksByStateOrg(ctx context.Context, orgID string, state string) ([]*model.Task, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}
	cur := databaseCon.FindByStateOrg(orgID, state)
	if cur == nil {
		fmt.Println("Error fetching tasks by org and by state")
		return nil, nil
	}
	var foundTasks []*model.Task
	defer cur.Close(ctx)
	for cur.Next(ctx) {
		var foundTask *model.Task
		err := cur.Decode(&foundTask)
		if err != nil {
			fmt.Println("Error", err)
			return nil, nil
		}
		foundTasks = append(foundTasks, foundTask)
	}
	return foundTasks, nil
}

func (r *queryResolver) TasksByStatePhase(ctx context.Context, phaseID string, state string) ([]*model.Task, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}
	cur := databaseCon.FindByStateOrg(phaseID, state)
	if cur == nil {
		fmt.Println("Error fetching tasks by phase and by state")
		return nil, nil
	}
	var foundTasks []*model.Task
	defer cur.Close(ctx)
	for cur.Next(ctx) {
		var foundTask *model.Task
		err := cur.Decode(&foundTask)
		if err != nil {
			fmt.Println("Error", err)
			return nil, nil
		}
		foundTasks = append(foundTasks, foundTask)
	}
	return foundTasks, nil
}

func (r *queryResolver) TasksAssigned(ctx context.Context, orgID string, assignedID string, archived bool, period int) ([]*model.Task, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}

	cur := databaseCon.FindAllTasksAssigned(orgID, assignedID, archived, period)
	if cur == nil {
		fmt.Println("Error fetching tasks by phase and by state")
		return nil, nil
	}
	var foundTasks []*model.Task
	defer cur.Close(ctx)
	for cur.Next(ctx) {
		var foundTask *model.Task
		err := cur.Decode(&foundTask)
		if err != nil {
			fmt.Println("Error", err)
			return nil, nil
		}
		var nestedSubtasks []*model.Subtask

		curSub := databaseCon.FindAllAssignedSubtasksOfParent(foundTask.ID, assignedID, 5)
		if curSub == nil {
			fmt.Println("Error fetching nested subtasks")
			return nil, nil
		}
		if curSub.RemainingBatchLength() != 0 {
			defer curSub.Close(ctx)
			for curSub.Next(ctx) {
				var foundSubtask *model.Subtask
				errSub := curSub.Decode(&foundSubtask)
				if errSub != nil {
					fmt.Println("Error in for subtasks", err)
					return nil, nil
				}
				nestedSubtasks = append(nestedSubtasks, foundSubtask)
			}
			foundTask.Subtasks = nestedSubtasks
		}
		foundTasks = append(foundTasks, foundTask)
	}
	return foundTasks, nil
}

func (r *queryResolver) TasksByAuthor(ctx context.Context, orgID string, authorID string, archived bool, period int) ([]*model.Task, error) {
	var context auth.Vars = auth.ForContext(ctx)
	userLoggedIn := context.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}
	cur := databaseCon.FindAllTasksByAuthor(orgID, authorID, archived, period)
	if cur == nil {
		fmt.Println("Error fetching created Tasks")
		return nil, nil
	}
	var foundTasks []*model.Task
	for cur.Next(ctx) {
		var foundTask *model.Task
		err := cur.Decode(&foundTask)
		if err != nil {
			fmt.Println("Error fecthing tasks", err)
			return nil, nil
		}
		var nestedSubtasks []*model.Subtask

		curSub := databaseCon.FindAllAuthorSubtasksOfParent(foundTask.ID, context.UserId, 5)
		if curSub == nil {
			fmt.Println("Error fetching nested subtasks")
			return nil, nil
		}

		if curSub.RemainingBatchLength() != 0 {
			defer curSub.Close(ctx)
			for curSub.Next(ctx) {
				var foundSubtask *model.Subtask
				errSub := curSub.Decode(&foundSubtask)
				if errSub != nil {
					fmt.Println("Error in for subtasks", err)
					return nil, nil
				}
				nestedSubtasks = append(nestedSubtasks, foundSubtask)
			}
			foundTask.Subtasks = nestedSubtasks
		}
		foundTasks = append(foundTasks, foundTask)
	}
	return foundTasks, nil
}

func (r *queryResolver) TasksMadeByLoggedUser(ctx context.Context) ([]*model.Task, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}
	cur := databaseCon.FindAllTasksByLoggedUser(userLoggedIn, "tasks")
	if cur == nil {
		fmt.Println("Error fetching tasks by phase and by state")
		return nil, nil
	}
	var foundTasks []*model.Task
	defer cur.Close(ctx)
	for cur.Next(ctx) {
		var foundTask *model.Task
		err := cur.Decode(&foundTask)
		if err != nil {
			fmt.Println("Error", err)
			return nil, nil
		}
		foundTasks = append(foundTasks, foundTask)
	}
	return foundTasks, nil
}

func (r *queryResolver) SubtasksOfParent(ctx context.Context, taskID string) ([]*model.Subtask, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}
	cur := databaseCon.FindAllSubtasksOfParent(taskID)
	if cur == nil {
		fmt.Println("Error fetching subtask of parenttask", taskID)
		return nil, nil
	}
	var foundTasks []*model.Subtask
	defer cur.Close(ctx)
	for cur.Next(ctx) {
		var foundTask *model.Subtask
		err := cur.Decode(&foundTask)
		if err != nil {
			fmt.Println("Error", err)
			return nil, nil
		}
		foundTasks = append(foundTasks, foundTask)
	}
	return foundTasks, nil
}

func (r *queryResolver) SubtasksByAuthor(ctx context.Context, authorID string, orgID string, archived bool) ([]*model.Subtask, error) {
	//Depreceated
	/*var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}
	cur := databaseCon.FindAllSubTasksByAuthor(orgID, userLoggedIn, archived)
	if cur == nil {
		fmt.Println("Error fetching subtasks by an author")
		return nil, nil
	}
	defer cur.Close(ctx)
	var foundSubtasks []*model.Subtask
	for cur.Next(ctx) {
		var foundSubtask *model.Subtask
		err := cur.Decode(&foundSubtask)
		if err != nil {
			fmt.Println("Error:", err)
			return nil, nil
		}
		foundSubtasks = append(foundSubtasks, foundSubtask)
	}
	return foundSubtasks, nil*/
	return nil, nil
}

func (r *queryResolver) Users(ctx context.Context) ([]*model.User, error) {
	fmt.Println("Getting users...")
	cur := databaseCon.FindAll("users")
	var foundUsers []*model.User
	defer cur.Close(ctx)
	for cur.Next(ctx) {
		var foundUser *model.User
		err := cur.Decode(&foundUser)
		if err != nil {
			fmt.Println(err)
		}
		fmt.Println("Found task: " + foundUser.Fname)
		foundUsers = append(foundUsers, foundUser)
	}
	return foundUsers, nil
}

func (r *queryResolver) User(ctx context.Context, userID string) (*model.User, error) {
	res := databaseCon.FindOne(userID, "users")
	user := model.User{}
	res.Decode(&user)
	fmt.Println("User data: " + fmt.Sprint(user.ID) + ", " + user.Fname + ", " + user.Email)
	return &user, nil
}

func (r *queryResolver) UserOrgs(ctx context.Context) ([]*model.Organization, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}
	cur := databaseCon.FindUserOrgs(userLoggedIn, "organizations")
	var foundOrgs []*model.Organization
	defer cur.Close(ctx)
	for cur.Next(ctx) {
		var foundOrg *model.Organization
		err := cur.Decode(&foundOrg)
		if err != nil {
			log.Println(err)
		}
		//fmt.Println("Found Org: " + foundOrg.ID)
		foundOrgs = append(foundOrgs, foundOrg)
	}
	return foundOrgs, nil
}

func (r *queryResolver) UserByName(ctx context.Context, name string) (*model.User, error) {
	fmt.Println("Getting a user by name...")
	res := databaseCon.FindByName(name, "users")
	user := model.User{}
	res.Decode(&user)
	fmt.Println("User data: " + fmt.Sprint(user.ID) + ", " + user.Fname + ", " + user.Email)
	return &user, nil
}

func (r *queryResolver) Org(ctx context.Context, orgID string) (*model.Organization, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}
	fmt.Println("Getting a organization by id...")
	res := databaseCon.FindOne(orgID, "organizations")
	org := model.Organization{}
	res.Decode(&org)
	retOrg := model.Organization{
		ID:           org.ID,
		Name:         org.Name,
		Description:  org.Description,
		MembersID:    org.MembersID,
		NumMembers:   len(org.MembersID),
		OwnerID:      org.OwnerID,
		Projects:     org.Projects,
		OrgTasks:     org.OrgTasks,
		OrgReminders: org.OrgReminders,
	}
	fmt.Println("Org data: " + fmt.Sprint(retOrg.ID) + ", " + retOrg.Name + ", " + fmt.Sprint(retOrg.NumMembers))
	return &retOrg, nil
}

func (r *queryResolver) OrgUsers(ctx context.Context, orgID string) ([]*model.User, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}
	res := databaseCon.FindOne(orgID, "organizations")
	org := model.Organization{}
	res.Decode(&org)
	var foundUsers []*model.User
	for i := 0; i < len(org.MembersID); i++ {
		var foundUser *model.User
		resUser := databaseCon.FindOne(org.MembersID[i], "users")
		resUser.Decode(&foundUser)
		foundUsers = append(foundUsers, foundUser)
	}
	return foundUsers, nil
}

func (r *queryResolver) OrgAdmins(ctx context.Context, orgID string) ([]*model.User, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}
	res := databaseCon.FindOne(orgID, "organizations")
	org := model.Organization{}
	res.Decode(&org)
	var foundAdmins []*model.User
	for i := 0; i < len(org.AdminsID); i++ {
		var foundAdmin *model.User
		resUser := databaseCon.FindOne(org.AdminsID[i], "users")
		resUser.Decode(&foundAdmin)
		foundAdmins = append(foundAdmins, foundAdmin)
	}
	return foundAdmins, nil
}

func (r *queryResolver) Projects(ctx context.Context, orgID string) ([]*model.Project, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	fmt.Println(userLoggedIn)
	if userLoggedIn != "" {
		fmt.Println("Access accepted", userLoggedIn)
	} else {
		fmt.Println("Access denied", userLoggedIn)
		return nil, nil
	}

	cur := databaseCon.FindProjects(orgID)
	var foundProjects []*model.Project
	defer cur.Close(ctx)
	for cur.Next(ctx) {
		var foundProject *model.Project
		err := cur.Decode(&foundProject)
		if err != nil {
			log.Println(err)
		}
		foundProjects = append(foundProjects, foundProject)
	}
	return foundProjects, nil
}

func (r *queryResolver) Project(ctx context.Context, projectID string) (*model.Project, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn != "" {
		fmt.Println("Access accepted", userLoggedIn)
	} else {
		fmt.Println("Access denied", userLoggedIn)
		return nil, nil
	}
	res := databaseCon.FindOne(projectID, "projects")
	var foundProject *model.Project
	err := res.Decode(&foundProject)
	if err != nil {
		log.Println(err)
	}
	return foundProject, nil
	/*
		userLoggedIn := auth.ForContext(ctx)
		if userLoggedIn != "" {
			fmt.Println("Access accepted", userLoggedIn)
		} else {
			fmt.Println("Access denied", userLoggedIn)
			return nil, nil
		}
		res := databaseCon.FindOne(projectID, "projects")
		var foundProject *model.Project
		err := res.Decode(&foundProject)
		if err != nil {
			log.Println(err)
		}
		fmt.Println("Found Project: " + foundProject.Name)
		return foundProject, nil*/
}

func (r *queryResolver) MembersInProject(ctx context.Context, projectID string) ([]*model.User, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied")
		return nil, nil
	}
	res := databaseCon.FindOne(projectID, "projects")
	project := model.Project{}
	res.Decode(&project)
	var foundUsers []*model.User
	for i := 0; i < len(project.MembersID); i++ {
		var foundUser *model.User
		resUser := databaseCon.FindOne(project.MembersID[i], "users")
		resUser.Decode(&foundUser)
		foundUsers = append(foundUsers, foundUser)
	}
	return foundUsers, nil
}

func (r *queryResolver) Phases(ctx context.Context, projectID string) ([]*model.Phase, error) {
	fmt.Println("Finding phases in: ", projectID)
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn != "" {
		fmt.Println("Access accepted", userLoggedIn)
	} else {
		fmt.Println("Access denied", userLoggedIn)
		return nil, nil
	}

	cur := databaseCon.FindAllGiven("projectid", projectID, "phases", true)
	var foundPhases []*model.Phase
	defer cur.Close(ctx)
	for cur.Next(ctx) {
		var foundPhase *model.Phase
		err := cur.Decode(&foundPhase)
		if err != nil {
			log.Println(err)
		}
		foundPhases = append(foundPhases, foundPhase)
	}
	return foundPhases, nil
}

func (r *queryResolver) Phase(ctx context.Context, phaseID string) (*model.Phase, error) {
	var contex auth.Vars = auth.ForContext(ctx)
	userLoggedIn := contex.UserId
	if userLoggedIn == "" {
		fmt.Println("Access denied", userLoggedIn)
		return nil, nil
	}

	res := databaseCon.FindOne(phaseID, "phases")
	var foundPhase *model.Phase
	err := res.Decode(&foundPhase)
	if err != nil {
		log.Println(err)
	}
	return foundPhase, nil
}

// Mutation returns generated.MutationResolver implementation.
func (r *Resolver) Mutation() generated.MutationResolver { return &mutationResolver{r} }

// Query returns generated.QueryResolver implementation.
func (r *Resolver) Query() generated.QueryResolver { return &queryResolver{r} }

type mutationResolver struct{ *Resolver }
type queryResolver struct{ *Resolver }

// !!! WARNING !!!
// The code below was going to be deleted when updating resolvers. It has been copied here so you have
// one last chance to move it out of harms way if you want. There are two reasons this happens:
//  - When renaming or deleting a resolver the old code will be put in here. You can safely delete
//    it when you're done.
//  - You have helper methods in this file. Move them out to keep these resolver files clean.
var (
	SecretKey = []byte("secret")
)
var SecretKey2 = []byte("refreshTokenSecret")
var databaseCon = db.Connect("<MONGODB-CONNECTION-URL>")
var httpClient = &http.Client{}

func verifyIDToken(accessToken string) (bool, error) {
	fmt.Println("Starting validation...")

	type Result struct {
		Iss           string  `json:"iss"`
		Sub           string  `json:"sub"`
		Azp           string  `json:"azp"`
		Aud           string  `json:"aud"`
		Iat           string  `json:"iat"`
		Exp           string  `json:"exp"`
		Email         *string `json:"email"`
		EmailVerified *string `json:"email_verified"`
		Name          *string `json:"name"`
		Picture       *string `json:"picture"`
		GivenName     *string `json:"given_name"`
		FamilyName    *string `json:"family_name"`
		Locale        *string `json:"locale"`
	}

	res, err := http.PostForm("https://oauth2.googleapis.com/tokeninfo",
		url.Values{"access_token": {accessToken}})
	if err != nil {
		fmt.Println(err)
		return false, err
	}

	fmt.Println("Decoding response from Google...")

	response := &Result{}
	decoder := json.NewDecoder(res.Body)
	err1 := decoder.Decode(response)
	if err1 != nil {
		fmt.Println(err1)
		return false, err1
	}

	if response.EmailVerified != nil {
		fmt.Println("Positive response from Google...")
		return true, nil
	}
	fmt.Println("Negative response from Google...")
	defer res.Body.Close()
	return false, err
}
