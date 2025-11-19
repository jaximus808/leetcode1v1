package broker

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/confluentinc/confluent-kafka-go/v2/kafka"
	"github.com/cse4207-fall-2025/finalproject-jujujaju/app/matchmaker/internal/config"
	"github.com/cse4207-fall-2025/finalproject-jujujaju/app/matchmaker/internal/game"
)

type KafkaProducer struct {
	producer *kafka.Producer
}

func CreateKafkaProducer(brokers string) (*KafkaProducer, error) {
	config := &kafka.ConfigMap{
		"bootstrap.servers": brokers,
		"client.id":         "matchmaker-producer",
		"acks":              "all", // Wait for all replicas
	}

	producer, err := kafka.NewProducer(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create producer: %w", err)
	}
	go func() {
		for e := range producer.Events() {
			switch ev := e.(type) {
			case *kafka.Message:
				if ev.TopicPartition.Error != nil {
					log.Printf("Delivery failed: %v\n", ev.TopicPartition.Error)
				} else {
					log.Printf("Delivered message to %v\n", ev.TopicPartition)
				}
			}
		}
	}()

	return &KafkaProducer{producer: producer}, nil
}

func (kp *KafkaProducer) PublishUpdate(update *game.QueueUpdates) error {
	data, err := json.Marshal(update)
	if err != nil {
		return fmt.Errorf("Failed to marshal data %s", err.Error())
	}

	msg := &kafka.Message{
		TopicPartition: kafka.TopicPartition{
			Topic:     &config.TopicQueueUpdate,
			Partition: kafka.PartitionAny,
		},
		Key:   []byte(update.PlayerID),
		Value: data,
	}

	err = kp.producer.Produce(msg, nil)
	if err != nil {
		return fmt.Errorf("failed to produce message: %s", err.Error())
	}
	return nil
}

func (kp *KafkaProducer) PublishMatch(match *game.Match) error {
	data, err := json.Marshal(match)
	if err != nil {
		return fmt.Errorf("failed to marshal data %s", err.Error())
	}

	msg := &kafka.Message{
		TopicPartition: kafka.TopicPartition{
			Topic:     &config.TopicMatchFound,
			Partition: kafka.PartitionAny,
		},
		Key:   []byte(match.MatchID),
		Value: data,
	}

	err = kp.producer.Produce(msg, nil)
	if err != nil {
		return fmt.Errorf("failed to produce message: %s", err.Error())
	}
	return err
}

func (kp *KafkaProducer) Close() {
	// Wait for outstanding messages to be delivered
	kp.producer.Flush(15 * 1000) // 15 seconds
	kp.producer.Close()
}
