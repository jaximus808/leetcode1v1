package broker

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/segmentio/kafka-go"
	"github.com/cse4207-fall-2025/finalproject-jujujaju/app/matchmaker/internal/game"
)

type KafkaConsumer struct {
	reader *kafka.Reader
}

func CreateKafkaConsumer(brokers string, groupID string, topics []string) (*KafkaConsumer, error) {
	// Kafka-go will auto-create topics if configured on the broker
	// No need for admin client in simple setup

	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:        []string{brokers},
		GroupID:        groupID,
		Topic:          topics[0], // kafka-go Reader handles one topic
		MinBytes:       10e3,      // 10KB
		MaxBytes:       10e6,      // 10MB
		CommitInterval: time.Second,
		StartOffset:    kafka.FirstOffset,
	})

	return &KafkaConsumer{reader: reader}, nil
}

func (kc *KafkaConsumer) ConsumeMessages(ctx context.Context, handler func(*game.MatchRequest) error) error {
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
			msg, err := kc.reader.ReadMessage(ctx)
			if err != nil {
				if err == context.Canceled || err == context.DeadlineExceeded {
					return err
				}
				log.Printf("Consumer error: %v\n", err)
				time.Sleep(time.Second) // Back off on error
				continue
			}

			// Parse the message
			var request game.MatchRequest
			err = json.Unmarshal(msg.Value, &request)
			if err != nil {
				log.Printf("Failed to unmarshal message: %v\n", err)
				continue
			}
			request.Timestamp = time.Now().Unix()

			// Process the message
			err = handler(&request)
			if err != nil {
				log.Printf("Failed to handle message: %v\n", err)
				continue
			}

			// Message is auto-committed by the reader based on CommitInterval
		}
	}
}

// Close closes the consumer
func (kc *KafkaConsumer) Close() {
	if err := kc.reader.Close(); err != nil {
		log.Printf("Failed to close reader: %v", err)
	}
}
