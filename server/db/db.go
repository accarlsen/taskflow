package db

// Remember the id stuff: bson:"_id"

import (
	"context"
	"fmt"
	"time"

	"github.com/accarlsen/gqlgen-todos/graph/model"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

//bson:"_id"

// Database exported
type Database struct {
	client *mongo.Client
}

// Connect exported
func Connect(uri string) *Database {
	client, err := mongo.NewClient(options.Client().ApplyURI(uri))
	if err != nil {
		fmt.Println(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	err = client.Connect(ctx)
	return &Database{
		client: client,
	}
}

// Generic methods (typeless) -----------------------------------------------------------------------------

// FindOne exported
func (db *Database) FindOne(id string, collectionName string) *mongo.SingleResult {
	ObjectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		fmt.Println(err)
	}
	colletion := db.client.Database("Taskflow").Collection(collectionName)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res := colletion.FindOne(ctx, bson.M{"_id": ObjectID})
	return res
}

// FindAll exported
func (db *Database) FindAll(collectionName string) *mongo.Cursor {
	colletion := db.client.Database("Taskflow").Collection(collectionName)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	cur, err := colletion.Find(ctx, bson.D{})
	if err != nil {
		fmt.Println(err)
	}
	return cur
}

// DeleteOne exported
func (db *Database) DeleteOne(id string, collectionName string) *mongo.DeleteResult {
	ObjectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		fmt.Println(err)
	}
	colletion := db.client.Database("Taskflow").Collection(collectionName)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res, err := colletion.DeleteOne(ctx, bson.M{"_id": ObjectID})
	if err != nil {
		fmt.Println(err)
	}
	return res
}

// FindByName exported
func (db *Database) FindByName(name string, collectionName string) *mongo.SingleResult {
	colletion := db.client.Database("Taskflow").Collection(collectionName)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res := colletion.FindOne(ctx, bson.M{"name": name})
	if res == nil {
		fmt.Println("No task found")
	}
	return res
}

// FindByFName exported
func (db *Database) FindByFName(name string, collectionName string) *mongo.SingleResult {
	colletion := db.client.Database("Taskflow").Collection(collectionName)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res := colletion.FindOne(ctx, bson.M{"fname": name})
	if res == nil {
		fmt.Println("No task found")
		return nil
	}
	return res
}

// FindByEmail exported
func (db *Database) FindByEmail(email string) *mongo.SingleResult {
	colletion := db.client.Database("Taskflow").Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res := colletion.FindOne(ctx, bson.M{"email": email})
	if res == nil {
		fmt.Println("No users found")
		return nil
	}
	return res
}

// Type specific methods -----------------------------------------------------------------------------

// FindByGID exported
func (db *Database) FindByGID(id string) *mongo.SingleResult {
	colletion := db.client.Database("Taskflow").Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res := colletion.FindOne(ctx, bson.M{"gid": id})
	return res
}

// FindByStateOrg exported
func (db *Database) FindByStateOrg(id string, state string) *mongo.Cursor {
	colletion := db.client.Database("Taskflow").Collection("tasks")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	filter := bson.M{"orgid": id, "state": state}
	cur, err := colletion.Find(ctx, filter)
	if err != nil {
		fmt.Println(err)
	}
	return cur
}

// FindByStatePhase exported
func (db *Database) FindByStatePhase(id string, state string) *mongo.Cursor {
	colletion := db.client.Database("Taskflow").Collection("tasks")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	filter := bson.M{"phaseid": id, "state": state}
	cur, err := colletion.Find(ctx, filter)
	if err != nil {
		fmt.Println(err)
	}
	return cur
}

/*
// FindSubtasksOFParent
func (db *Database) FindSubtasksOfParent(id string) *mongo.Cursor {
	ObjectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		fmt.Println(err)
	}
	colletion := db.client.Database("Taskflow").Collection("tasks")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	filter := bson.M{"_id": ObjectID}
	cur, err := colletion.Find(ctx, filter)
	if err != nil {
		fmt.Println(err)
	}
	return cur
}*/

// FindAllTasksOrg exported
func (db *Database) FindAllTasksOrg(id string, collectionName string) *mongo.Cursor {
	collection := db.client.Database("Taskflow").Collection(collectionName)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	cur, err := collection.Find(ctx, bson.M{"orgid": id})
	if err != nil {
		fmt.Println(err)
	}
	return cur
}

// FindAllTasksInPhase exported
func (db *Database) FindAllTasksInPhase(id string) *mongo.Cursor {
	collection := db.client.Database("Taskflow").Collection("tasks")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	options := options.Find()
	options.SetSort(bson.D{{"deadlinetime", 1}})
	cur, err := collection.Find(ctx, bson.M{"phaseid": id, "archived": false}, options)
	if err != nil {
		fmt.Println(err)
	}
	return cur
}

// FindAllTasksByAuthor exported
func (db *Database) FindAllTasksByAuthor(orgID string, id string, archived bool, period int) *mongo.Cursor {
	collection := db.client.Database("Taskflow").Collection("tasks")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	options := options.Find()
	options.SetSort(bson.D{{"deadlinetime", 1}})
	options.SetLimit(15)

	dateNow := time.Now().Format("2006-01-02")
	dateTomorrow := time.Now().Add(24 * time.Hour).Format("2006-01-02")
	dateUpcomingTo := time.Now().Add(168 * time.Hour).Format("2006-01-02")

	if period == 0 { //Overdue
		cur, err := collection.Find(ctx, bson.M{
			"authorid": id, 
			"orgid": orgID, 
			"archived": archived, 
			"state": bson.M{"$ne": "done"}, 
			"deadlinedate": bson.M{"$lt": dateNow},
			/*"$or": []bson.M{
				bson.M{"deadlinedate": bson.M{"$lt": dateNow}},
				bson.M{"subtaskdeadlines": bson.M{"$lt":dateNow}},
			}*/
			}, options)
		if err != nil {
			fmt.Println(err)
			return nil
		}
		return cur
	} else if period == 1 { //Today
		cur, err := collection.Find(ctx, bson.M{
			"authorid": id, 
			"orgid": orgID, 
			"archived": archived, 
			"deadlinedate": bson.M{"$eq": dateNow},
			/*"$or": []bson.M{
				bson.M{"deadlinedate": bson.M{"$eq": dateNow}},
				bson.M{"subtaskdeadlines": bson.M{"$eq":dateNow}},
		}*/
		}, options)
		if err != nil {
			fmt.Println(err)
			return nil
		}
		return cur
	} else if period == 2 { //Tomorrow
		cur, err := collection.Find(ctx, bson.M{
			"authorid": id, 
			"orgid": orgID, 
			"archived": archived, 
			"deadlinedate": bson.M{"$eq": dateTomorrow},
			/*"$or": []bson.M{
				bson.M{"deadlinedate": bson.M{"$eq": dateTomorrow}}, 
				bson.M{"subtaskdeadlines": bson.M{"$eq":dateTomorrow}},
			}*/
			}, options)
		if err != nil {
			fmt.Println(err)
			return nil
		}
		return cur
	} else if period == 3 { // 5 next days after tomorrow
		cur, err := collection.Find(ctx, bson.M{
			"authorid": id, 
			"orgid": orgID, 
			"archived": archived, 
			"deadlinedate": bson.M{
				"$gt": dateTomorrow,
				"$lt": dateUpcomingTo,
			}, 
			/*
			"$or": []bson.M{
				bson.M{"deadlinedate": bson.M{
					"$gt": dateTomorrow,
					"$lt": dateUpcomingTo,
				}}, 
				bson.M{"subtaskdeadlines": bson.M{
					"$gt": dateTomorrow,
					"$lt": dateUpcomingTo,
				}},
			}*/
			}, options)
		if err != nil {
			fmt.Println(err)
			return nil
		}
		return cur
	} else if period == 5 {
		cur, err := collection.Find(ctx, bson.M{"authorid": id, "orgid": orgID, "archived": archived}, options)
		if err != nil {
			fmt.Println(err)
			return nil
		}
		return cur
	}
	return nil
}

// FindAllTasksByLoggedUser exported
func (db *Database) FindAllTasksByLoggedUser(id string, collectionName string) *mongo.Cursor {
	collection := db.client.Database("Taskflow").Collection(collectionName)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	options := options.Find()
	options.SetLimit(15)
	options.SetSort(bson.D{{"deadlinetime", 1}})
	cur, err := collection.Find(ctx, bson.M{"authorid": id}, options)
	if err != nil {
		fmt.Println(err)
	}
	return cur
}

// FindAllTasksAssigned exported
func (db *Database) FindAllTasksAssigned(orgID string, id string, archived bool, period int) *mongo.Cursor {
	collection := db.client.Database("Taskflow").Collection("tasks")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	options := options.Find()
	options.SetLimit(30)
	options.SetSort(bson.D{{"deadlinetime", 1}})

	dateNow := time.Now().Format("2006-01-02")
	dateTomorrow := time.Now().Add(24 * time.Hour).Format("2006-01-02")
	dateUpcomingTo := time.Now().Add(168 * time.Hour).Format("2006-01-02")

	if period == 0 { //Overdue
		cur, err := collection.Find(ctx, bson.M{
			"orgid":        orgID,
			"archived":     archived,
			"state":        bson.M{"$ne": "done"},
			"deadlinedate": bson.M{"$lt": dateNow},
			"$or": []bson.M{
				bson.M{"assignedid": bson.M{"$eq" :id}},
				bson.M{"subtaskassignees":bson.M{"$eq":id }},
			},
			/*
			"$and": []bson.M{
				bson.M{"$or": []bson.M{
					bson.M{"subtaskdeadlines": bson.M{"$lt": dateNow}}, 
					bson.M{"deadlinedate": bson.M{"$lt": dateNow}},
				}},
				bson.M{"$or": []bson.M{
					bson.M{"assignedid": bson.M{"$eq" :id}},
					bson.M{"subtaskassignees":bson.M{"$eq":id }},
				}},
			},*/
		}, options)
		if err != nil {
			fmt.Println(err)
			return nil
		}
		return cur
	} else if period == 1 { //Today
		cur, err := collection.Find(ctx, bson.M{
			"orgid":        orgID,
			"archived":     archived,
			"deadlinedate": bson.M{"$eq": dateNow},
			"$and": []bson.M{
				bson.M{"$or": []bson.M{
					bson.M{"assignedid": bson.M{"$eq" :id}},
					bson.M{"subtaskassignees":bson.M{"$eq":id }},
				}},
				bson.M{"$or": []bson.M{
					bson.M{"ready": bson.M{"$ne": false}}, 
					bson.M{"soonready": bson.M{"$ne": false}}, 
					bson.M{"state": "done"},
				}},
				/*bson.M{"$or": []bson.M{
					bson.M{"subtaskdeadlines": dateNow}, 
					bson.M{"deadlinedate": dateNow},
				}},*/
			},
		}, options)
		if err != nil {
			fmt.Println(err)
			return nil
		}
		return cur
	} else if period == 2 { //Tomorrow
		cur, err := collection.Find(ctx, bson.M{
			"orgid":        orgID,
			"archived":     archived,
			"state":        bson.M{"$ne": "done"},
			"deadlinedate": bson.M{"$eq": dateTomorrow},
			"$and": []bson.M{
				/*bson.M{"$or": []bson.M{
					bson.M{"subtaskdeadlines": dateTomorrow}, 
					bson.M{"deadlinedate": dateTomorrow},
				}},*/
				bson.M{"$or": []bson.M{
					bson.M{"assignedid": bson.M{"$eq" :id}},
					bson.M{"subtaskassignees":bson.M{"$eq":id }},
				}},
				bson.M{"$or": []bson.M{
					bson.M{"ready": bson.M{"$ne": false}}, 
					bson.M{"soonready": bson.M{"$ne": false}}, 
				}},
			},
			}, options)
		if err != nil {
			fmt.Println(err)
			return nil
		}
		return cur
	} else if period == 3 { // 7 next days after tomorrow
		cur, err := collection.Find(ctx, bson.M{
			"orgid":        orgID,
			"archived":     archived,
			"state":        bson.M{"$ne": "done"},
			"deadlinedate": bson.M{"$gt": dateTomorrow, "$lt": dateUpcomingTo},
			"$and": []bson.M{
				/*bson.M{"$or": []bson.M{
					bson.M{"subtaskdeadlines": bson.M{"$gt": dateTomorrow, "$lt": dateUpcomingTo}}, 
					bson.M{"deadlinedate": bson.M{"$gt": dateTomorrow, "$lt": dateUpcomingTo}},
				}},*/
				bson.M{"$or": []bson.M{
					bson.M{"assignedid": bson.M{"$eq" :id}},
					bson.M{"subtaskassignees":bson.M{"$eq":id }},
				}},
				bson.M{"$or": []bson.M{
					bson.M{"ready": bson.M{"$ne": false}}, 
					bson.M{"soonready": bson.M{"$ne": false}}, 
				}},
			},
			}, options)
		if err != nil {
			fmt.Println(err)
			return nil
		}
		return cur
	} else if period == 5 {
		cur, err := collection.Find(ctx, bson.M{
			"orgid":      orgID,
			"archived":   archived,
			"$or": []bson.M{bson.M{"assignedid": bson.M{"$eq" :id}}, bson.M{"subtaskassignees":bson.M{"$eq":id}}},
		}, options)
		if err != nil {
			fmt.Println(err)
			return nil
		}
		return cur
	}
	return nil
}

// FindAllSubtasksOfParent exported
func (db *Database) FindAllSubtasksOfParent(taskID string) *mongo.Cursor {
	collection := db.client.Database("Taskflow").Collection("subtasks")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	options := options.Find()
	options.SetLimit(30)
	options.SetSort(bson.D{{"deadlinetime", 1}})
	cur, err := collection.Find(ctx, bson.M{"parentid": taskID, "archived": false}, options)
	if err != nil {
		fmt.Println(err)
	}
	return cur
}

//FindAllAssignedSubtasksOfParent exported
func (db *Database) FindAllAssignedSubtasksOfParent(taskID string, assignedID string, period int) *mongo.Cursor {
	collection := db.client.Database("Taskflow").Collection("subtasks")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	options := options.Find()
	options.SetLimit(100)
	options.SetSort(bson.D{{"deadlinetime", 1}})

	dateNow := time.Now().Format("2006-01-02")
	dateTomorrow := time.Now().Add(24 * time.Hour).Format("2006-01-02")
	dateUpcomingTo := time.Now().Add(168 * time.Hour).Format("2006-01-02")

	if period == 0 { //Overdue
		cur, err := collection.Find(ctx, bson.M{"parentid": taskID, "assignedid": assignedID, "archived": false, "state": bson.M{"$ne": "done"}, 
		"deadlinedate": bson.M{"$lt": dateNow},
		}, options)
		if err != nil {
			fmt.Println(err)
			return nil
		}
		return cur
	} else if period == 1 { //Today
		cur, err := collection.Find(ctx, bson.M{"parentid": taskID, "assignedid": assignedID, "archived": false, 
		"deadlinedate": bson.M{"$eq": dateNow}}, options)
		if err != nil {
			fmt.Println(err)
			return nil
		}
		return cur
	} else if period == 2 { //Tomorrow
		cur, err := collection.Find(ctx, bson.M{"parentid": taskID, "assignedid": assignedID, "archived": false, 
		"deadlinedate": bson.M{"$eq": dateTomorrow}}, options)
		if err != nil {
			fmt.Println(err)
			return nil
		}
		return cur
	} else if period == 3 { // 7 next days after tomorrow
		cur, err := collection.Find(ctx, bson.M{"parentid": taskID, "assignedid": assignedID, "archived": false, 
		"deadlinedate": bson.M{
				"$gt": dateTomorrow,
				"$lt": dateUpcomingTo,
		},}, options)
		if err != nil {
			fmt.Println(err)
			return nil
		}
		return cur
	} else if period == 5 {
		cur, err := collection.Find(ctx, bson.M{"parentid": taskID, "assignedid": assignedID, "archived": false}, options)
		if err != nil {
			fmt.Println(err)
			return nil
		}
		return cur
	}
	return nil
}

//FindAllAuthorSubtasksOfParent exported
func (db *Database) FindAllAuthorSubtasksOfParent(taskID string, authorID string, period int) *mongo.Cursor {
	collection := db.client.Database("Taskflow").Collection("subtasks")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	options := options.Find()
	options.SetLimit(100)
	options.SetSort(bson.D{{"deadlinetime", 1}})

	dateNow := time.Now().Format("2006-01-02")
	dateTomorrow := time.Now().Add(24 * time.Hour).Format("2006-01-02")
	dateUpcomingTo := time.Now().Add(168 * time.Hour).Format("2006-01-02")

	if period == 0 { //Overdue
		cur, err := collection.Find(ctx, bson.M{"parentid": taskID, "authorid": authorID, "archived": false, "state": bson.M{"$ne": "done"}, 
		"deadlinedate": bson.M{"$lt": dateNow},
		}, options)
		if err != nil {
			fmt.Println(err)
			return nil
		}
		return cur
	} else if period == 1 { //Today
		cur, err := collection.Find(ctx, bson.M{"parentid": taskID, "authorid": authorID, "archived": false, 
		"deadlinedate": bson.M{"$eq": dateNow}}, options)
		if err != nil {
			fmt.Println(err)
			return nil
		}
		return cur
	} else if period == 2 { //Tomorrow
		cur, err := collection.Find(ctx, bson.M{"parentid": taskID, "authorid": authorID, "archived": false, 
		"deadlinedate": bson.M{"$eq": dateTomorrow}}, options)
		if err != nil {
			fmt.Println(err)
			return nil
		}
		return cur
	} else if period == 3 { // 5 next days after tomorrow
		cur, err := collection.Find(ctx, bson.M{"parentid": taskID, "authorid": authorID, "archived": false, 
		"deadlinedate": bson.M{
				"$gt": dateTomorrow,
				"$lt": dateUpcomingTo,
		},}, options)
		if err != nil {
			fmt.Println(err)
			return nil
		}
		return cur
	} else if period == 5 {
		cur, err := collection.Find(ctx, bson.M{"parentid": taskID, "authorid": authorID, "archived": false}, options)
		if err != nil {
			fmt.Println(err)
			return nil
		}
		return cur
	}
	return nil
}

// AddDepToTask exported
func (db *Database) AddDepToTask(taskID string, input model.UpdateTask) *mongo.UpdateResult {
	ObjectID, err := primitive.ObjectIDFromHex(taskID)
	if err != nil {
		fmt.Println(err)
	}
	collection := db.client.Database("Taskflow").Collection("tasks")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res, err := collection.UpdateOne(
		ctx,
		bson.M{"_id": ObjectID},
		bson.D{{"$set", bson.D{
			{"nexttasks", input.NextTasks}}},
		},
	)
	if err != nil {
		fmt.Println(err)
	}
	return res
}

//Remove
func (db *Database) RemoveDepToTask(taskID string, input model.UpdateTask) *mongo.UpdateResult {
	ObjectID, err := primitive.ObjectIDFromHex(taskID)
	if err != nil {
		fmt.Println(err)
	}
	collection := db.client.Database("Taskflow").Collection("tasks")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res, err := collection.UpdateOne(
		ctx,
		bson.M{"_id": ObjectID},
		bson.D{{"$set", bson.D{
			{"nexttasks", input.NextTasks}}},
		},
	)
	if err != nil {
		fmt.Println(err)
	}
	fmt.Println(res.ModifiedCount)
	return res
}

// SaveTaskToDb exported
func (db *Database) SaveTaskToDb(input model.NewTask, collectionName string) *mongo.InsertOneResult {
	colletion := db.client.Database("Taskflow").Collection(collectionName)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	res, err := colletion.InsertOne(ctx, input)
	if err != nil {
		fmt.Println(err)
	}
	return res
}

// SaveSubtaskToDb exported
func (db *Database) SaveSubtaskToDb(input model.NewSubtask, collectionName string) *mongo.InsertOneResult {
	colletion := db.client.Database("Taskflow").Collection(collectionName)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	res, err := colletion.InsertOne(ctx, input)
	if err != nil {
		fmt.Println(err)
	}
	return res
}

// ManageParentID exported
func (db *Database) ManageParentID(subtaskID string, input model.UpdateSubtask) *mongo.UpdateResult {
	ObjectID, err := primitive.ObjectIDFromHex(subtaskID)
	if err != nil {
		fmt.Println(err)
	}
	colletion := db.client.Database("Taskflow").Collection("subtasks")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res, err := colletion.UpdateOne(
		ctx,
		bson.M{"_id": ObjectID},
		bson.D{{"$set", bson.D{
			{"parentid", input.AssignedID}}},
		},
	)
	if err != nil {
		fmt.Println(err)
	}
	return res
}

// UpdateTask exported
func (db *Database) UpdateTask(taskID string, input model.UpdateTask, collectionName string) *mongo.UpdateResult {
	ObjectID, err := primitive.ObjectIDFromHex(taskID)
	if err != nil {
		fmt.Println(err)
	}
	colletion := db.client.Database("Taskflow").Collection(collectionName)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res, err := colletion.UpdateOne(
		ctx,
		bson.M{"_id": ObjectID},
		bson.D{{"$set", bson.D{
			{"name", input.Name},
			{"description", input.Description},
			{"deadlinedate", input.DeadlineDate},
			{"deadlinetime", input.DeadlineTime},
			{"assignedid", input.AssignedID},
			{"weight", input.Weight},
			{"progress", input.Progress}}},
		},
	)
	if err != nil {
		fmt.Println(err)
	}
	return res
}

// UpdateTask exported
func (db *Database) UpdateTaskNoAssigned(taskID string, input model.UpdateTask, collectionName string) *mongo.UpdateResult {
	ObjectID, err := primitive.ObjectIDFromHex(taskID)
	if err != nil {
		fmt.Println(err)
	}
	colletion := db.client.Database("Taskflow").Collection(collectionName)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res, err := colletion.UpdateOne(
		ctx,
		bson.M{"_id": ObjectID},
		bson.D{{"$set", bson.D{
			{"name", input.Name},
			{"description", input.Description},
			{"deadlinedate", input.DeadlineDate},
			{"deadlinetime", input.DeadlineTime},
			{"weight", input.Weight},
			{"progress", input.Progress}}},
		},
	)
	if err != nil {
		fmt.Println(err)
	}
	return res
}

// UpdateParentAssigned exported
func (db *Database) UpdateParentAssigned(taskID string, assigned []string, subtaskDeadlines []string, collectionName string) *mongo.UpdateResult {
	ObjectID, err := primitive.ObjectIDFromHex(taskID)
	if err != nil {
		fmt.Println(err)
	}
	colletion := db.client.Database("Taskflow").Collection(collectionName)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res, err := colletion.UpdateOne(
		ctx,
		bson.M{"_id": ObjectID},
		bson.D{{"$set", bson.D{
			{"subtaskdeadlines", subtaskDeadlines},
			{"subtaskassignees", assigned}}},
		},
	)
	if err != nil {
		fmt.Println(err)
	}
	return res
}

// UpdateSubtask exported
func (db *Database) UpdateSubtask(subtaskID string, input model.UpdateSubtask, collectionName string) *mongo.UpdateResult {
	ObjectID, err := primitive.ObjectIDFromHex(subtaskID)
	if err != nil {
		fmt.Println(err)
	}
	colletion := db.client.Database("Taskflow").Collection(collectionName)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res, err := colletion.UpdateOne(
		ctx,
		bson.M{"_id": ObjectID},
		bson.D{{"$set", bson.D{
			{"name", input.Name},
			{"description", input.Description},
			{"deadlinedate", input.DeadlineDate},
			{"deadlinetime", input.DeadlineTime},
			{"assignedid", input.AssignedID},
			{"weight", input.Weight},
			{"progress", input.Progress}}},
		},
	)
	if err != nil {
		fmt.Println(err)
	}
	return res
}

/*
// AddTaskToPhase exported
func (db *Database) AddTaskToPhase(taskID string, phaseID string) *mongo.UpdateResult {

	return nil
}

// RemoveTaskFromPhase exported
func (db *Database) RemoveTaskFromPhase(taskID string, phaseID string) *mongo.UpdateResult {

	return nil
}*/

// ManageTaskPhase exported
func (db *Database) ManageTaskPhase(taskID string, phaseID string) *mongo.UpdateResult {
	ObjectID, err := primitive.ObjectIDFromHex(taskID)
	if err != nil {
		fmt.Println(err)
	}
	colletion := db.client.Database("Taskflow").Collection("tasks")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res, err := colletion.UpdateOne(
		ctx,
		bson.M{"_id": ObjectID},
		bson.D{
			{"$set", bson.D{
				{"phaseid", phaseID}}},
		},
	)
	if err != nil {
		fmt.Println(err)
	}
	return res
}

// AssignSubtask exported
func (db *Database) AssignSubtask(taskID string, input model.UpdateSubtask) *mongo.UpdateResult {
	ObjectID, err := primitive.ObjectIDFromHex(taskID)
	if err != nil {
		fmt.Println(err)
	}
	colletion := db.client.Database("Taskflow").Collection("subtasks")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res, err := colletion.UpdateOne(
		ctx,
		bson.M{"_id": ObjectID},
		bson.D{
			{"$set", bson.D{
				{"assignedid", input.AssignedID}}},
		},
	)
	if err != nil {
		fmt.Println(err)
	}
	return res
}

// AssignTask exported
func (db *Database) AssignTask(taskID string, input model.UpdateTask) *mongo.UpdateResult {
	ObjectID, err := primitive.ObjectIDFromHex(taskID)
	if err != nil {
		fmt.Println(err)
	}
	colletion := db.client.Database("Taskflow").Collection("tasks")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res, err := colletion.UpdateOne(
		ctx,
		bson.M{"_id": ObjectID},
		bson.D{
			{"$set", bson.D{
				{"assignedid", input.AssignedID}}},
		},
	)
	if err != nil {
		fmt.Println(err)
	}
	return res
}

// ArchiveTask exported
func (db *Database) ArchiveTask(taskID string, collectionName string, archived bool) *mongo.UpdateResult {
	ObjectID, err := primitive.ObjectIDFromHex(taskID)
	if err != nil {
		fmt.Println(err)
	}
	colletion := db.client.Database("Taskflow").Collection(collectionName)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res, err := colletion.UpdateOne(
		ctx,
		bson.M{"_id": ObjectID},
		bson.D{
			{"$set", bson.D{
				{"archived", archived}}},
		},
	)
	if err != nil {
		fmt.Println(err)
	}
	return res
}

// SetSubtaskState exported
func (db *Database) SetSubtaskState(subtaskID string, state string, progress int) *mongo.UpdateResult {
	ObjectID, err := primitive.ObjectIDFromHex(subtaskID)
	if err != nil {
		fmt.Println(err)
	}
	colletion := db.client.Database("Taskflow").Collection("subtasks")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res, err := colletion.UpdateOne(
		ctx,
		bson.M{"_id": ObjectID},
		bson.D{
			{"$set", bson.D{
				{"state", state},
				{"progress", progress},
			}},
		},
	)
	if err != nil {
		fmt.Println(err)
	}
	return res
}

// SetTaskState exported
func (db *Database) SetTaskState(taskID string, state string, progress int, ready bool) *mongo.UpdateResult {
	ObjectID, err := primitive.ObjectIDFromHex(taskID)
	if err != nil {
		fmt.Println(err)
	}
	colletion := db.client.Database("Taskflow").Collection("tasks")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res, err := colletion.UpdateOne(
		ctx,
		bson.M{"_id": ObjectID},
		bson.D{
			{"$set", bson.D{
				{"state", state},
				{"progress", progress},
				{"ready", ready},
			}},
		},
	)
	if err != nil {
		fmt.Println(err)
	}
	return res
}

//SetTaskSoonReady exported
func (db *Database) SetTaskSoonReady(taskID string, ready bool, soonReady bool) *mongo.UpdateResult {
	ObjectID, err := primitive.ObjectIDFromHex(taskID)
	if err != nil {
		fmt.Println(err)
	}
	collection := db.client.Database("Taskflow").Collection("tasks")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res, err := collection.UpdateOne(
		ctx,
		bson.M{"_id": ObjectID},
		bson.D{
			{"$set", bson.D{
				{"ready", ready},
				{"soonready", soonReady},
			}},
		},
	)
	if err != nil {
		fmt.Println(err)
	}
	return res
}

// SetFirstTask exported
func (db *Database) SetFirstTask(taskID string, first bool) *mongo.UpdateResult {
	ObjectID, err := primitive.ObjectIDFromHex(taskID)
	if err != nil {
		fmt.Println(err)
	}
	collection := db.client.Database("Taskflow").Collection("tasks")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res, err := collection.UpdateOne(
		ctx,
		bson.M{"_id": ObjectID},
		bson.D{{"$set", bson.D{
			{"firsttask", first}}},
		},
	)
	if err != nil {
		fmt.Println(err)
	}
	return res
}

// SaveUserToDb exported
func (db *Database) SaveUserToDb(input model.NewUser, collectionName string) *mongo.InsertOneResult {
	colletion := db.client.Database("Taskflow").Collection(collectionName)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	res, err := colletion.InsertOne(ctx, input)
	if err != nil {
		fmt.Println(err)
	}
	return res
}

// UpdateUser exported
func (db *Database) UpdateUser(userID string, input model.NewUser, collectionName string) *mongo.UpdateResult {
	ObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		fmt.Println(err)
	}
	colletion := db.client.Database("Taskflow").Collection(collectionName)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res, err := colletion.UpdateOne(
		ctx,
		bson.M{"_id": ObjectID},
		bson.D{
			{"$set", bson.D{
				{"fname", input.Fname},
				{"lname", input.Lname},
				{"done", input.Email}}},
		},
	)
	if err != nil {
		fmt.Println(err)
	}
	return res
}

