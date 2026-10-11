package broker

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/nats-io/nats.go"
	"github.com/kathputli/payment-service/internal/model"
)

const (
	StreamName          = "KATHPUTLI_EVENTS"
	OrderPlacedSubject  = "order.placed"
	PaymentCreated      = "payment.created"
	PaymentCompleted    = "payment.completed"
	PaymentFailed       = "payment.failed"
	ConsumerName        = "payment-service-order-placed"
)

var requiredSubjects = []string{
	"user.>",
	"artist.>",
	"artwork.>",
	"order.>",
	"payment.>",
	"delivery.>",
}

func EnsureStream(js nats.JetStreamContext) error {
	cfg := &nats.StreamConfig{
		Name:     StreamName,
		Subjects: requiredSubjects,
		Storage:  nats.FileStorage,
		MaxAge:   7 * 24 * time.Hour,
	}

	info, err := js.StreamInfo(StreamName)
	if err != nil {
		if err != nats.ErrStreamNotFound {
			return fmt.Errorf("stream info: %w", err)
		}
		_, err = js.AddStream(cfg)
		if err != nil {
			return fmt.Errorf("add stream: %w", err)
		}
		return nil
	}

	subjectSet := map[string]bool{}
	for _, s := range info.Config.Subjects {
		subjectSet[s] = true
	}
	changed := false
	for _, s := range requiredSubjects {
		if !subjectSet[s] {
			info.Config.Subjects = append(info.Config.Subjects, s)
			changed = true
		}
	}
	if changed {
		if _, err := js.UpdateStream(&info.Config); err != nil {
			return fmt.Errorf("update stream: %w", err)
		}
	}
	return nil
}

type PaymentService interface {
	HandleOrderPlaced(event model.OrderPlacedEvent) error
}

func StartOrderPlacedConsumer(js nats.JetStreamContext, svc PaymentService) error {
	sub, err := js.Subscribe(
		OrderPlacedSubject,
		func(msg *nats.Msg) {
			var event model.OrderPlacedEvent
			if err := json.Unmarshal(msg.Data, &event); err != nil {
				log.Printf("invalid order.placed event: %v", err)
				_ = msg.Term()
				return
			}

			if err := svc.HandleOrderPlaced(event); err != nil {
				log.Printf("handle order.placed: %v", err)
				_ = msg.Nak()
				return
			}
			_ = msg.Ack()
		},
		nats.Durable(ConsumerName),
		nats.ManualAck(),
		nats.AckExplicit(),
		nats.MaxDeliver(3),
		nats.AckWait(30*time.Second),
	)
	if err != nil {
		return fmt.Errorf("subscribe order.placed: %w", err)
	}

	_ = sub
	return nil
}

func PublishPaymentEvent(js nats.JetStreamContext, subject string, event model.PaymentEvent) error {
	data, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("marshal payment event: %w", err)
	}
	if _, err := js.Publish(subject, data); err != nil {
		return fmt.Errorf("publish %s: %w", subject, err)
	}
	return nil
}

func NewEventID() string {
	return uuid.NewString()
}
