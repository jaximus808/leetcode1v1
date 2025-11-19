package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/cse4207-fall-2025/finalproject-jujujaju/app/matchmaker/internal/broker"
	"github.com/cse4207-fall-2025/finalproject-jujujaju/app/matchmaker/internal/config"
	"github.com/cse4207-fall-2025/finalproject-jujujaju/app/matchmaker/internal/game"
	"github.com/cse4207-fall-2025/finalproject-jujujaju/app/matchmaker/internal/matchmaking"
)

func main() {
	producer, err := broker.CreateKafkaProducer(config.Brokers)
	if err != nil {
		log.Fatalf("Failed to create producer: %v", err)
	}
	defer producer.Close()

	// Create consumer
	consumer, err := broker.CreateKafkaConsumer(config.Brokers, "matchmaker-group", []string{"match-requests"})
	if err != nil {
		log.Fatalf("Failed to create consumer: %v", err)
	}
	defer consumer.Close()

	// Setup context for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Handle signals for graceful shutdown
	sigchan := make(chan os.Signal, 1)
	signal.Notify(sigchan, syscall.SIGINT, syscall.SIGTERM)

	// Starting Game Engine

	engine := matchmaking.NewMatchMaker(producer, 100, 0.01)

	go engine.StartEngine()

	// Start consuming in a goroutine
	go func() {
		err := consumer.ConsumeMessages(ctx, func(request *game.MatchRequest) error {
			log.Printf("Received match request: PlayerID=%s, Skill=%d\n",
				request.PlayerID, request.EloRank)

			engine.MatchQueue <- request

			log.Printf("Inserted into queue: %s\n", request.PlayerID)
			return nil
		})
		if err != nil {
			log.Printf("Consumer error: %v\n", err)
		}
	}()

	// Wait for interrupt signal
	log.Println("Matchmaker running. Press Ctrl+C to exit...")
	<-sigchan
	log.Println("Shutting down gracefully...")
	cancel()

	// Give goroutines time to finish
	time.Sleep(2 * time.Second)
	log.Println("Shutdown complete")
}
