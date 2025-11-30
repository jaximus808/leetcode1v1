package game

type Match struct {
	PlayerIDs []string `json:"player_ids"`
	CreatedAt int64    `json:"created_at"`
}

type MatchGroup struct {
	Difficulty   string   `json:"difficulty"`
	TimeDuration string   `json:"time_duration"`
	Matches      []*Match `json:"matches"`
}

type MatchBatch struct {
	Groups    []*MatchGroup `json:"groups"`
	CreatedAt int64         `json:"created_at"`
}
