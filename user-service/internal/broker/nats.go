package broker

import (
	"context"
	"encoding/json"
	"sort"
	"github.com/kathputli/user-service/internal/model"
	"github.com/nats-io/nats.go"
	"time"
)

const StreamName = "KATHPUTLI_EVENTS"
const UserCreatedSubject = "user.created"
const ConsumerName = "user-service"

type EventConsumer interface {
	CreateFromEvent(context.Context, model.UserCreatedEvent) error
}
type Client struct {
	conn *nats.Conn
	js   nats.JetStreamContext
}

func NewClient(url string) (*Client, error) {
	conn, err := nats.Connect(url, nats.Name("kathputli-user-service"))
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
		if !contains(subjects, requiredSubject) { subjects = append(subjects, requiredSubject) }
	}
	if sameSubjects(subjects, info.Config.Subjects) { return nil }
	updated := info.Config
	updated.Subjects = subjects
	_, err = c.js.UpdateStream(&updated)
	return err
}

func contains(items []string, value string) bool { for _, item := range items { if item == value { return true } }; return false }
func sameSubjects(a, b []string) bool {
	left := append([]string(nil), a...); right := append([]string(nil), b...)
	sort.Strings(left); sort.Strings(right)
	if len(left) != len(right) { return false }
	for i := range left { if left[i] != right[i] { return false } }
	return true
}

func (c *Client) StartUserCreatedConsumer(s EventConsumer) error {
	_, err := c.js.Subscribe(UserCreatedSubject, func(msg *nats.Msg) {
		var event model.UserCreatedEvent
		if err := json.Unmarshal(msg.Data, &event); err != nil {
			_ = msg.Nak()
			return
		}
		if err := s.CreateFromEvent(context.Background(), event); err != nil {
			_ = msg.Nak()
			return
		}
		_ = msg.Ack()
	}, nats.Durable(ConsumerName), nats.ManualAck(), nats.AckExplicit(),
		nats.MaxDeliver(5), nats.AckWait(30*time.Second))
	return err
}
