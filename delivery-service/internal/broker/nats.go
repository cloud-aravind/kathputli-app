package broker

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/nats-io/nats.go"

	"github.com/kathputli/delivery-service/internal/model"
)

const streamName = "KATHPUTLI_EVENTS"

type Broker struct {
	nc *nats.Conn
}

func New(nc *nats.Conn) *Broker {
	return &Broker{nc: nc}
}

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

		_, err = js.AddStream(&nats.StreamConfig{
			Name:      streamName,
			Subjects:  required,
			Storage:   nats.FileStorage,
			Retention: nats.LimitsPolicy,
		})
		if err != nil {
			return fmt.Errorf("add stream: %w", err)
		}
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
	}

	return nil
}

func (b *Broker) StartConsumers(
	ctx context.Context,
	userHandler func(context.Context, model.UserCreatedEvent) error,
	paymentHandler func(context.Context, model.PaymentCompletedEvent) error,
) error {
	js, err := b.nc.JetStream()
	if err != nil {
		return fmt.Errorf("jetstream: %w", err)
	}

	userConsumer, err := js.PullSubscribe(
		"user.created",
		"delivery-service-user-created",
		nats.BindStream(streamName),
		nats.ManualAck(),
	)
	if err != nil {
		return fmt.Errorf("user.created consumer: %w", err)
	}

	paymentConsumer, err := js.PullSubscribe(
		"payment.completed",
		"delivery-service-payment-completed",
		nats.BindStream(streamName),
		nats.ManualAck(),
	)
	if err != nil {
		return fmt.Errorf("payment.completed consumer: %w", err)
	}

	log.Printf("delivery consumer started: user.created + payment.completed")

	go consumeUserCreated(ctx, userConsumer, userHandler)
	go consumePaymentCompleted(ctx, paymentConsumer, paymentHandler)

	return nil
}

func consumeUserCreated(
	ctx context.Context,
	consumer *nats.Subscription,
	handler func(context.Context, model.UserCreatedEvent) error,
) {
	for {
		if ctx.Err() != nil {
			return
		}

		messages, err := consumer.Fetch(1, nats.MaxWait(5*time.Second))
		if err != nil {
			if ctx.Err() != nil || err == nats.ErrTimeout {
				continue
			}
			log.Printf("user.created fetch failed: %v", err)
			time.Sleep(time.Second)
			continue
		}

		for _, msg := range messages {
			var event model.UserCreatedEvent
			if err := json.Unmarshal(msg.Data, &event); err != nil {
				log.Printf("invalid user.created event: %v", err)
				_ = msg.Term()
				continue
			}

			if err := handler(ctx, event); err != nil {
				log.Printf("user.created handling failed: %v", err)
				_ = msg.Nak()
				continue
			}

			if err := msg.Ack(); err != nil {
				log.Printf("user.created ack failed: %v", err)
			}
		}
	}
}

func consumePaymentCompleted(
	ctx context.Context,
	consumer *nats.Subscription,
	handler func(context.Context, model.PaymentCompletedEvent) error,
) {
	for {
		if ctx.Err() != nil {
			return
		}

		messages, err := consumer.Fetch(1, nats.MaxWait(5*time.Second))
		if err != nil {
			if ctx.Err() != nil || err == nats.ErrTimeout {
				continue
			}
			log.Printf("payment.completed fetch failed: %v", err)
			time.Sleep(time.Second)
			continue
		}

		for _, msg := range messages {
			var event model.PaymentCompletedEvent
			if err := json.Unmarshal(msg.Data, &event); err != nil {
				log.Printf("invalid payment.completed event: %v", err)
				_ = msg.Term()
				continue
			}

			if err := handler(ctx, event); err != nil {
				log.Printf("payment.completed handling failed: %v", err)
				_ = msg.Nak()
				continue
			}

			if err := msg.Ack(); err != nil {
				log.Printf("payment.completed ack failed: %v", err)
			}
		}
	}
}

func (b *Broker) Publish(subject string, payload []byte) error {
	js, err := b.nc.JetStream()
	if err != nil {
		return fmt.Errorf("jetstream: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if _, err := js.Publish(subject, payload, nats.Context(ctx)); err != nil {
		return fmt.Errorf("publish %s: %w", subject, err)
	}

	log.Printf("event published: subject=%s", subject)
	return nil
}