// SaveOrgToDb exported
func (db *Database) SaveOrgToDb(input model.NewOrg, collectionName string) *mongo.InsertOneResult {
	colletion := db.client.Database("Taskflow").Collection(collectionName)
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	res, err := colletion.InsertOne(ctx, input)
	if err != nil {
		fmt.Println(err)
	}
	return res
}

// UpdateOrg exported
func (db *Database) UpdateOrg(orgID string, input model.EditOrg, collectionName string) *mongo.UpdateResult {
	ObjectID, err := primitive.ObjectIDFromHex(orgID)
	if err != nil {
		fmt.Println(err)
	}
	colletion := db.client.Database("Taskflow").Collection(collectionName)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res, err := colletion.UpdateOne(
		ctx,
		bson.M{"_id": ObjectID},
		bson.D{
			{"$set", bson.D{
				{"name", input.Name},
				{"description", input.Description}}},
		},
	)
	if err != nil {
		fmt.Println(err)
	}
	return res
}

// ManageOrgMembers exported
func (db *Database) ManageOrgMembers(orgID string, input model.Organization, collectionName string) *mongo.UpdateResult {
	ObjectID, err := primitive.ObjectIDFromHex(orgID)
	if err != nil {
		fmt.Println(err)
	}
	colletion := db.client.Database("Taskflow").Collection(collectionName)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res, err := colletion.UpdateOne(
		ctx,
		bson.M{"_id": ObjectID},
		bson.D{
			{"$set", bson.D{
				{"adminsid", input.AdminsID},
				{"membersid", input.MembersID},
				{"nummembers", input.NumMembers}}},
		},
	)
	if err != nil {
		fmt.Println(err)
	}
	return res
}

