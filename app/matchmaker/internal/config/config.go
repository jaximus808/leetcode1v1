package config

import "os"

func getBrokers() string {
	if brokers := os.Getenv("KAFKA_BROKERS"); brokers != "" {
		return brokers
	}
	return "kafka-svc:9093"
}

var Brokers = getBrokers()

var (
	TopicQueueUpdate = "queue-update"
	TopicMatchFound  = "match-found"
)
