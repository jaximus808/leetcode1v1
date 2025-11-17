package broker

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/confluentinc/confluent-kafka-go/v2/kafka"
	"github.com/cse4207-fall-2025/finalproject-jujujaju/app/matchmaker/internal/game"
)

type KafkaConsumer struct {
	consumer *kafka.Consumer
}

func createTopicsIfNotExist(brokers string, topics []string) error {
	adminClient, err := kafka.NewAdminClient(&kafka.ConfigMap{
		"bootstrap.servers": brokers,
	})
	if err != nil {
		return fmt.Errorf("failed to create admin client: %w", err)
	}
	defer adminClient.Close()

	// Prepare topic specifications
	var topicSpecs []kafka.TopicSpecification
	for _, topic := range topics {
		topicSpecs = append(topicSpecs, kafka.TopicSpecification{
			Topic:             topic,
			NumPartitions:     1,
			ReplicationFactor: 1,
		})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	results, err := adminClient.CreateTopics(
		ctx,
		topicSpecs,
		kafka.SetAdminOperationTimeout(10*time.Second),
	)
	if err != nil {
		return fmt.Errorf("failed to create topics: %w", err)
	}

	// Check results
	for _, result := range results {
		if result.Error.Code() != kafka.ErrNoError && result.Error.Code() != kafka.ErrTopicAlreadyExists {
			log.Printf("Failed to create topic %s: %v", result.Topic, result.Error)
		} else {
			log.Printf("Topic %s ready", result.Topic)
		}
	}

	return nil
}

func CreateKafkaConsumer(brokers string, groupID string, topics []string) (*KafkaConsumer, error) {
	err := createTopicsIfNotExist(brokers, topics)
	if err != nil {
		log.Printf("Warning: failed to create topics: %v", err)
		// Continue anyway - topics might already exist or auto-create might be enabled
	}

	config := &kafka.ConfigMap{
		"bootstrap.servers":  brokers,
		"group.id":           groupID,
		"auto.offset.reset":  "earliest",
		"enable.auto.commit": false,
	}

	consumer, err := kafka.NewConsumer(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create consumer: %w", err)
	}

	err = consumer.SubscribeTopics(topics, nil)
	if err != nil {
		consumer.Close()
		return nil, fmt.Errorf("failed to subscribe to topics: %w", err)
	}

	return &KafkaConsumer{consumer: consumer}, nil
}

func (kc *KafkaConsumer) ConsumeMessages(ctx context.Context, handler func(*game.MatchRequest) error) error {
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
			msg, err := kc.consumer.ReadMessage(100 * time.Millisecond)
			if err != nil {
				// Timeout is not an error, just means no message
				if err.(kafka.Error).Code() == kafka.ErrTimedOut {
					continue
				}
				return fmt.Errorf("consumer error: %w", err)
			}

			// Parse the message
			var request game.MatchRequest
			err = json.Unmarshal(msg.Value, &request)
			if err != nil {
				log.Printf("Failed to unmarshal message: %v\n", err)
				continue
			}

			// Process the message
			err = handler(&request)
			if err != nil {
				log.Printf("Failed to handle message: %v\n", err)
				continue
			}

			// Commit the offset after successful processing
			_, err = kc.consumer.CommitMessage(msg)
			if err != nil {
				log.Printf("Failed to commit offset: %v\n", err)
			}
		}
	}
}

// Close closes the consumer
func (kc *KafkaConsumer) Close() {
	kc.consumer.Close()
}
