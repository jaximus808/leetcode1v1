package game

type QueueUpdates struct {
	PlayerID  string `json:"player_id"`
	Status    int    `json:"elo_rank"`
	Message   string `json:"msg"`
	Position  int    `json:"position,omitempty"`
	ETA       int    `json:"eta,omitempty"`
	Timestamp int64  `json:"timestamp"`
}
