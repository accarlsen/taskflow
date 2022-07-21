# Taskflow

Taskflow is a collaborative task- and project management tool made with **Golang**, **GraphQL**, **React** and **MongoDB**. The purpose of the software is to improve the communication of task interdependencies in software projects. In order to do this, the software tool incorperates the unique aspect of using **interactive flowcharts** as well as tradional task lists to communicate complex interdependencies of assignments and tasks that constitute larger projects and use the underlying directional graph datastructure to filter out unneccesary information at the different stages of projects. 

This project was part of the bachelor thesis of Mohammed Al Nayef, Gaute Wierød Rønning and myself. The **fullstack** software solution was used in our experiments as well as tested by software teams from Trygg Forsikring and Equinor. The research paper resulting of this work can be found [here](https://ntnuopen.ntnu.no/ntnu-xmlui/bitstream/handle/11250/2778050/no.ntnu%3ainspera%3a83510435%3a83529130.pdf?sequence=1&isAllowed=y).



## System Architecture
The project consists of a client using javascript, HTML and CSS together with the frameworks ReactJS and Apollo Client. The client communicates with teh server using GraphQL. The server is made in **golang** with the framework **gqlgen** to enable handling of GraphQL requests and responses. 


![taskflow-system-architecture](https://user-images.githubusercontent.com/50367062/180308112-e0e1dee4-30a6-4813-a956-789189f29b17.JPG)

## Installation

### Client installation & configuration

The client requires NodeJS. If you don't have it, we recomment getting the latest version from [here](https://nodejs.org/en/download/).

Step 1: In the /client folder of the project, add an .env file and add the following variable: `REACT_APP_BACKENDHOST = <SERVER-URL>`

Step 2: Run the following command in the /client folder to download packages: `npm i`

Step 3: In order to start the client, run: `npm start`

<br></br>
### Server installation & configuration

The server requires installing golang on your computer. Newest version of golang can be found [here](https://golang.org/dl/).

Step 1: Add a .env file to the /server folder and define the follwing variables:

`FRONTEND_HOST= <CLIENT-URL>`
`DOMAIN = <CLIENT-DOMAIN>`

The domain field is used by the server to set cookies.

Step 2: Run the following command in the /server folder to download packages: `go get`

Step 3: In order to start the server, run: `go run server.go`

Step 4: In order to generate new models after changing the schema, run: `go run github.com/99designs/gqlgen init`

<br></br>
### Notable external libraries:
- [gqlgen](https://github.com/99designs/gqlgen)
- [jwt-go](https://github.com/dgrijalva/jwt-go) for golang
- [jwt-decode](https://www.npmjs.com/package/jwt-decode) for javascript
- [graphql](https://www.npmjs.com/package/graphql)
- [react-flow-renderer](https://www.npmjs.com/package/react-flow-renderer)
- [react-spring](https://www.npmjs.com/package/react-spring)
- [apollo-client](https://www.npmjs.com/package/@apollo/client)
