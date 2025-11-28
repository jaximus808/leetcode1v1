package game

type Match struct {
	MatchID   string   `json:"match_id"`
	PlayerIDs []string `json:"player_ids"`
	CreatedAt int64    `json:"created_at"`
}