// AddNewMemberAsAdmin exported
func (db *Database) AddNewMemberAsAdmin(orgID string, input model.Organization, collectionName string) *mongo.UpdateResult {
	ObjectID, err := primitive.ObjectIDFromHex(orgID)
	if err != nil {
		fmt.Println(err)
	}
	colletion := db.client.Database("Taskflow").Collection(collectionName)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res, err := colletion.UpdateOne(
		ctx,
		bson.M{"_id": ObjectID},
		bson.D{
			{"$set", bson.D{
				{"adminsid", input.AdminsID},
				{"membersid", input.MembersID},
				{"nummembers", input.NumMembers}}},
		},
	)
	if err != nil {
		fmt.Println(err)
	}
	return res
}

// ManageOrgAdmins expoted
func (db *Database) ManageOrgAdmins(orgID string, input model.Organization, collectionName string) *mongo.UpdateResult {
	ObjectID, err := primitive.ObjectIDFromHex(orgID)
	if err != nil {
		fmt.Println(err)
	}
	colletion := db.client.Database("Taskflow").Collection(collectionName)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res, err := colletion.UpdateOne(
		ctx,
		bson.M{"_id": ObjectID},
		bson.D{
			{"$set", bson.D{
				{"adminsid", input.AdminsID}}},
		},
	)
	if err != nil {
		fmt.Println(err)
	}
	return res
}

