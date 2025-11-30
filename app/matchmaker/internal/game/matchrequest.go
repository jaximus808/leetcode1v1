package game

import "github.com/google/btree"

type MatchRequest struct {
	PlayerID   string `json:"player_id"`
	EloRank    int    `json:"elo_rank"`
	Difficulty string `json:"difficulty"`
	MatchTime  string `json:"time"`
	Timestamp  int64  `json:"timestamp"`
}

func (mr *MatchRequest) Less(than btree.Item) bool {
	other := than.(*MatchRequest)
	if mr.EloRank == other.EloRank {
		return mr.PlayerID < other.PlayerID
	}
	return mr.EloRank < other.EloRank
}
