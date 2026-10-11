package broker

import (
    "encoding/json"
    "fmt"
    "sort"

    "github.com/nats-io/nats.go"
    "github.com/kathputli/artwork-service/internal/model"
)

const (
    StreamName = "KATHPUTLI_EVENTS"
    Subject = "artwork.created"
)

var requiredSubjects = []string{
    "user.>", "artist.>", "artwork.>", "order.>", "payment.>", "delivery.>",
}

type Client struct { nc *nats.Conn; js nats.JetStreamContext }

func New(url string) (*Client, error) {
    nc, err := nats.Connect(url)
    if err != nil { return nil, err }
    js, err := nc.JetStream()
    if err != nil { nc.Close(); return nil, err }
    return &Client{nc:nc, js:js}, nil
}

func (c *Client) Close() {
    if c.nc == nil { return }
    _ = c.nc.Drain()
    c.nc.Close()
}

func (c *Client) EnsureStream() error {
    info, err := c.js.StreamInfo(StreamName)
    if err != nil {
        if _, err := c.js.AddStream(&nats.StreamConfig{
            Name: StreamName, Subjects: requiredSubjects,
            Storage: nats.FileStorage, Retention: nats.LimitsPolicy,
        }); err != nil {
            return fmt.Errorf("create stream %s: %w", StreamName, err)
        }
        return nil
    }

    subjects := append([]string(nil), info.Config.Subjects...)
    for _, required := range requiredSubjects {
        if !contains(subjects, required) { subjects = append(subjects, required) }
    }
    if sameSubjects(subjects, info.Config.Subjects) { return nil }

    updated := info.Config
    updated.Subjects = subjects
    if _, err := c.js.UpdateStream(&updated); err != nil {
        return fmt.Errorf("update stream %s: %w", StreamName, err)
    }
    return nil
}

func (c *Client) PublishArtworkCreated(event model.ArtworkCreatedEvent) error {
    payload, err := json.Marshal(event)
    if err != nil { return fmt.Errorf("marshal artwork.created event: %w", err) }
    if _, err := c.js.Publish(Subject, payload); err != nil {
        return fmt.Errorf("publish artwork.created event: %w", err)
    }
    return nil
}

func contains(items []string, value string) bool {
    for _, item := range items { if item == value { return true } }
    return false
}

func sameSubjects(a,b []string) bool {
    left := append([]string(nil),a...)
    right := append([]string(nil),b...)
    sort.Strings(left); sort.Strings(right)
    if len(left) != len(right) { return false }
    for i := range left { if left[i] != right[i] { return false } }
    return true
}