// FindUserOrgs exported
func (db *Database) FindUserOrgs(userID string, collectionName string) *mongo.Cursor {
	colletion := db.client.Database("Taskflow").Collection(collectionName)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res, err := colletion.Find(ctx, bson.M{"membersid": userID})
	if err != nil {
		fmt.Println(err)
	}
	return res
}

//SearchOrgUsers exported
func (db *Database) SearchOrgUsers(orgID string, searchText string) *mongo.Cursor {
	colletion := db.client.Database("Taskflow").Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	options := options.Find()
	options.SetLimit(2)

	res, err := colletion.Find(ctx, bson.M{"$text": bson.M{
		"$search": searchText,
	}}, options)
	if err != nil {
		fmt.Println(err)
	}
	return res
}

//FindProjects exported
func (db *Database) FindProjects(orgID string) *mongo.Cursor {
	fmt.Println("Finding projects")
	colletion := db.client.Database("Taskflow").Collection("projects")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res, err := colletion.Find(ctx, bson.M{"organizationid": orgID})
	if err != nil {
		fmt.Println(err)
	}
	return res
}

//SaveProjectToDB exported
func (db *Database) SaveProjectToDB(input model.NewProjectMod) *mongo.InsertOneResult {
	colletion := db.client.Database("Taskflow").Collection("projects")
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	res, err := colletion.InsertOne(ctx, input)
	if err != nil {
		fmt.Println(err)
	}
	return res
}

