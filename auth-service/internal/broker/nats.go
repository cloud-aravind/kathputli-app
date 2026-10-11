package broker

import (
	"encoding/json"
	"github.com/nats-io/nats.go"
	"sort"
	"time"
)

const StreamName = "KATHPUTLI_EVENTS"
const UserCreatedSubject = "user.created"

type Client struct {
	conn *nats.Conn
	js   nats.JetStreamContext
}

func NewClient(url string) (*Client, error) {
	conn, err := nats.Connect(url, nats.Name("kathputli-auth-service"))
	if err != nil {
		return nil, err
	}
	js, err := conn.JetStream()
	if err != nil {
		conn.Close()
		return nil, err
	}
	return &Client{conn: conn, js: js}, nil
}
func (c *Client) Close() { _ = c.conn.Drain() }
func (c *Client) EnsureStream() error {
	required := []string{"user.>", "artist.>", "artwork.>", "order.>", "payment.>", "delivery.>"}
	info, err := c.js.StreamInfo(StreamName)
	if err != nil {
		_, err = c.js.AddStream(&nats.StreamConfig{Name: StreamName, Subjects: required, Storage: nats.FileStorage, Retention: nats.LimitsPolicy, MaxAge: 7 * 24 * time.Hour, Replicas: 1, Discard: nats.DiscardOld, MaxMsgs: 100000})
		return err
	}
	subjects := append([]string(nil), info.Config.Subjects...)
	for _, requiredSubject := range required {
		if !contains(subjects, requiredSubject) {
			subjects = append(subjects, requiredSubject)
		}
	}
	if sameSubjects(subjects, info.Config.Subjects) {
		return nil
	}
	updated := info.Config
	updated.Subjects = subjects
	_, err = c.js.UpdateStream(&updated)
	return err
}

func contains(items []string, value string) bool {
	for _, item := range items {
		if item == value {
			return true
		}
	}
	return false
}
func sameSubjects(a, b []string) bool {
	left := append([]string(nil), a...)
	right := append([]string(nil), b...)
	sort.Strings(left)
	sort.Strings(right)
	if len(left) != len(right) {
		return false
	}
	for i := range left {
		if left[i] != right[i] {
			return false
		}
	}
	return true
}
func (c *Client) PublishUserCreated(event interface{}) error {
	payload, err := json.Marshal(event)
	if err != nil {
		return err
	}
	if _, err = c.js.Publish(UserCreatedSubject, payload); err != nil {
		return err
	}
	return nil
}
