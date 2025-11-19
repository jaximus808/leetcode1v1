package game

type QueueUpdates struct {
	PlayerID  string `json:"player_id"`
	Status    int    `json:"elo_rank"`
	Message   string `json:"msg"`
	Timestamp int64  `json:"timestamp"`
}
