package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/accarlsen/gqlgen-todos/auth"
	"github.com/accarlsen/gqlgen-todos/graph"
	"github.com/accarlsen/gqlgen-todos/graph/generated"
	"github.com/go-chi/chi"
	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
)

func main() {
	errLoad := godotenv.Load()
	if errLoad != nil {
		fmt.Println("Error loading .env file, This means that you are running in production mode. If you are running in development mode, then something is wrong:", errLoad)
	}
	app_env := os.Getenv("APP_ENV")
	if os.Getenv("APP_ENV") == "production" || app_env == "production" {
		fmt.Println("Produciton mode is turned on")
	} else {
		fmt.Println("We are in development mode")
	}
	localHost := os.Getenv("FRONTEND_HOST")
	router := chi.NewRouter()
	router.Use(cors.New(cors.Options{
		AllowedOrigins:   []string{"<CLIENT-URL>"},
		AllowCredentials: true,
		Debug:            false,
	}).Handler)
	router.Use(auth.Middleware())

	srv := handler.NewDefaultServer(generated.NewExecutableSchema(generated.Config{Resolvers: &graph.Resolver{}}))
	srv.AddTransport(&transport.Websocket{
		Upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				// Check against your desired domains here
				return r.Host == localHost
			},
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
		},
	})
	router.Handle("/", playground.Handler("Taskflow", "/query"))
	router.Handle("/query", srv)

	fmt.Println("Starting server")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	err := http.ListenAndServe(fmt.Sprintf(":%s", port), router)
	if err != nil {
		panic(err)
	}
}