//UpdateProjectMember exported
func (db *Database) UpdateProjectMember(projectID string, members []string) *mongo.UpdateResult {
	ObjectID, err := primitive.ObjectIDFromHex(projectID)
	if err != nil {
		fmt.Println(err)
	}
	colletion := db.client.Database("Taskflow").Collection("projects")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res, err := colletion.UpdateOne(
		ctx,
		bson.M{"_id": ObjectID},
		bson.D{
			{"$set", bson.D{
				{"membersid", members}}},
		},
	)
	if err != nil {
		fmt.Println(err)
	}
	return res
}

//RemoveProjectMember exported
func (db *Database) RemoveProjectMember(projectID string, members []string) *mongo.UpdateResult {
	ObjectID, err := primitive.ObjectIDFromHex(projectID)
	if err != nil {
		fmt.Println(err)
	}
	colletion := db.client.Database("Taskflow").Collection("projects")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res, err := colletion.UpdateOne(
		ctx,
		bson.M{"_id": ObjectID},
		bson.D{
			{"$set", bson.D{
				{"membersid", members}}},
		},
	)
	if err != nil {
		fmt.Println(err)
	}
	return res
}

//SetCurrentPhase exported
func (db *Database) SetCurrentPhase(projectID string, phaseID string) *mongo.UpdateResult {
	ObjectID, err := primitive.ObjectIDFromHex(projectID)
	if err != nil {
		fmt.Println(err)
	}
	colletion := db.client.Database("Taskflow").Collection("projects")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res, err := colletion.UpdateOne(
		ctx,
		bson.M{"_id": ObjectID},
		bson.D{
			{"$set", bson.D{
				{"currentPhase", phaseID}}},
		},
	)
	if err != nil {
		fmt.Println(err)
	}
	return res
}

