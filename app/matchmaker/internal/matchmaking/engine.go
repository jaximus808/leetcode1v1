package matchmaking

import (
	"fmt"
	"math"
	"time"

	"github.com/cse4207-fall-2025/finalproject-jujujaju/app/matchmaker/internal/broker"
	"github.com/cse4207-fall-2025/finalproject-jujujaju/app/matchmaker/internal/game"
	"github.com/google/btree"
)

type MatchMaker struct {
	MatchQueue chan (*game.MatchRequest)
	players    *btree.BTree
	producer   *broker.KafkaProducer
	matchRange float64
	timeMult   float64
}

func NewMatchMaker(producer *broker.KafkaProducer, matchRange float64, timeMult float64) *MatchMaker {
	return &MatchMaker{
		MatchQueue: make(chan (*game.MatchRequest), 1000),
		players:    btree.New(32),
		producer:   producer,
		matchRange: matchRange,
		timeMult:   timeMult,
	}
}

// acceptable range expands as tiemstamp that maxd of one the other players has been waiting for a match
func (mm *MatchMaker) determineMatch(p1 *game.MatchRequest, p2 *game.MatchRequest) bool {
	if p1 == nil || p2 == nil {
		return false
	}
	eloDiff := math.Abs(float64(p1.EloRank) - float64(p2.EloRank))

	return eloDiff <= mm.matchRange*(mm.timeMult*math.Max(float64(p1.Timestamp), float64(p2.Timestamp)))
}

func (mm *MatchMaker) publishMatches(p1 *game.MatchRequest, p2 *game.MatchRequest) error {
	match := &game.Match{
		MatchID:   fmt.Sprintf("match-%d", time.Now().Unix()),
		PlayerIDs: []string{p1.PlayerID, p2.PlayerID},
		CreatedAt: time.Now().Unix(),
	}

	// Publish the match
	err := mm.producer.PublishMatch(match)
	if err != nil {
		return fmt.Errorf("failed to publish match: %w", err)
	}
	return nil
}

// Every 2 pairs will be one match
func (mm *MatchMaker) attemptMatch() []*game.MatchRequest {
	matches := []*game.MatchRequest{}

	var prevPlayer *game.MatchRequest

	mm.players.Ascend(func(item btree.Item) bool {
		p := item.(*game.MatchRequest)
		if prevPlayer == nil {
			prevPlayer = p
			return true
		}

		if mm.determineMatch(prevPlayer, p) {
			matches = append(matches, p)
			matches = append(matches, prevPlayer)
			prevPlayer = nil
		} else {
			prevPlayer = p
		}
		return true
	})

	// delete from tree

	for _, match := range matches {
		mm.players.Delete(match)
	}
	return matches
}

func (mm *MatchMaker) StartEngine() {
	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()

	for {
		select {
		case req := <-mm.MatchQueue:
			mm.players.ReplaceOrInsert(req)
		case <-ticker.C:
			matches := mm.attemptMatch()
			for i := 0; i < len(matches); i += 2 {
				err := mm.publishMatches(matches[i], matches[i+1])
				if err != nil {
					// reinster into tree to try again
					mm.players.ReplaceOrInsert(matches[i])
					mm.players.ReplaceOrInsert(matches[i+1])
				}
			}
		}
	}
}
