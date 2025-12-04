package broker

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/segmentio/kafka-go"
	"github.com/cse4207-fall-2025/finalproject-jujujaju/app/matchmaker/internal/config"
	"github.com/cse4207-fall-2025/finalproject-jujujaju/app/matchmaker/internal/game"
)

type KafkaProducer struct {
	writer *kafka.Writer
}

func CreateKafkaProducer(brokers string) (*KafkaProducer, error) {
	writer := &kafka.Writer{
		Addr:         kafka.TCP(brokers),
		Balancer:     &kafka.LeastBytes{},
		RequiredAcks: kafka.RequireAll,
		Async:        false, // Synchronous writes for reliability
	}

	return &KafkaProducer{writer: writer}, nil
}

func (kp *KafkaProducer) PublishUpdate(update *game.QueueUpdates) error {
	data, err := json.Marshal(update)
	if err != nil {
		return fmt.Errorf("failed to marshal data: %w", err)
	}

	msg := kafka.Message{
		Topic: config.TopicQueueUpdate,
		Key:   []byte(update.PlayerID),
		Value: data,
		Time:  time.Now(),
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err = kp.writer.WriteMessages(ctx, msg)
	if err != nil {
		return fmt.Errorf("failed to produce message: %w", err)
	}

	log.Printf("Published queue update for player %s", update.PlayerID)
	return nil
}

func (kp *KafkaProducer) PublishMatch(match *game.MatchBatch) error {
	data, err := json.Marshal(match)
	if err != nil {
		return fmt.Errorf("failed to marshal data: %w", err)
	}

	key := fmt.Sprintf("batch-%d", time.Now().Unix())
	msg := kafka.Message{
		Topic: config.TopicMatchFound,
		Key:   []byte(key),
		Value: data,
		Time:  time.Now(),
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err = kp.writer.WriteMessages(ctx, msg)
	if err != nil {
		return fmt.Errorf("failed to produce message: %w", err)
	}

	log.Printf("Published match batch with %d groups", len(match.Groups))
	return nil
}

func (kp *KafkaProducer) Close() {
	if err := kp.writer.Close(); err != nil {
		log.Printf("Failed to close writer: %v", err)
	}
}