//UpdateProject exported
func (db *Database) UpdateProject(projectID string, input model.EditProject) *mongo.UpdateResult {
	ObjectID, err := primitive.ObjectIDFromHex(projectID)
	if err != nil {
		fmt.Println(err)
	}
	colletion := db.client.Database("Taskflow").Collection("projects")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res, err := colletion.UpdateOne(
		ctx,
		bson.M{"_id": ObjectID},
		bson.D{
			{"$set", bson.D{
				{"name", input.Name},
				{"description", input.Description},
				{"startdate", input.StartDate},
				{"enddate", input.EndDate},
				{"archived", input.Archived},
				{"projectleadid", input.ProjectLeadID},
				{"projectmonitorid", input.ProjectMonitorID},
				{"currentphase", input.CurrentPhase}}},
		},
	)
	if err != nil {
		fmt.Println(err)
	}
	return res
}

// ArchivePhase exported
func (db *Database) ArchivePhase(phaseID string, input model.ArchivePhase) *mongo.UpdateResult {
	ObjectID, err := primitive.ObjectIDFromHex(phaseID)
	if err != nil {
		fmt.Println(err)
	}
	collection := db.client.Database("Taskflow").Collection("phases")
	collection2 := db.client.Database("Taskflow").Collection("tasks")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	ctx2, cancel2 := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel2()
	res, err := collection.UpdateOne(
		ctx,
		bson.M{"_id": ObjectID},
		bson.D{
			{"$set", bson.D{
				{"archived", input.Archived}}},
		},
	)
	if err != nil {
		fmt.Println(err)
	}
	resTasks, err2 := collection2.UpdateMany(
		ctx2,
		bson.M{"phaseid": phaseID},
		bson.D{
			{"$set", bson.D{
				{"archived", input.Archived}}},
		},
	)
	if err2 != nil {
		fmt.Println(err)
	}
	fmt.Println("Number of tasks in phase archived:", resTasks.ModifiedCount)
	return res
}

