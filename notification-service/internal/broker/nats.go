package broker

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/nats-io/nats.go"

	"github.com/kathputli/notification-service/internal/model"
	"github.com/kathputli/notification-service/internal/service"
)

const streamName = "KATHPUTLI_EVENTS"

type Broker struct {
	nc *nats.Conn
}

func New(nc *nats.Conn) *Broker {
	return &Broker{nc: nc}
}

// EnsureStream creates the shared JetStream stream if it does not exist.
// If the stream already exists, it adds any missing required subjects.
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

		log.Printf(
			"created JetStream stream %s with subjects: %v",
			streamName,
			required,
		)

		return nil
	}

	subjects := append([]string{}, stream.Config.Subjects...)

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
		}
	}

	if len(subjects) != len(stream.Config.Subjects) {
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

// StartConsumers starts the existing durable pull-based JetStream consumers.
func (b *Broker) StartConsumers(
	ctx context.Context,
	svc *service.Service,
) error {
	js, err := b.nc.JetStream()
	if err != nil {
		return fmt.Errorf("jetstream: %w", err)
	}

	// ------------------------------------------------------------
	// order.placed consumer
	// ------------------------------------------------------------

	orderConsumer, err := js.PullSubscribe(
		"order.placed",
		"notification-order-placed",
		nats.BindStream(streamName),
		nats.ManualAck(),
	)
	if err != nil {
		return fmt.Errorf(
			"order.placed consumer: %w",
			err,
		)
	}

	log.Printf(
		"notification consumer started: durable=notification-order-placed subject=order.placed mode=pull",
	)

	// ------------------------------------------------------------
	// payment.completed consumer
	// ------------------------------------------------------------

	paymentConsumer, err := js.PullSubscribe(
		"payment.completed",
		"notification-payment-completed",
		nats.BindStream(streamName),
		nats.ManualAck(),
	)
	if err != nil {
		_ = orderConsumer.Unsubscribe()

		return fmt.Errorf(
			"payment.completed consumer: %w",
			err,
		)
	}

	log.Printf(
		"notification consumer started: durable=notification-payment-completed subject=payment.completed mode=pull",
	)

	// Start background consumers.
	go consumeOrderPlaced(ctx, orderConsumer, svc)
	go consumePaymentCompleted(ctx, paymentConsumer, svc)

	return nil
}

// consumeOrderPlaced continuously fetches order.placed events.
func consumeOrderPlaced(
	ctx context.Context,
	consumer *nats.Subscription,
	svc *service.Service,
) {
	for {
		if ctx.Err() != nil {
			return
		}

		msgs, err := consumer.Fetch(
			1,
			nats.MaxWait(5*time.Second),
		)

		if err != nil {
			if ctx.Err() != nil {
				return
			}

			if err == nats.ErrTimeout {
				continue
			}

			log.Printf(
				"notification order.placed fetch failed: %v",
				err,
			)

			time.Sleep(time.Second)

			continue
		}

		for _, msg := range msgs {
			handleOrderPlaced(ctx, msg, svc)
		}
	}
}

// consumePaymentCompleted continuously fetches payment.completed events.
func consumePaymentCompleted(
	ctx context.Context,
	consumer *nats.Subscription,
	svc *service.Service,
) {
	for {
		if ctx.Err() != nil {
			return
		}

		msgs, err := consumer.Fetch(
			1,
			nats.MaxWait(5*time.Second),
		)

		if err != nil {
			if ctx.Err() != nil {
				return
			}

			if err == nats.ErrTimeout {
				continue
			}

			log.Printf(
				"notification payment.completed fetch failed: %v",
				err,
			)

			time.Sleep(time.Second)

			continue
		}

		for _, msg := range msgs {
			handlePaymentCompleted(ctx, msg, svc)
		}
	}
}

// handleOrderPlaced processes order.placed events.
func handleOrderPlaced(
	ctx context.Context,
	msg *nats.Msg,
	svc *service.Service,
) {
	log.Printf(
		"notification received event: subject=%s payload=%s",
		msg.Subject,
		string(msg.Data),
	)

	var event model.OrderPlacedEvent

	if err := json.Unmarshal(msg.Data, &event); err != nil {
		log.Printf(
			"notification order.placed invalid event: %v",
			err,
		)

		// Invalid payload will never become valid.
		_ = msg.Term()

		return
	}

	log.Printf(
		"processing order.placed: event_id=%s order_id=%s user_id=%s",
		event.EventID,
		event.OrderID,
		event.UserID,
	)

	if err := svc.CreateFromOrderPlaced(
		ctx,
		event,
	); err != nil {
		log.Printf(
			"notification order.placed handling failed: %v",
			err,
		)

		// Processing failed, so JetStream should redeliver.
		_ = msg.Nak()

		return
	}

	if err := msg.Ack(); err != nil {
		log.Printf(
			"notification order.placed ack failed: %v",
			err,
		)

		return
	}

	log.Printf(
		"notification order.placed processed successfully: order_id=%s",
		event.OrderID,
	)
}

// handlePaymentCompleted processes payment.completed events.
func handlePaymentCompleted(
	ctx context.Context,
	msg *nats.Msg,
	svc *service.Service,
) {
	log.Printf(
		"notification received event: subject=%s payload=%s",
		msg.Subject,
		string(msg.Data),
	)

	var event model.PaymentCompletedEvent

	if err := json.Unmarshal(msg.Data, &event); err != nil {
		log.Printf(
			"notification payment.completed invalid event: %v",
			err,
		)

		// Invalid payload will never become valid.
		_ = msg.Term()

		return
	}

	log.Printf(
		"processing payment.completed: event_id=%s payment_id=%s order_id=%s customer_id=%s",
		event.EventID,
		event.PaymentID,
		event.OrderID,
		event.CustomerID,
	)

	if err := svc.CreateFromPaymentCompleted(
		ctx,
		event,
	); err != nil {
		log.Printf(
			"notification payment.completed handling failed: %v",
			err,
		)

		// Processing failed, so JetStream should redeliver.
		_ = msg.Nak()

		return
	}

	if err := msg.Ack(); err != nil {
		log.Printf(
			"notification payment.completed ack failed: %v",
			err,
		)

		return
	}

	log.Printf(
		"notification payment.completed processed successfully: payment_id=%s order_id=%s",
		event.PaymentID,
		event.OrderID,
	)
}
