package matchmaking

import (
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/cse4207-fall-2025/finalproject-jujujaju/app/matchmaker/internal/broker"
	"github.com/cse4207-fall-2025/finalproject-jujujaju/app/matchmaker/internal/game"
	"github.com/google/btree"
)

type MatchMaker struct {
	MatchQueue chan (*game.MatchRequest)
	players    map[int]*btree.BTree
	producer   *broker.KafkaProducer
	matchRange float64
	timeMult   float64
}

func NewMatchMaker(producer *broker.KafkaProducer, matchRange float64, timeMult float64) *MatchMaker {
	return &MatchMaker{
		MatchQueue: make(chan (*game.MatchRequest), 1000),
		players:    make(map[int]*btree.BTree),
		producer:   producer,
		matchRange: matchRange,
		timeMult:   timeMult,
	}
}

// acceptable range expands as tiemstamp that maxd of one the other players has been waiting for a match
// BUG: no matter what elo difference, players will be matched instantly
// FIX: Should be fixed now, before i didnt do its diff and just mul;tipeld time mult by the big ass timestamp lol, now its based on diff
func (mm *MatchMaker) determineMatch(p1 *game.MatchRequest, p2 *game.MatchRequest) bool {
	if p1 == nil || p2 == nil {
		return false
	}
	eloDiff := math.Abs(float64(p1.EloRank) - float64(p2.EloRank))

	fmt.Printf("EloDiff: %f", eloDiff)

	fmt.Printf("Match range %f", mm.matchRange*(1.0+mm.timeMult*math.Max(float64(time.Now().Unix()-p1.Timestamp), float64(time.Now().Unix()-p2.Timestamp))))
	return eloDiff <= mm.matchRange
	//*(1.0+mm.timeMult*math.Max(float64(time.Now().Unix()-p1.Timestamp), float64(time.Now().Unix()-p2.Timestamp)))
}

func (mm *MatchMaker) publishMatches(allMatches map[int][]*game.Match) error {
	// Publish the match
	//

	hasMatches := false
	for _, matches := range allMatches {
		if len(matches) > 0 {
			hasMatches = true
			break
		}
	}
	if !hasMatches {
		return nil
	}

	matchGroup := []*game.MatchGroup{}

	for keyCode, matches := range allMatches {

		if len(matches) == 0 {
			continue
		}

		diff, time := mm.decodeCode(keyCode)

		matchGroup = append(matchGroup, &game.MatchGroup{
			diff,
			time,
			matches,
		})
	}

	batch := &game.MatchBatch{
		Groups:    matchGroup,
		CreatedAt: time.Now().Unix(),
	}
	err := mm.producer.PublishMatch(batch)
	if err != nil {
		return fmt.Errorf("failed to publish match: %w", err)
	}
	return nil
}

// Every 2 pairs will be one match
func (mm *MatchMaker) attemptMatch() map[int][]*game.Match {
	allMatches := make(map[int][]*game.Match)

	for keyCode, playerQueue := range mm.players {
		toDel := []*game.MatchRequest{}
		matches := []*game.Match{}
		var prevPlayer *game.MatchRequest

		playerQueue.Ascend(func(item btree.Item) bool {
			p := item.(*game.MatchRequest)
			if prevPlayer == nil {
				prevPlayer = p
				return true
			}

			if mm.determineMatch(prevPlayer, p) {
				matches = append(matches, &game.Match{
					PlayerIDs: []string{prevPlayer.PlayerID, p.PlayerID},
				})
				toDel = append(toDel, prevPlayer)
				toDel = append(toDel, p)
				prevPlayer = nil
			} else {
				prevPlayer = p
			}
			return true
		})

		// delete from tree

		for _, match := range toDel {
			playerQueue.Delete(match)
		}

		allMatches[keyCode] = matches
	}

	return allMatches
}

// return diff, time
func (mm *MatchMaker) decodeCode(code int) (string, string) {
	var diff string
	var time string

	// decode difficulty (1–3)
	switch code % 10 {
	case 1:
		diff = "Easy"
	case 2:
		diff = "Medium"
	case 3:
		diff = "Hard"
	default:
		return "", ""
	}

	// decode time (10–30)
	switch code - (code % 10) {
	case 10:
		time = "10"
	case 20:
		time = "20"
	case 30:
		time = "30"
	default:
		return "", ""
	}

	return diff, time
}

// least sig digit is enum for difficult, most sig is for time
func (mm *MatchMaker) encodeCode(diff string, time string) int {
	code := 0

	switch strings.ToLower(diff) {
	case "easy":
		code += 1
	case "medium":
		code += 2
	case "hard":
		code += 3
	default:
		return -1
	}

	switch time {

	case "10":
		code += 10
	case "20":
		code += 20
	case "30":
		code += 30
	default:
		return -1
	}

	return code
}

func (mm *MatchMaker) StartEngine() {
	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()

	mm.players = make(map[int]*btree.BTree) // generates all our b trees
	for diff := 1; diff <= 3; diff++ {
		for t := 1; t <= 3; t++ {
			code := diff*10 + t
			mm.players[code] = btree.New(32)
		}
	}

	for {
		select {
		case req := <-mm.MatchQueue:

			queueKey := mm.encodeCode(req.Difficulty, req.MatchTime)
			if queueKey == -1 {
				fmt.Println("error no code could be generated")
			}

			playerQueue := mm.players[queueKey]
			playerQueue.ReplaceOrInsert(req)

			position := 0
			playerQueue.Ascend(func(item btree.Item) bool {
				p := item.(*game.MatchRequest)
				if p.EloRank <= req.EloRank {
					position++
				}
				if p.PlayerID == req.PlayerID {
					return false
				}
				return true
			})

			playersAhead := position - 1
			if playersAhead < 0 {
				playersAhead = 0
			}

			estimatedWait := (playersAhead / 2) * 2 // in seconds

			queueUpdate := &game.QueueUpdates{
				PlayerID:  req.PlayerID,
				Status:    1, // 1 = joined queue
				Message:   "joined queue",
				Position:  position,
				ETA:       estimatedWait,
				Timestamp: time.Now().Unix(),
			}

			err := mm.producer.PublishUpdate(queueUpdate)
			if err != nil {
				fmt.Printf("Failed to publish queue update: %v\n", err)
			} else {
				fmt.Printf("Player %s added to queue (code: %d)", req.PlayerID, queueKey)
			}

		case <-ticker.C:
			allMatches := mm.attemptMatch()

			err := mm.publishMatches(allMatches)
			if err != nil {
				fmt.Println("ERROR PUBLISHING MATCH HANDLE THIS!!!!!")
			}
			/* Deprecetated for now, just give them an error lmfao
				* if err != nil {
				for keyCode, matches := range allMatches {

					playerQueue := mm.players[keyCode]

					for _, match := range matches {

						playerQueue.ReplaceOrInsert(match)
						playerQueue.ReplaceOrInsert(match)
					}

				}
				// reinster into tree to try again
			} */
		}
	}
}