// ArchiveProject exported
func (db *Database) ArchiveProject(projectID string, input model.ArchiveProject) *mongo.UpdateResult {
	ObjectID, err := primitive.ObjectIDFromHex(projectID)
	if err != nil {
		fmt.Println(err)
	}
	collection := db.client.Database("Taskflow").Collection("projects")
	phases := db.client.Database("Taskflow").Collection("phases")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res, err := collection.UpdateOne(
		ctx,
		bson.M{"_id": ObjectID},
		bson.D{
			{"$set", bson.D{
				{"archived", input.Archived}}},
		},
	)
	if err != nil {
		fmt.Println(err)
	}
	resPhases, err2 := phases.UpdateMany(
		ctx,
		bson.M{"projectid": projectID},
		bson.D{
			{"$set", bson.D{
				{"archived", input.Archived}}},
		},
	)
	if err2 != nil {
		fmt.Println(err2)
	}
	fmt.Println("Number of phases archived in project:", resPhases.ModifiedCount)
	return res
}

// ArchiveMany exported
func (db *Database) ArchiveTasksFromPhase(phaseID string, archive bool) *mongo.UpdateResult {
	collection := db.client.Database("Taskflow").Collection("tasks")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res, err := collection.UpdateMany(
		ctx,
		bson.M{"phaseid": phaseID},
		bson.D{
			{"$set", bson.D{
				{"archived", archive}}},
		},
	)
	if err != nil {
		fmt.Println(err)
	}
	fmt.Println("Number of tasks archived from phase:", res.ModifiedCount)
	return res
}

