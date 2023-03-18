// Game model

// Possible plays
enum Play {
    Rock = "rock",
    Paper = "paper",
    Scissors = "scissors",
}

// Possible game states
export type GameState =
    | WaitingState
    | NewGameState
    | IPlayedState
    | OtherPlayedState
    | BothPlayedState;

// Waiting for other player to connect
type WaitingState = {
    state: "Waiting";
};

// New game started
type NewGameState = {
    state: "NewGame";
};

// I played - waiting for other player
type IPlayedState = {
    state: "IPlayed";
    play: Play;
};

// Other player played - waiting for me
type OtherPlayedState = {
    state: "OtherPlayed";
    play: Play;
};

// Both players played
type BothPlayedState = {
    state: "BothPlayed";
    myPlay: Play;
    otherPlay: Play;
};

// Determine winner
function winner(myPlay: Play, otherPlay: Play): "me" | "other" | "tie" {
    if (myPlay === otherPlay) {
        return "tie";
    }
    if (
        (myPlay === Play.Rock && otherPlay === Play.Scissors) ||
        (myPlay === Play.Paper && otherPlay === Play.Rock) ||
        (myPlay === Play.Scissors && otherPlay === Play.Paper)
    ) {
        return "me";
    }
    return "other";
}
