package broker

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/nats-io/nats.go"

	"github.com/kathputli/order-service/internal/model"
)

const (
	streamName              = "KATHPUTLI_EVENTS"
	PaymentCompletedSubject = "payment.completed"
	PaymentFailedSubject    = "payment.failed"
	PaymentStatusConsumer   = "order-service-payment-status"
)

type Broker struct {
	nc *nats.Conn
}

func New(nc *nats.Conn) *Broker {
	return &Broker{nc: nc}
}

// EnsureStream creates the shared Kathputli event stream if it does not exist.
// If it already exists, any missing required subjects are added.
func (b *Broker) EnsureStream(ctx context.Context) error {
	js, err := b.nc.JetStream()
	if err != nil {
		return fmt.Errorf("jetstream: %w", err)
	}

	required := []string{
		"user.>",
		"artist.>",
		"artwork.>",
		"order.>",
		"payment.>",
		"delivery.>",
	}

	stream, err := js.StreamInfo(streamName)
	if err != nil {
		if err != nats.ErrStreamNotFound {
			return fmt.Errorf("stream info: %w", err)
		}

		if _, err := js.AddStream(&nats.StreamConfig{
			Name:      streamName,
			Subjects:  required,
			Storage:   nats.FileStorage,
			Retention: nats.LimitsPolicy,
		}); err != nil {
			return fmt.Errorf("add stream: %w", err)
		}

		log.Printf(
			"created JetStream stream: %s",
			streamName,
		)

		return nil
	}

	subjects := append([]string{}, stream.Config.Subjects...)
	changed := false

	for _, requiredSubject := range required {
		found := false

		for _, existing := range subjects {
			if existing == requiredSubject {
				found = true
				break
			}
		}

		if !found {
			subjects = append(subjects, requiredSubject)
			changed = true
		}
	}

	if changed {
		cfg := stream.Config
		cfg.Subjects = subjects

		if _, err := js.UpdateStream(&cfg); err != nil {
			return fmt.Errorf("update stream: %w", err)
		}

		log.Printf(
			"updated JetStream stream %s subjects: %v",
			streamName,
			subjects,
		)
	}

	return nil
}

// PublishOrderPlaced publishes the event emitted when an order is created.
func (b *Broker) PublishOrderPlaced(
	event model.OrderPlacedEvent,
) error {
	payload, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("marshal order.placed event: %w", err)
	}

	js, err := b.nc.JetStream()
	if err != nil {
		return fmt.Errorf("jetstream: %w", err)
	}

	ctx, cancel := context.WithTimeout(
		context.Background(),
		5*time.Second,
	)
	defer cancel()

	if _, err := js.Publish(
		"order.placed",
		payload,
		nats.Context(ctx),
	); err != nil {
		return fmt.Errorf("publish order.placed: %w", err)
	}

	log.Printf(
		"event published: subject=order.placed order_id=%s",
		event.OrderID,
	)

	return nil
}

type PaymentEventHandler interface {
	HandlePaymentEvent(context.Context, string, model.PaymentEvent) error
}

// StartPaymentStatusConsumer handles completion and failure events with one
// durable consumer. JetStream redelivers unacknowledged events after errors.
func (b *Broker) StartPaymentStatusConsumer(ctx context.Context, handler PaymentEventHandler) error {
	js, err := b.nc.JetStream()
	if err != nil {
		return fmt.Errorf("jetstream: %w", err)
	}
	consumer, err := js.PullSubscribe(
		"payment.*",
		PaymentStatusConsumer,
		nats.BindStream(streamName),
		nats.ManualAck(),
		nats.AckWait(30*time.Second),
		nats.MaxDeliver(5),
	)
	if err != nil {
		return fmt.Errorf("payment status consumer: %w", err)
	}
	go consumePaymentStatus(ctx, consumer, handler)
	return nil
}

func consumePaymentStatus(ctx context.Context, consumer *nats.Subscription, handler PaymentEventHandler) {
	for ctx.Err() == nil {
		messages, err := consumer.Fetch(1, nats.MaxWait(5*time.Second))
		if err != nil {
			if ctx.Err() != nil || err == nats.ErrTimeout {
				continue
			}
			log.Printf("payment status fetch failed: %v", err)
			time.Sleep(time.Second)
			continue
		}

		for _, msg := range messages {
			var event model.PaymentEvent
			if err := json.Unmarshal(msg.Data, &event); err != nil {
				log.Printf("invalid payment event: %v", err)
				_ = msg.Term()
				continue
			}
			if err := handler.HandlePaymentEvent(ctx, msg.Subject, event); err != nil {
				log.Printf("payment event handling failed: subject=%s order_id=%s: %v", msg.Subject, event.OrderID, err)
				_ = msg.NakWithDelay(time.Second)
				continue
			}
			if err := msg.Ack(); err != nil {
				log.Printf("payment event ack failed: subject=%s order_id=%s: %v", msg.Subject, event.OrderID, err)
			}
		}
	}
}