//SavePhaseToDB exported
func (db *Database) SavePhaseToDB(input model.NewPhase) *mongo.InsertOneResult {
	colletion := db.client.Database("Taskflow").Collection("phases")
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	res, err := colletion.InsertOne(ctx, input)
	if err != nil {
		fmt.Println(err)
	}
	return res
}

//UpdatePhase exported
func (db *Database) UpdatePhase(phaseID string, input model.EditPhase, collectionName string) *mongo.UpdateResult {
	ObjectID, err := primitive.ObjectIDFromHex(phaseID)
	if err != nil {
		fmt.Println(err)
	}
	colletion := db.client.Database("Taskflow").Collection(collectionName)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res, err := colletion.UpdateOne(
		ctx,
		bson.M{"_id": ObjectID},
		bson.D{
			{"$set", bson.D{
				{"name", input.Name},
				{"startdate", input.StartDate},
				{"enddate", input.EndDate}}},
		},
	)
	if err != nil {
		fmt.Println(err)
	}
	return res
}

//UpdateState exported
func (db *Database) UpdateState(phaseID string, states []string) *mongo.UpdateResult {
	ObjectID, err := primitive.ObjectIDFromHex(phaseID)
	if err != nil {
		fmt.Println(err)
	}
	colletion := db.client.Database("Taskflow").Collection("phases")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res, err := colletion.UpdateOne(
		ctx,
		bson.M{"_id": ObjectID},
		bson.D{
			{"$set", bson.D{
				{"states", states}}},
		},
	)
	if err != nil {
		fmt.Println(err)
	}
	return res
}

//UpdateStats exported
func (db *Database) UpdateStats(id string, progress int, weight int, collection string) *mongo.UpdateResult {
	ObjectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		fmt.Println(err)
	}
	colletion := db.client.Database("Taskflow").Collection(collection)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res, err := colletion.UpdateOne(
		ctx,
		bson.M{"_id": ObjectID},
		bson.D{
			{"$set", bson.D{
				{"progress", progress},
				{"weight", weight}}},
		},
	)
	if err != nil {
		fmt.Println(err)
	}
	return res
}

// FindAllGiven exported
func (db *Database) FindAllGiven(field string, searchTerm string, collection string, filterNotArchived bool) *mongo.Cursor {
	fmt.Println("Finding projects")
	colletion := db.client.Database("Taskflow").Collection(collection)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	options := options.Find()
	options.SetSort(bson.D{{"archived", 1}})
	if filterNotArchived {
		res, err := colletion.Find(ctx, bson.M{field: searchTerm, "archived": bson.M{"$ne": "done"}})
		if err != nil {
			fmt.Println(err)
		}
		return res
	} else {
		res, err := colletion.Find(ctx, bson.M{field: searchTerm})
		if err != nil {
			fmt.Println(err)
		}
		return res
	}
}

/*
// CheckForUserID exported
func (db *Database) CheckForUserID(userID string, collectionName string) *mongo.SingleResult {
	colletion := db.client.Database("Taskflow").Collection(collectionName)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	res := colletion.FindOne(ctx, bson.M{"_id": userID})
	return res
}*/
