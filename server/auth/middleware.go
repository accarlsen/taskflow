package auth

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"reflect"
	"time"

	db "github.com/accarlsen/gqlgen-todos/db"
	jwt "github.com/dgrijalva/jwt-go"
	"github.com/joho/godotenv"
)

// A private key for context that only this package can access. This is important
// to prevent collisions between different context uses
var userCtxKey = &contextKey{"user"}

var issuer = []byte("secret")

type contextKey struct {
	name string
}

var databaseCon = db.Connect("<MONGODB-CONNECTION-URL>")

// A stand-in for our database backed user object

func validateAndGetUserID(c *http.Cookie) (string, float64, float64, error) {
	toki, err := jwt.Parse(c.Value, func(token *jwt.Token) (interface{}, error) {
		return issuer, nil
	})

	if err != nil {
		fmt.Println("Error on parsing token: ", err, "..", c.Value)
	}

	if claims, ok := toki.Claims.(jwt.MapClaims); ok && toki.Valid {

		if claims == nil {
			return "-1", 0, 0, nil
		}
		timeNow := float64(time.Now().Unix())
		timeToken, ok := claims["tokenExpiration"]
		if ok != true {
			fmt.Println("Could not fetch token expiration time", err)
		}

		if err != nil {
			fmt.Println(err)
		}
		if timeToken.(float64)-timeNow > 0 {
			if reflect.TypeOf(claims["owner"]) != nil && reflect.TypeOf(claims["admin"]) != nil {
				return claims["userID"].(string), claims["owner"].(float64), claims["admin"].(float64), nil
			}
			return claims["userID"].(string), 0, 0, nil
		} else {
			return "", 0, 0, nil
		}
	}
	return "", 0, 0, nil
}

// AuthResponseWriter exported
type AuthResponseWriter struct {
	Writer           http.ResponseWriter
	UserIDToResolver string
	UserIDFromCookie string
}
type Vars struct {
	Writer http.ResponseWriter
	UserId string
	Owner  float64
	Admin  float64
}

//
func (w *Vars) Write(accessToken string, refreshToken string, maxAge int) {
	errLoad := godotenv.Load()
	if errLoad != nil {
		fmt.Println(errLoad)
	}
	domain := os.Getenv("DOMAIN")
	fmt.Println("Domain: ", domain)
	http.SetCookie(w.Writer, &http.Cookie{
		Name:     "accessToken",
		Secure:   true,
		Value:    accessToken,
		HttpOnly: false,
		Path:     "/",
		Domain:   domain,
		SameSite: 4,
		MaxAge:   maxAge,
	})
	http.SetCookie(w.Writer, &http.Cookie{
		Name:     "refreshToken",
		Secure:   true,
		Value:    refreshToken,
		HttpOnly: false,
		Path:     "/",
		Domain:   domain,
		SameSite: 4,
		MaxAge:   maxAge,
	})

	/* Same site choices
	SameSiteDefaultMode SameSite = iota + 1   //1
	SameSiteLaxMode                           //2  lax
	SameSiteStrictMode                        //3  strict
	SameSiteNoneMode                          //4  none
	*/
}

// Middleware decodes the share session cookie and packs the session into context
func Middleware() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			c, err := r.Cookie("accessToken")
			// Allow unauthenticated users in
			if err != nil || c == nil || c.Value == "" {
				ctx := context.WithValue(r.Context(), userCtxKey, Vars{Writer: w, UserId: "", Owner: 0, Admin: 0})
				r = r.WithContext(ctx)
				next.ServeHTTP(w, r)
				return
			}

			userId, owner, admin, err := validateAndGetUserID(c)
			if err != nil {
				http.Error(w, "Invalid cookie", http.StatusForbidden)
				return
			}

			// put it in context
			ctx := context.WithValue(r.Context(), userCtxKey, Vars{Writer: w, UserId: userId, Owner: owner, Admin: admin})

			// and call the next with our new context
			r = r.WithContext(ctx)
			next.ServeHTTP(w, r)
		})
	}
}

// ForContext finds the user from the context. REQUIRES Middleware to have run.
func ForContext(ctx context.Context) Vars {
	raw, _ := ctx.Value(userCtxKey).(Vars)
	return raw
}
